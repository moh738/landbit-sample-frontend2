import { UserState } from '../user/userInterface';
import { KYCStatus, reviewRejectType } from './types';

export interface UserProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: UserState['profile'];
}

export interface LoginResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    otpTimeStamp: string;
  };
}

export interface TimeRemainingToRequestNextOTPResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    isBlocked: boolean;
    otpTimeStamp: string;
    blockRemainingSeconds: string;
  };
}

export interface ResendOTPResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    otpTimeStamp: string;
  };
}

export interface GetKYCTokenResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    token: string;
  };
}

/** Per-step completion flags from GET KYC status (Protean / domestic flow). */
export interface KycVerificationSteps {
  ocr: boolean;
  liveness: boolean;
  docVerify: boolean;
}

export interface CheckKYCStatusResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    kycStatus: KYCStatus;
    numberofAttempts: number;
    reason: string;
    reviewRejectType: reviewRejectType;
    /** When present, drives which Protean step to open when a step failed or needs redo */
    verificationSteps?: KycVerificationSteps;
    fullName?: string;
  };
}

export interface LoginNotifyResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: null;
}
