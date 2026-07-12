export interface UserState {
  isLoggedIn: boolean;
  isBlockedForOTPs: boolean;
  isBlockedByAdmin: boolean;
  authToken: string;
  refreshAuthToken: string;
  showGreeting: boolean;
  referralCode: string;
  equityEnable: boolean;
  profile: {
    userId: string;
    accountType: 'Individual' | 'Institutional';
    fullName: string;
    email: string;
    phoneNo: string;
    /** Optional country from USER_PROFILE API; may be name or ISO code */
    country?: string | null;
    roleId: number;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLogin: string;
    loginNotify: boolean;
    referralKey: string;
    cryptoEnable: boolean | null;
    cryptoActive?: string | null;
  };
}
