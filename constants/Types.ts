export interface Product {
  id: number;
  title: string;
  imageUri: string;
  price: string;
  isFavorite: boolean;
  isAddedToCart: boolean;
  description: string;
}

export interface CartProduct {
  id: number;
  title: string;
  imageUri: string;
  price: string;
}

export interface UserInterface {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  position: 'admin' | 'user';
  avatarUri: string;
}

// Новый тип для payload патч-запроса
export type SettingsPayload = Partial<{
  summer_sale: boolean;
  black_friday: boolean;
  sale: boolean;
  sale_discount: number;
}>;

export type AppSettingsType = {
  id: number;
  summer_sale: boolean;
  black_friday: boolean;
  sale: boolean;
  sale_discount?: number;
};
