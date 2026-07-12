import { createSlice } from '@reduxjs/toolkit';

/** LOGIN PROGRESS SLICE */
const initialState = {
  loginEmail: '',
};

export const LoginProgressSlice = createSlice({
  name: 'loginProgress',
  initialState,
  reducers: {
    setLoginEmail: (state, param) => {
      const { payload } = param;
      state.loginEmail = payload;
    },
  },
});

/** ACTIONS FOR SLICE */
export const { setLoginEmail } = LoginProgressSlice.actions;
