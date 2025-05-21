import { AppSettingsType } from '@/constants/Types';
import { useState, useEffect } from 'react';

type Props = {
  productSaleInfo: AppSettingsType;
  currentPrice: string;
};

// Хук возвращает строку (цена со скидкой)
export function useGetPriceWithSale({ productSaleInfo, currentPrice }: Props): string {
  // Убираем из строки всё, кроме цифр и точки
  const cleanedPriceStr = currentPrice?.replace(/[^0-9.]/g, '');
  const parsedPrice = Number(cleanedPriceStr) || 0;

  // Если скидка тоже приходит строкой со спецсимволами — аналогично очищаем
  const cleanedDiscountStr = String(productSaleInfo?.sale_discount)?.replace(/[^0-9.]/g, '');
  const parsedDiscount = Number(cleanedDiscountStr) || 0;

  // Вычисляем все три варианта
  const blackFridaySalesPrice = Math.round(parsedPrice * 0.3); // 70% скидки
  const summerSalesPrice = Math.round(parsedPrice * 0.6); // 40% скидки
  const globalSalePrice = Math.round(parsedPrice * (1 - parsedDiscount / 100));

  // Приоритет акций: чёрная пятница → летняя распродажа → глобальная → обычная
  const currentPriceWithSale = (
    productSaleInfo?.black_friday
      ? blackFridaySalesPrice
      : productSaleInfo?.summer_sale
      ? summerSalesPrice
      : productSaleInfo?.sale
      ? globalSalePrice
      : parsedPrice
  ).toString();

  return currentPriceWithSale;
}
