import { Product } from "@/constants/Types";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ProductsState {
  products: Product[];
  removeAllMarks: boolean;
  updateAllFavorites: boolean;
  updateProductsEffect: boolean;
  updateCases: boolean;
}

const initialState: ProductsState = {
  products: [] as Product[],

  // renders a useEffect
  removeAllMarks: false,

  // renders a useEffect
  updateAllFavorites: false,

  // renders a useEffect
  updateProductsEffect: false,

  // renders a useEffect to update cases
  updateCases: false,
};

export const productsSlice = createSlice({
  name: "products",
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

    // for cases brotha
    setUpdateCases: (state, action: PayloadAction<boolean>) => {
      state.updateCases = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setProducts,
  setRemoveAllMarks,
  setUpdateAllFavorites,
  setUpdateProductsEffect,
  setUpdateCases,
} = productsSlice.actions;

export default productsSlice.reducer;
