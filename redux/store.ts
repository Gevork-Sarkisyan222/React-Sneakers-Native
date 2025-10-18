import { configureStore } from "@reduxjs/toolkit";
import { productsSlice } from "./slices/products.slice";
import { auctionSlice } from "./slices/auction.slice";

export const store = configureStore({
  reducer: {
    products: productsSlice.reducer,
    auction: auctionSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
