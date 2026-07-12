import { createSlice } from '@reduxjs/toolkit';


/** MARKET PLACE SLICE */
const initialState = {
  accountType: 'FRACTIONAL',
  usdcPrice: 0,
};

export const MarketPlaceSlice = createSlice({
  name: 'marketPlace',
  initialState,
  reducers: {
    setAccountType: (state, param) => {
      const { payload } = param;
      state.accountType = payload;
    },
    setUsdcPrice: (state, param) => {
      const { payload } = param;
      state.usdcPrice = payload;
    },
  },
});
export const { setAccountType, setUsdcPrice } = MarketPlaceSlice.actions;
