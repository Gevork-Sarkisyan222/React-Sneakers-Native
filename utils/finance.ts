// services/finance.ts
import axios from "axios";

export type MonthIncome = { year: number; month: number; income: number };
export type AppSettings = {
  id?: number;
  store_budget: number;
  months_income: MonthIncome[];
};

const API = axios.create({
  baseURL: "https://dcc2e55f63f7f47b.mokky.dev",
  // timeout: 10_000,
});

/**
 * Отправляет сумму в "финансы":
 *  - увеличивает store_budget на price
 *  - добавляет price в income текущего месяца (создаёт запись, если её нет)
 */
export async function sendToFinance(price: number): Promise<AppSettings> {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid price for finance update");
  }

  // 1) читаем текущие настройки
  const { data: settings } = await API.get<AppSettings>("/app-settings/1");

  const currentBudget = Number(settings?.store_budget ?? 0);
  const months = Array.isArray(settings?.months_income)
    ? settings.months_income
    : [];

  // 2) текущая дата
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0–11 -> 1–12

  // 3) апдейтим запись месяца
  const idx = months.findIndex((m) => m.year === year && m.month === month);
  const updatedMonths =
    idx >= 0
      ? months.map((m, i) =>
          i === idx ? { ...m, income: Number(m.income || 0) + price } : m
        )
      : [...months, { year, month, income: price }];

  // 4) одним PATCH обновляем оба поля
  const patchBody: Partial<AppSettings> = {
    store_budget: currentBudget + price,
    months_income: updatedMonths,
  };

  const { data: updated } = await API.patch<AppSettings>(
    "/app-settings/1",
    patchBody
  );
  return updated;
}
