import { Product } from '@/constants/Types';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ProductsState {
  products: Product[];
  removeAllMarks: boolean;
  updateAllFavorites: boolean;
  updateProductsEffect: boolean;
}

const initialState: ProductsState = {
  products: [] as Product[],

  // renders a useEffect
  removeAllMarks: false,

  // renders a useEffect
  updateAllFavorites: false,

  // renders a useEffect
  updateProductsEffect: false,
};

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    // renders a useEffect
    setRemoveAllMarks: (state, action: PayloadAction<boolean>) => {
      state.removeAllMarks = action.payload;
    },
    setUpdateAllFavorites: (state, action: PayloadAction<boolean>) => {
      state.updateAllFavorites = action.payload;
    },

    // renders a useEffect
    setUpdateProductsEffect: (state, action: PayloadAction<boolean>) => {
      state.updateProductsEffect = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setProducts, setRemoveAllMarks, setUpdateAllFavorites, setUpdateProductsEffect } =
  productsSlice.actions;

export default productsSlice.reducer;
