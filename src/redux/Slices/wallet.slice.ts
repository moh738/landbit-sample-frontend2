import { createSlice } from '@reduxjs/toolkit';

/**WALLET SLICE */
const initialState = {
  paymentStatus: null as {
    userId?: string;
    message?: string;
    transactionId?: string | number;
    status?: 'Pending' | 'Complete' | 'Rejected' | 'Failed' | 'Approved';
    amount?: number;
    paymentMethod?: string;
  } | null,
  panCardStatus: null as {
    userId?: string;
    message?: string;
    status?: 'pending' | 'complete' | 'rejected' | 'approved';
    reason?: string;
  } | null,
  shouldRefreshTransactions: false,
  shouldRefreshWalletBalance: false,
  shouldRefreshPanCard: false,
  shouldRefreshReferrals: false,
  orderStatus: null as {
    userId?: string;
    message?: string;
    orderId?: string | number;
    status?: 'Pending' | 'Completed' | 'Rejected' | 'Failed';
    propertyName?: string;
    quantity?: number;
    amount?: number;
  } | null,
  shouldRefreshOrders: false,
  bankStatus: null as {
    userId?: string;
    message?: string;
    status?: 'Pending' | 'Complete' | 'Rejected' | 'Approved' | 'pending' | 'complete' | 'rejected' | 'approved';
    paymentThrough?: 'Bank' | 'UPI';
    previousStatus?: string;
  } | null,
  shouldRefreshBankDetails: false,
  shouldRefreshDividends: false,
  shouldRefreshBuyback: false,
};

export const WalletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setPaymentStatus: (state, param) => {
      const { payload } = param;
      state.paymentStatus = payload;
      // Set refresh flags to true when payment status is updated
      state.shouldRefreshTransactions = true;
      state.shouldRefreshWalletBalance = true;
    },
    clearPaymentStatus: (state) => {
      state.paymentStatus = null;
    },
    setShouldRefreshTransactions: (state, param) => {
      const { payload } = param;
      state.shouldRefreshTransactions = payload;
    },
    setShouldRefreshWalletBalance: (state, param) => {
      const { payload } = param;
      state.shouldRefreshWalletBalance = payload;
    },
    setPanCardStatus: (state, param) => {
      const { payload } = param;
      state.panCardStatus = payload;
      state.shouldRefreshPanCard = true;
    },
    clearPanCardStatus: (state) => {
      state.panCardStatus = null;
    },
    setShouldRefreshPanCard: (state, param) => {
      const { payload } = param;
      state.shouldRefreshPanCard = payload;
    },
    setShouldRefreshReferrals: (state, param) => {
      const { payload } = param;
      state.shouldRefreshReferrals = payload;
    },
    setOrderStatus: (state, param) => {
      const { payload } = param;
      state.orderStatus = payload;
      // Set refresh flag to true when order status is updated
      state.shouldRefreshOrders = true;
    },
    clearOrderStatus: (state) => {
      state.orderStatus = null;
    },
    setShouldRefreshOrders: (state, param) => {
      const { payload } = param;
      state.shouldRefreshOrders = payload;
    },
    setBankStatus: (state, param) => {
      const { payload } = param;
      state.bankStatus = payload;
      state.shouldRefreshBankDetails = true;
    },
    clearBankStatus: (state) => {
      state.bankStatus = null;
    },
    setShouldRefreshBankDetails: (state, param) => {
      const { payload } = param;
      state.shouldRefreshBankDetails = payload;
    },
    setShouldRefreshDividends: (state, param) => {
      const { payload } = param;
      state.shouldRefreshDividends = payload;
    },
    setShouldRefreshBuyback: (state, param) => {
      const { payload } = param;
      state.shouldRefreshBuyback = payload;
    },
  },
});

/**ACTIONS FOR SLICE*/
export const {
  setPaymentStatus,
  clearPaymentStatus,
  setShouldRefreshTransactions,
  setShouldRefreshWalletBalance,
  setPanCardStatus,
  clearPanCardStatus,
  setShouldRefreshPanCard,
  setShouldRefreshReferrals,
  setOrderStatus,
  clearOrderStatus,
  setShouldRefreshOrders,
  setBankStatus,
  clearBankStatus,
  setShouldRefreshBankDetails,
  setShouldRefreshDividends,
  setShouldRefreshBuyback,
} = WalletSlice.actions;

