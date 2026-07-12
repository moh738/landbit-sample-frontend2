import {
  BankStatusResponse,
  BlockStatusResponse,
  BuybackStatusResponse,
  OrderStatusResponse,
  PanCardStatusResponse,
  PaymentStatusResponse,
  ReferralStatusResponse,
  VerificationStatusResponse,
} from './types';

// Define the types for the client to server events
export interface ClientToServer {
  verificationStatus: { userId: string };
  blockStatus: { userId: string };
  paymentUpdateStatus: { userId: string };
  orderUpdateStatus: { userId: string };
  referralUpdateStatus: { userId: string };
  panCardUpdateStatus: { userId: string };
  bankStatusSocket: { userId: string };
  buyback_socket: { userId: string };
}

// Define the types for the server to client events
export interface ServerToClient {
  verificationStatus: VerificationStatusResponse;
  blockStatus: BlockStatusResponse;
  paymentUpdateStatus: PaymentStatusResponse;
  orderUpdateStatus: OrderStatusResponse;
  referralUpdateStatus: ReferralStatusResponse;
  panCardUpdateStatus: PanCardStatusResponse;
  bankStatusSocket: BankStatusResponse;
  buyback_socket: BuybackStatusResponse;
}
