export interface Product {
  id: number;
  title: string;
  imageUri: string;
  price: string;
  isFavorite: boolean;
  isAddedToCart: boolean;
}

export interface CartProduct {
  id: number;
  title: string;
  imageUri: string;
  price: string;
}
