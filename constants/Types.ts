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
  position: string;
  avatarUri: string;
}
