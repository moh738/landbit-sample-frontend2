import { createSlice } from '@reduxjs/toolkit';
import { INDIVIDUAL } from '../../constants/redux/auth/authConstants';

/** SIGN UP PROGRESS SLICE */
const initialState = {
  accountType: INDIVIDUAL,
  signUpEmail: '',
};

export const SignUpProgressSlice = createSlice({
  name: 'signUpProgress',
  initialState,
  reducers: {
    setAccountType: (state, param) => {
      const { payload } = param;
      state.accountType = payload;
    },
    setSignUpEmail: (state, param) => {
      const { payload } = param;
      state.signUpEmail = payload;
    },
  },
});

/** ACTIONS FOR SLICE */
export const { setAccountType, setSignUpEmail } = SignUpProgressSlice.actions;
