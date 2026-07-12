
export interface Bank {
  name: string;
  ifsc: string;
  icon: string;
  website: string;
}

export interface BankDetail {
  bankName?: string;
  holderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
}

export interface FormValues {
  bank: Bank | null;
  name: string;
  accountnumber: string;
  confirmAccountNumber: string;
  code: string;
  branch: string;
}

export interface AddUpiProps {
  closeAddUpiAccount: () => void;
  onSuccess?: () => void;
  closeAddBankAccount: () => void;
}


export interface PanCardDetail {
  fullName?: string;
  panNo?: string;
  panUrl?: string;
  dateOfBirth?: string;
  panStatus?: string;
  reason?: string;
}

export interface ImageUrlPayload {
  path: string;
}

