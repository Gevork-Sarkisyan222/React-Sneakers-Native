import { AppSettingsType } from '@/constants/Types';
import axios from 'axios';
import { useState, useEffect } from 'react';

interface ReturnType {
  productSaleInfo: AppSettingsType;
  setProductSaleInfo: React.Dispatch<React.SetStateAction<AppSettingsType>>;
  fetchSalesData: () => Promise<void>;
}

export function useGetSalesInfo(): ReturnType {
  const [productSaleInfo, setProductSaleInfo] = useState<AppSettingsType>({
    summer_sale: false,
    black_friday: false,
    sale: false,
    sale_discount: 0,
  });

  const fetchSalesData = async () => {
    try {
      const { data } = await axios.get<AppSettingsType>(
        'https://dcc2e55f63f7f47b.mokky.dev/app-settings/1',
      );
      setProductSaleInfo(data);
    } catch (err) {
      console.error('Не удалось загрузить данные', err);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  return { productSaleInfo, setProductSaleInfo, fetchSalesData };
}
