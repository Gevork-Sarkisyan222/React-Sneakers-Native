export interface Product {
  id: number;
  title: string;
  imageUri: string;
  price: string;
  isFavorite: boolean;
  isAddedToCart: boolean;
  description: string;
  rating: number;
  comments: Comment[];
}

export interface Comment {
  id: number;
  user_id: number;
  text: string;
  created_at: string; // ISO 8601, например "2025-05-17T12:00:00Z"
  stars: number; // от 1 до 5
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
  position: "admin" | "user" | "superadmin" | "owner";
  avatarUri: string;

  // Новые поля блокировки:
  isBlocked: boolean;
  banStart?: null | string; // ISO‑строка: когда заблокировали
  banUntil?: null | string;
  blockReason?: null | string;
  blockedBy?: null | string;
}

// Новый тип для payload патч-запроса
export type SettingsPayload = Partial<{
  summer_sale: boolean;
  black_friday: boolean;
  sale: boolean;
  sale_discount: number;
}>;

export type AppSettingsType = {
  id?: number;
  summer_sale: boolean;
  black_friday: boolean;
  sale: boolean;
  sale_discount?: number;
  isStoreOpen: boolean;
};

export type SneakerCase = {
  id: string;
  title: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  price: number;
  itemsInside: number;
  imageUrl: string;
  backgroundImage: string;
  items: CaseItem[];
};

export type ItemRarity = "common" | "rare" | "epic" | "legendary";

export type CaseItem = {
  item_id: number;
  item_title: string;
  item_imageUrl: string;
  item_price: number;
  item_rarity: ItemRarity;
  item_type: string;
};
