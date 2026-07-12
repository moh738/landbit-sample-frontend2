type RootState = {
  otpData: {
    remainingTimeToResendOTP: number;
    blockRemainingSeconds: number;
  };
  loader: {
    isLoading: boolean;
    buttonLoaderDetails: any;
  };
  token: {
    nexoltSymbol: string;
    nexoltDecimals: number;
  };
  signUpProgress: {
    accountType: ACCOUNT_TYPES;
    signUprogressStatus: SignUpProgressStatus;
    signUpEmail: string;
  };
  loginProgress: {
    loginProgressStatus: LoginProgressStatus;
    loginEmail: string;
  };
  forgotPasswordProgress: {
    forgotPasswordProgressStatus: ForgotPasswordProgressStatus;
    forgotPasswordEmail: string;
    forgotPasswordToken: string;
  };
  onboarding: {
    onBoardingStatus: KYCStatus;
    reviewRejectType: reviewRejectType;
    kycAccessToken: string;
    sumsubEvent: string;
    numberofAttempts: number;
    reason: string;
    domesticAwaitingReview: boolean;
    verificationSteps: {
      ocr: boolean;
      liveness: boolean;
      docVerify: boolean;
    } | null;
  };
  marketPlace: {
    accountType: any,
    usdcPrice: number,
  };
  user: {
    isLoggedIn: boolean;
    authToken: string;
    isBlockedForOTPs: boolean;
    isBlockedByAdmin: boolean;
    showGreeting: boolean;
    referralCode: string;
    equityEnable: boolean;
    profile: {
      userId: string;
      accountType: 'Individual' | 'Institutional';
      fullName: string;
      email: string;
      phoneNo: string;
      roleId: number;
      isVerified: boolean;
      createdAt: string;
      updatedAt: string;
      lastLogin: string;
      loginNotify: boolean;
      referralKey: string;
      cryptoEnable: boolean | null;
      cryptoActive?: string | null;
      country:string
    };
  };
  wallet: {
    paymentStatus: {
      userId?: string;
      message?: string;
      transactionId?: string | number;
      status?: 'Pending' | 'Complete' | 'Rejected' | 'Failed' | 'Approved';
      amount?: number;
      paymentMethod?: string;
    } | null;
    panCardStatus: {
      userId?: string;
      message?: string;
      status?: 'pending' | 'complete' | 'rejected' | 'approved';
      reason?: string;
    } | null;
    orderStatus: {
      userId?: string;
      message?: string;
      orderId?: string | number;
      status?: 'Pending' | 'Completed' | 'Rejected' | 'Failed';
      propertyName?: string;
      quantity?: number;
      amount?: number;
    } | null;
    bankStatus: {
      userId?: string;
      message?: string;
      status?: 'Pending' | 'Complete' | 'Rejected' | 'Approved' | 'pending' | 'complete' | 'rejected' | 'approved';
      paymentThrough?: 'Bank' | 'UPI';
      previousStatus?: string;
    } | null;
    shouldRefreshTransactions: boolean;
    shouldRefreshWalletBalance: boolean;
    shouldRefreshPanCard: boolean;
    shouldRefreshReferrals: boolean;
    shouldRefreshOrders: boolean;
    shouldRefreshBankDetails: boolean;
    shouldRefreshDividends: boolean;
    shouldRefreshBuyback: boolean;
  };
};

type ACCOUNT_TYPES = 'Individual' | 'Institutional';

type SignUpFormData = {
  legalfname: string;
  email: string;
  phone: string;
  pass: string;
  cpass: string;
  check: boolean;
};

type LoginFormData = {
  email: string;
  pass: string;
};
