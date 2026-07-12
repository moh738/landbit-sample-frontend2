export const API_ENDPOINTS = {
  GET: {
    //auth
    TIME_REMAINING_TO_REQUEST_NEXT_OTP: '/auth/resend-otp-time',
    REFRESH_TOKEN: 'auth/refresh-token',

    //user
    ONBOARDED_STATUS: '/user/get-onboarded-status',
    USER_PROFILE: '/user/profile',
    KYC_STATUS: '/user/kyc/status',
    /** KYC record: prefills, verificationSteps, kycStatus (same shape as legacy `/user/kyc/details` on some envs) */
    GET_KYC: '/user/kyc/details',
    GET_KYB: '/user/kyb',

    //Property
    ALL_PROPERTY: '/property/user/all',
    PROPERTY_DETAILS: '/property/user/details',
    EQUITY_DETAILS: '/equity/user/details',

    //wallet
    GET_WALLET_DETAIL: '/wallet/get-wallet',
    GET_AMOUNT: '/wallet/get-amount',
    GET_TRANSACTION_HISTORY: 'wallet/user-history',
    GET_ADMIN_WALLET: 'wallet/admin-wallet',
    GET_USER_SETTINGS: 'wallet/setting',
    USER_DEPOSIT_ADDRESS: '/wallet/user-deposit-address',

    // create order
    GET_ORDER: 'order/user/all',
    PORTFOLIO_USER: 'portfolio/user/all',

    // referral
    TOTAL_REFERRAL_DELIVERED: '/referral/user/referral-earnings',
    REFERRAL_COMMISSION_LIST: '/referral/user/commission-list',
    REFERRAL_HISTORY_LIST: '/referral/user/commission-ledger',

    // dashboard
    DASHBOARD_DATA: '/dashboard/user',
    DASHBOARD_USER_GRAPH: '/dashboard/user/graph',

    // dividend
    GET_DIVIDENDS: '/property/dividends',
    GET_DIVIDEND_STATS: '/property/dividends/stats',

    // oracle
    GET_USDC_PRICE: 'wallet/get-dollar-value',

    // buyback
    BUYBACK_REQUEST_LIST: '/buyback/user/all-requests',
    BUYBACK_USER_HISTORY: '/buyback/user/history',

    // exports (poll status by exportId)
    EXPORT_STATUS: 'admin/exports',
  },

  POST: {
    //auth
    REQUEST_SIGN_UP_OTP: '/auth/signup',
    REQUEST_LOGIN_OTP: '/auth/login',
    REQUEST_FORGOT_PASSWORD_OTP: '/auth/forgot-password',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    RESET_FORGOTTEN_PASSWORD: '/auth/reset-password',
    LOGOUT: '/auth/logout',

    //user
    UPDATE_EXISTING_PASSWORD: '/user/update-password',
    ONBOARDING_DATA: '',
    UPLOAD_DOCUMENTS: '/user/upload',
    INITIATE_KYC_SESSION: '/user/kyc/token',
    CREATE_KYC: '/user/kyc/manual',
    /** Domestic KYC OCR (new) (expects { documentFrontUrl, documentBackUrl?, docType }) */
    DOMESTIC_KYC_OCR: '/user/kyc/ocr',
    /** Domestic KYC document verification (expects { documentType, documentNumber, dob, fullName, ...optionalFields }) */
    DOMESTIC_KYC_VERIFY_DOC: '/user/kyc/domestic/verify-doc',
    /** Domestic KYC Liveness (expects { selfieUrl }) */
    DOMESTIC_KYC_LIVENESS: '/user/kyc/domestic/liveness',
    CREATE_KYB: '/user/kyb',

    //wallet
    CREATE_WALLET: '/wallet/create',
    DEPOSIT_AMOUNT: '/wallet/deposit',
    WITHDRAW_AMOUNT: '/wallet/withdraw',
    WITHDRAW_USDT: 'wallet/withdraw-usdt',
    PAN_CARD: '/wallet/pan-upload',
    IMAGE_URL: 'wallet/get-file-url',

    //order
    CREATE_ORDER: 'order/user/create',
    UPLOAD_MEDIA: '/order/user/upload-media',

    // buyback
    BUYBACK_CREATE_REQUEST: '/buyback/user/create-request',
  },

  PUT: {
    LOGIN_NOTIFY: '/user/login-notify',
  },

  DELETE: {},
};
