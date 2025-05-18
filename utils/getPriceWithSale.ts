import { AppSettingsType } from '@/constants/Types';

export function getPriceWithSale(price: string, productSaleInfo: AppSettingsType | undefined) {
  if (!price) return { originalPrice: 0, finalPrice: 0 };

  const cleanedPriceStr = String(price).replace(/[^0-9.]/g, '');
  const parsedPrice = Number(cleanedPriceStr) || 0;

  const cleanedDiscountStr = String(productSaleInfo?.sale_discount).replace(/[^0-9.]/g, '');
  const parsedDiscount = Number(cleanedDiscountStr) || 0;

  const blackFridaySalesPrice = Math.round(parsedPrice * 0.3); // 70% скидка
  const summerSalesPrice = Math.round(parsedPrice * 0.6); // 40% скидка
  const globalSalePrice = Math.round(parsedPrice * (1 - parsedDiscount / 100));

  const isBlackFriday = !!productSaleInfo?.black_friday;
  const isSummerSale = !!productSaleInfo?.summer_sale;
  const isGlobalSale = !!productSaleInfo?.sale;

  const finalPrice = isBlackFriday
    ? blackFridaySalesPrice
    : isSummerSale
    ? summerSalesPrice
    : isGlobalSale
    ? globalSalePrice
    : parsedPrice;

  const hasDiscount = finalPrice < parsedPrice;

  return {
    originalPrice: parsedPrice,
    finalPrice,
    hasDiscount,
  };
}
