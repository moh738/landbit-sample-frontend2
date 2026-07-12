import { createSlice } from '@reduxjs/toolkit';
import { UserState } from '../../interfaces/user/userInterface';

/**USER DETAILS SLICE */
const initialState: UserState = {
  isLoggedIn: false,
  isBlockedForOTPs: false,
  isBlockedByAdmin: false,
  authToken: '',
  refreshAuthToken: '',
  showGreeting: true,
  referralCode: '',
  equityEnable: false,
  profile: {
    userId: '',
    accountType: 'Individual',
    fullName: '',
    email: '',
    phoneNo: '',
    roleId: 0,
    isVerified: false,
    createdAt: '',
    updatedAt: '',
    lastLogin: '',
    loginNotify: false,
    referralKey: '',
    cryptoEnable: null,
  },
};

export const UserSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setIsLoggedIn: (state, param) => {
      const { payload } = param;
      state.isLoggedIn = payload;
    },
    setAuthToken: (state, param) => {
      const { payload } = param;
      state.authToken = payload;
    },
    setRefreshAuthToken: (state, param) => {
      const { payload } = param;
      state.refreshAuthToken = payload;
    },
    setReferralCode: (state, param) => {
      const { payload } = param;
      state.referralCode = payload;
    },
    setProfile: (state, param) => {
      const { payload } = param;
      state.profile = payload;
    },
    setIsBlockedForOTPs: (state, param) => {
      const { payload } = param;
      state.isBlockedForOTPs = payload;
    },
    setShowGreeting: (state, param) => {
      const { payload } = param;
      state.showGreeting = payload;
    },
    setIsBlockedByAdmin: (state, param) => {
      const { payload } = param;
      state.isBlockedByAdmin = payload;
    },
    setEquityEnable: (state, param) => {
      const { payload } = param;
      state.equityEnable = payload;
    },
    logoutUser: () => initialState,
  },
});

/**ACTIONS FOR SLICE*/
export const {
  setIsLoggedIn,
  setAuthToken,
  setReferralCode,
  setProfile,
  logoutUser,
  setIsBlockedForOTPs,
  setShowGreeting,
  setRefreshAuthToken,
  setIsBlockedByAdmin,
  setEquityEnable
} = UserSlice.actions;
