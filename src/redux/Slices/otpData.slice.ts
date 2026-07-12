import { createSlice } from '@reduxjs/toolkit';
import { OtpDataState } from '../../interfaces/onboarding/onboardingTypes';

/** OTP DATA SLICE */
const initialState: OtpDataState = {
  remainingTimeToResendOTP: 0,
  blockRemainingSeconds: 0,
};

export const OtpDataSlice = createSlice({
  name: 'otpData',
  initialState,
  reducers: {
    setRemainingTimeToResendOTP(state, param) {
      const { payload } = param;
      state.remainingTimeToResendOTP = payload;
    },
    setBlockRemainingSeconds(state, param) {
      const { payload } = param;
      state.blockRemainingSeconds = payload;
    },
  },
});

/** ACTIONS FOR SLICE */
export const { setRemainingTimeToResendOTP, setBlockRemainingSeconds } =
  OtpDataSlice.actions;
