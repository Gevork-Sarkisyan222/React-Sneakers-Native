import { useMemo } from 'react';

/**
 * Хук для генерации подзаголовка периода распродажи от сегодняшнего дня на +7 дней.
 * Формат: "С D по D месяц"
 */
export function useSalePeriodSubtitle(): string {
  return useMemo(() => {
    const rusMonths = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ];

    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 7);

    const dayToday = today.getDate();
    const dayFuture = future.getDate();
    const monthName = rusMonths[today.getMonth()];

    return `С ${dayToday} по ${dayFuture} ${monthName}`;
  }, []);
}
