import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Types {
  updateAuction: boolean;
}

const initialState: Types = {
  updateAuction: false,
};

export const auctionSlice = createSlice({
  name: "auction",
  initialState,
  reducers: {
    setUpdateAuction: (state, action: PayloadAction<boolean>) => {
      state.updateAuction = action.payload;
    },
  },
});

export const { setUpdateAuction } = auctionSlice.actions;

export default auctionSlice.reducer;
