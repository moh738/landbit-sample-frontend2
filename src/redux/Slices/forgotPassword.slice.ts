import { createSlice } from '@reduxjs/toolkit';

/** FORGGOT PASSWORD SLICE */
const initialState = {
  forgotPasswordEmail: '',
  forgotPasswordToken: '',
};

export const ForgotPasswordSlice = createSlice({
  name: 'forgotPasswordProgress',
  initialState,
  reducers: {
    setForgotPasswordEmail: (state, param) => {
      const { payload } = param;
      state.forgotPasswordEmail = payload;
    },
    setForgotPasswordToken: (state, param) => {
      const { payload } = param;
      state.forgotPasswordToken = payload;
    },
  },
});

/** ACTIONS FOR SLICE */
export const { setForgotPasswordEmail, setForgotPasswordToken } =
  ForgotPasswordSlice.actions;
