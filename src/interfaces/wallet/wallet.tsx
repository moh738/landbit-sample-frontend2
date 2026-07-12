export interface WalletTableProps {
  activeTab: 'Deposit' | 'Withdrawal';
}

export interface Transaction {
  amount: string;
  nickName: string;
  trxId: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Failed';
}



export interface TokenDetail {
  blockchain: string;
  tokenSymbol: string;
  lockUpPeriod: string;
  maxInvestment: string;
  listingType: any;
  totalTokenSupply: string;
  buyBackPeriod: string;
  minInvestment: string;
  marketPlaceActiveTab?: string;
  [key: string]: any; // for any extra fields
}