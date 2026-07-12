import { createSlice } from '@reduxjs/toolkit';

/**LOADER SLICE */
const initialState = {
  isLoading: false,
  buttonLoaderDetails: {},
};
export const LoaderSlice = createSlice({
  name: 'loader',
  initialState: initialState,
  reducers: {
    loader: (state, param) => {
      const { payload } = param;
      state.isLoading = payload;
    },
    buttonLoader: (state, param) => {
      const { payload } = param;
      state.buttonLoaderDetails = {
        ...state.buttonLoaderDetails,
        ...payload,
      };
    },

    resetLoader: () => initialState,
  },
});

/**ACTION FOR SLICE*/
export const { loader, buttonLoader, resetLoader } = LoaderSlice.actions;
