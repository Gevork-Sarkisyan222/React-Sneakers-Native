import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { AppSettingsType } from '@/constants/Types';

interface SalesInfoContextType {
  productSaleInfo: AppSettingsType;
  refresh: () => void;
}

const SalesInfoContext = createContext<SalesInfoContextType | undefined>(undefined);

export const SalesInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  return (
    <SalesInfoContext.Provider value={{ productSaleInfo, refresh: fetchSalesData }}>
      {children}
    </SalesInfoContext.Provider>
  );
};

// вот этот хук-потребитель — его и импортируешь в компонентах
export function useSalesInfo(): SalesInfoContextType {
  const ctx = useContext(SalesInfoContext);
  if (!ctx) {
    throw new Error('useSalesInfo должен вызываться внутри SalesInfoProvider');
  }
  return ctx;
}
