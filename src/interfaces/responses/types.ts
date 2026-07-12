export type KYCStatus = null | 'Initialised' | 'Pending' | 'Rejected' | 'Verified';

// If revewRejectType is FINAL, then the user is rejected permanently
// and user can only by unblocked by requesting sum sub platform. (which admin need to do manually)
// If revewRejectType is RETRY, then the user is rejected and can retry the review.
// Important: This field will only come in response if the KYCStatus is Rejected.
export type reviewRejectType = 'FINAL' | 'RETRY' | null;

// Sockets Responses
export type VerificationStatusResponse = {
  data: {
    kycStatus: KYCStatus;
    reason: string;
    numberofAttempts: number;
    reviewRejectType: reviewRejectType;
  };
  message: string;
  userId: string;
};

export type BlockStatusResponse = {
  block: boolean;
  userId: string;
};

export type PaymentStatusResponse = {
  userId: string;
  message: string;
  transactionId?: string | number;
  status?: 'Pending' | 'Complete' | 'Rejected' | 'Failed' | 'Approved';
  amount?: number;
  paymentMethod?: string;
};

export type OrderStatusResponse = {
  data: {
    orderId: string | number;
    status: 'Pending' | 'Completed' | 'Rejected' | 'Failed';
    propertyName?: string;
    quantity?: number;
    amount?: number;
    message?: string;
  };
  userId: string;
};

export type ReferralStatusResponse = {
  data: {
    referralId?: string | number;
    status: 'Pending' | 'Complete' | 'Rejected' | 'Failed';
    commissionAmount?: number;
    message?: string;
  };
  userId: string;
};

export type PanCardStatusResponse = {
  userId: string;
  message: string;
  status?: 'pending' | 'complete' | 'rejected' | 'approved';
  reason?: string;
};

export type BankStatusResponse = {
  userId: string;
  message: string;
  status?: 'Pending' | 'Complete' | 'Rejected' | 'Approved';
  paymentThrough?: 'Bank' | 'UPI';
  previousStatus?: string;
};

export type BuybackStatusResponse = {
  userId?: string;
  message?: string;
  data?: { buybackRequestId?: string; status?: string };
};

export type DividendStatusResponse = {
  userId: string;
  message?: string;
  data?: {
    dividendId?: string | number;
    status?: 'Pending' | 'Paid' | 'Failed' | 'Completed';
    amount?: number;
    totalDividendReceived?: number;
  };
};

export enum AdminExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type ExportStartResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data: { exportId: number };
};

export type ExportStatusResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    exportId: number;
    status: AdminExportStatus;
    downloadUrl?: string;
    expiresOn?: string;
    createdAt?: string;
    completedAt?: string;
  };
};
