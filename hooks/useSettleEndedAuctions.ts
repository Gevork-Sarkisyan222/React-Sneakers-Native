// hooks/useSettleEndedAuctions.ts
import { useEffect } from "react";
import axios from "axios";
import { sendToFinance } from "@/utils/finance";

// Типы — подгони под свои при необходимости
type AuctionBet = { userId: number; price: number };
type AuctionItem = {
  id: number;
  title: string;
  imageUrl: string;
  startPrice: number;
  currentPrice: number;
  endTime: string; // ISO
  bets: AuctionBet[];
  issued?: boolean; // будет появляться после выдачи приза
};

type User = {
  id: number;
  name: string;
  lastName: string;
  balance: number;
  // ...другие поля не обязательны
};

const AUCTIONS_URL = "https://dcc2e55f63f7f47b.mokky.dev/auction";
const CART_URL = "https://dcc2e55f63f7f47b.mokky.dev/cart";
const USERS_URL = "https://dcc2e55f63f7f47b.mokky.dev/users";

// В текущем рантайме не дублируем выдачу
const processed = new Set<number>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

/** Находим ПОСЛЕДНЮЮ ставку, равную currentPrice */
const findWinnerBid = (a: AuctionItem): AuctionBet | null =>
  (a.bets || [])
    .slice()
    .reverse()
    .find((b) => b.price === a.currentPrice) || null;

/** Проверка: есть ли уже в корзине этот товар (по title + imageUri + price "0") */
const cartHasItem = async (title: string, imageUri: string) => {
  try {
    const { data } =
      await axios.get<
        { id: number; title: string; imageUri: string; price: string }[]
      >(CART_URL);
    return (
      Array.isArray(data) &&
      data.some(
        (it) =>
          it.title === title && it.imageUri === imageUri && it.price === "0"
      )
    );
  } catch {
    // Если не смогли проверить — считаем, что нет (чтобы не блокировать выдачу)
    return false;
  }
};

/** Формируем payload в cart на основе завершившегося аукциона */
const buildCartPayloadFromAuction = (a: AuctionItem) => ({
  title: a.title,
  imageUri: a.imageUrl, // в корзине поле называется imageUri
  price: "0", // победитель уже «заплатил» — цена 0
});

/** Получаем пользователя (сначала по /users/:id, fallback по /users) */
const getUserById = async (userId: number): Promise<User | null> => {
  try {
    const { data } = await axios.get<User>(`${USERS_URL}/${userId}`);
    if (data && typeof data.id === "number") return data;
  } catch {
    // fallback: ищем в списке
    try {
      const { data } = await axios.get<User[]>(USERS_URL);
      const found = Array.isArray(data)
        ? data.find((u) => u.id === userId)
        : null;
      if (found) return found;
    } catch {
      /* ignore */
    }
  }
  return null;
};

/** Списываем у пользователя сумму (с защитой от отрицательного баланса) */
const debitUserBalance = async (userId: number, amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Invalid debit amount");

  const user = await getUserById(userId);
  if (!user) throw new Error(`User ${userId} not found`);

  const current = Number(user.balance ?? 0);
  const next = current - amount;

  // Если не хочешь уходить в минус — раскомментируй следующую строку:
  // const safeNext = Math.max(0, next);
  const safeNext = next;

  await axios.patch(`${USERS_URL}/${userId}`, { balance: safeNext });
  return safeNext;
};

/** Выдаём товар победителю, списываем деньги и отправляем в финансы */
const settleAuction = async (a: AuctionItem) => {
  if (processed.has(a.id)) return;
  if (a.issued === true) {
    processed.add(a.id);
    return;
  }

  const winner = findWinnerBid(a);
  if (!winner) {
    // Нет победителя — помечаем как обработанный в этом рантайме и выходим
    processed.add(a.id);
    return;
  }

  try {
    const value = Number(winner.price);
    if (!Number.isFinite(value) || value <= 0) {
      processed.add(a.id);
      return;
    }

    // 1) Списываем у победителя
    await debitUserBalance(winner.userId, value);

    // 2) Отправляем в финансы
    await sendToFinance(value);

    // 3) Закидываем товар в корзину (idempotent по наличию)
    const payload = buildCartPayloadFromAuction(a);
    const exists = await cartHasItem(payload.title, payload.imageUri);
    if (!exists) {
      await axios.post(CART_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4) Помечаем аукцион как «выдан»
    try {
      await axios.patch(
        `${AUCTIONS_URL}/${a.id}`,
        { issued: true },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch {
      // Если PATCH не поддержан — просто игнорируем, нас спасёт проверка корзины
    }

    processed.add(a.id);
    console.log(
      "[SETTLED]",
      a.id,
      "winner user:",
      winner.userId,
      "price:",
      value
    );
  } catch (e) {
    // Если что-то пошло не так — не помечаем processed/issued,
    // чтобы повторить попытку в следующем цикле/перезапуске
    console.warn("[SETTLE ERROR]", a.id, e);
  }
};

/** Хук: проверяет все аукционы и ставит таймеры на будущие окончания */
export function useSettleEndedAuctions(pollIntervalMs: number = 60_000) {
  useEffect(() => {
    let cancelled = false;

    const checkAll = async () => {
      try {
        const { data } = await axios.get<AuctionItem[]>(AUCTIONS_URL);
        if (cancelled) return;

        const now = Date.now();

        for (const a of data) {
          // Если уже отмечен как выданный — пропускаем и больше не трогаем
          if (a.issued === true) {
            processed.add(a.id);
            continue;
          }
          if (processed.has(a.id)) continue;

          const end = new Date(a.endTime).getTime();
          if (!Number.isFinite(end)) continue;

          if (end <= now) {
            // Уже закончился — выдаём сразу
            await settleAuction(a);
          } else if (!timers.has(a.id)) {
            // Ещё не закончился — единичный таймер на момент endTime
            const delay = end - now;
            const t = setTimeout(async () => {
              timers.delete(a.id);
              await settleAuction(a);
            }, delay);
            timers.set(a.id, t);
          }
        }
      } catch (e) {
        console.warn("[useSettleEndedAuctions] load failed", e);
      }
    };

    // Первый прогон + подстраховка поллингом (если ОС «усыпит» таймеры)
    checkAll();
    const poll = setInterval(checkAll, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(poll);
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [pollIntervalMs]);
}
