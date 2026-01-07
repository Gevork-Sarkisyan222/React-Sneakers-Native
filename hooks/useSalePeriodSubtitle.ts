import { useMemo } from 'react';

/**
 * Hook to generate a sale period subtitle from today through +7 days.
 * Format: "From D to D month"
 */
export function useSalePeriodSubtitle(): string {
  return useMemo(() => {
    const rusMonths = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 7);

    const dayToday = today.getDate();
    const dayFuture = future.getDate();
    const monthName = rusMonths[today.getMonth()];

    return `From ${dayToday} to ${dayFuture} ${monthName}`;
  }, []);
}
