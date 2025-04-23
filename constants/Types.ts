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
