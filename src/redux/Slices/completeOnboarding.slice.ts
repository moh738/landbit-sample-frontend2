import { createSlice } from '@reduxjs/toolkit';
import type { KycVerificationSteps } from '../../interfaces/responses/responses';

/** onboarding SLICE */
const initialState = {
  onBoardingStatus: null,
  kycAccessToken: null,
  sumsubEvent: null,
  numberofAttempts: 0,
  reason: '',
  reviewRejectType: null,
  verificationSteps: null as KycVerificationSteps | null,
};

export const OnboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setOnboardingStatus: (state, param) => {
      const { payload } = param;
      state.onBoardingStatus = payload;
    },
    setKycAccessToken: (state, param) => {
      const { payload } = param;
      state.kycAccessToken = payload;
    },
    setSumbsubEvent: (state, param) => {
      const { payload } = param;
      state.sumsubEvent = payload;
    },
    setNumberofAttempts: (state, param) => {
      const { payload } = param;
      state.numberofAttempts = Number(payload);
    },
    setReason: (state, param) => {
      const { payload } = param;
      state.reason = payload;
    },
    setReviewRejectType: (state, param) => {
      const { payload } = param;
      state.reviewRejectType = payload;
    },
    setVerificationSteps: (state, param) => {
      const { payload } = param;
      state.verificationSteps = payload;
    },
  },
});

/** ACTIONS FOR SLICE */
export const {
  setOnboardingStatus,
  setKycAccessToken,
  setSumbsubEvent,
  setNumberofAttempts,
  setReason,
  setReviewRejectType,
  setVerificationSteps,
} = OnboardingSlice.actions;
