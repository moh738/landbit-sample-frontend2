// This one provides us the status of the KYC/KYB and the reason for the rejection
export const VERIFICATION_STATUS = 'verificationStatus';
// This one tells us whether the user is blocked from platform
// due to multiple times KYC/KYB rejection
export const BLOCK_STATUS = 'blockStatus';


// This one provides us the status update for payment transactions
export  const PAYMENT_SOCKET = 'paymentUpdateStatus';

// This one provides us the status update for order transactions
export const ORDER_SOCKET = 'orderUpdateStatus';

// This one provides us the status update for referral transactions
export const REFERRAL_SOCKET = 'referralUpdateStatus';

// This one provides us the status update for PAN card verification
export const PANCARD_SOCKET = 'panCardUpdateStatus';

// This one provides us the status update for bank/UPI account verification
export const BANK_STATUS_SOCKET = 'bankStatusSocket';

// Buyback request status updates (table, cards, modal, order history refresh)
export const BUYBACK_STATUS_SOCKET = 'buyback_socket';
