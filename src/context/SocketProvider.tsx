import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { socketService } from '../services/socket.service';
import store from '../redux/Store';
import {
  setNumberofAttempts,
  setOnboardingStatus,
  setReason,
  setReviewRejectType,
} from '../redux/Slices/completeOnboarding.slice';
import { useDispatch } from 'react-redux';
import {
  BankStatusResponse,
  BlockStatusResponse,
  BuybackStatusResponse,
  OrderStatusResponse,
  PanCardStatusResponse,
  PaymentStatusResponse,
  ReferralStatusResponse,
  VerificationStatusResponse,
} from '../interfaces/responses/types';
import {
  BANK_STATUS_SOCKET,
  BLOCK_STATUS,
  BUYBACK_STATUS_SOCKET,
  ORDER_SOCKET,
  PANCARD_SOCKET,
  PAYMENT_SOCKET,
  REFERRAL_SOCKET,
  VERIFICATION_STATUS,
} from '../constants/sockets/socketNames';
import Toast from '../components/common/Toast';
import { INDIVIDUAL } from '../constants/redux/auth/authConstants';
import { setIsBlockedByAdmin } from '../redux/Slices/user.slice';
import {
  setBankStatus,
  setPaymentStatus,
  setPanCardStatus,
  setShouldRefreshReferrals,
  setOrderStatus,
  setShouldRefreshDividends,
  setShouldRefreshBuyback,
} from '../redux/Slices/wallet.slice';
import { useOnboardingStatus } from '../hooks/authenticationHooks/useOnboardngStatus';

const normalizeKycStatus = (status: unknown): 'Initialised' | 'Pending' | 'Rejected' | 'Verified' | null => {
  if (status == null) return null;
  const normalized = String(status).trim().toLowerCase();
  if (normalized === 'verified' || normalized === 'verfied') return 'Verified';
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'initialised') return 'Initialised';
  return null;
};

type SocketCtx = {
  connected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
};

// Create the context for the socket
const Ctx = createContext<SocketCtx | null>(null);

// Create the socket provider
export function SocketProvider({
  token,
  baseURL,
  children,
}: {
  token?: string | null;
  baseURL: string;
  children: React.ReactNode;
}) {
  const [connected, setConnected] = useState(false);
  const dispatch = useDispatch();
  const { getUserProfile } = useOnboardingStatus();
  
  // init once per baseURL
  useEffect(() => {
    socketService.init(baseURL);
  }, [baseURL]);

  // connect/disconnect + lifecycle listeners
  useEffect(() => {
    if (!token) {
      socketService.disconnect();
      setConnected(false);
      return;
    }

    // Connect to the socket
    socketService.connect(token);

    // Define things that need to be done on connect
    const unsubscribeConnect = socketService.onConnect(() => {
      setConnected(true);
      // FLOW: We need to emit all socket events (verificationStatus, blockStatus, paymentUpdateStatus,
      //  orderUpdateStatus, referralUpdateStatus, panCardUpdateStatus) as the room will be created
      //  for the user on the behalf of userId
      const userId = store.getState().user.profile.userId;
      if (userId) {
        socketService.emit(VERIFICATION_STATUS, { userId });
        socketService.emit(BLOCK_STATUS, { userId });
        socketService.emit(PAYMENT_SOCKET, { userId });
        socketService.emit(ORDER_SOCKET, { userId });
        socketService.emit(REFERRAL_SOCKET, { userId });
        socketService.emit(PANCARD_SOCKET, { userId });
        socketService.emit(BANK_STATUS_SOCKET, { userId });
        socketService.emit(BUYBACK_STATUS_SOCKET, { userId });
      }
    });

    // Define things that need to be done on disconnect
    const unsubscribeDisconnect = socketService.onDisconnect(() =>
      setConnected(false)
    );

    // Define things that need to be done on connect error
    const unsubscribeConnectError = socketService.onConnectError(() =>
      setConnected(false)
    );

    // Define things that need to be done on verificationStatus socket event
    const unsubscribeVerificationStatus = socketService.on(
      VERIFICATION_STATUS,
      async (response: VerificationStatusResponse) => {
        const { numberofAttempts, reason } = response?.data;
        const normalizedKycStatus = normalizeKycStatus(response?.data?.kycStatus);
        dispatch(setOnboardingStatus(normalizedKycStatus));
        if (normalizedKycStatus === 'Verified') {
          const onboardingType =
            store.getState().user.profile.accountType === INDIVIDUAL ? 'KYC' : 'KYB';
          // Info: Using 5 seconds for onboarding success
          Toast.success(`Your ${onboardingType} is completed successfully`, {
            duration: 5000,
          });
          // Fetch updated user profile after admin accepts KYB/KYC (`getUserProfile` requires `Verified` in Redux)
          await getUserProfile();
        }
        // If kycStatus is Verified, we can set the reviewRejectType to null
        dispatch(setReviewRejectType(null));
        dispatch(setNumberofAttempts(numberofAttempts));
        dispatch(setReason(reason));
      }
    );

    // Define things that need to be done on blockStatus socket event
    const unsubscribeBlockStatus = socketService.on(
      BLOCK_STATUS,
      (response: BlockStatusResponse) => {
        const { block } = response;
        // FLOW: If we receive a block status from the socket, we need to logout the user
        if (block) {
          dispatch(setIsBlockedByAdmin(true));
        }
      }
    );

    // Define things that need to be done on paymentUpdateStatus socket event
    const unsubscribePaymentStatus = socketService.on(
      PAYMENT_SOCKET,
      (response: PaymentStatusResponse | any) => {
        const { message, transactionType, type } = response;
        dispatch(setPaymentStatus(response));
        const isDividendPayment = 
          transactionType === 'dividend' || 
          type === 'dividend' || 
          (response as any)?.dividendId !== undefined ||
          (response as any)?.data?.dividendId !== undefined;
        
        if (isDividendPayment) {
          dispatch(setShouldRefreshDividends(true));
        }
        
        if (message) {
          Toast.success(message, { duration: 5000 });
        }
      }
    );

    // Define things that need to be done on orderUpdateStatus socket event
    const unsubscribeOrderStatus = socketService.on(
      ORDER_SOCKET,
      (response: OrderStatusResponse | { userId: string; message: string }) => {
        const data = (response as OrderStatusResponse)?.data;
        const message = data?.message || (response as any)?.message;
        const userId = response?.userId;

        dispatch(
          setOrderStatus({
            userId,
            message,
            orderId: data?.orderId,
            status: data?.status,
            propertyName: data?.propertyName,
            quantity: data?.quantity,
            amount: data?.amount,
          })
        );

        if (message) {
          Toast.success(message, { duration: 5000 });
        }
      }
    );

    // Define things that need to be done on referralUpdateStatus socket event
    const unsubscribeReferralStatus = socketService.on(
      REFERRAL_SOCKET,
      (response: ReferralStatusResponse) => {
        const message = response?.data?.message || (response as any)?.message;
        dispatch(setShouldRefreshReferrals(true));
        if (message) {
          Toast.success(message, { duration: 5000 });
        }
      }
    );

    // Define things that need to be done on panCardUpdateStatus socket event
    const unsubscribePanCardStatus = socketService.on(
      PANCARD_SOCKET,
      (response: PanCardStatusResponse) => {
        const { message, status } = response;
        dispatch(setPanCardStatus({ ...response, status: status || 'pending' }));
        if (message) {
          Toast.success(message, { duration: 5000 });
        }
      }
    );

    const unsubscribeBankStatus = socketService.on(
      BANK_STATUS_SOCKET,
      (response: BankStatusResponse) => {
        const { message, status } = response;
        dispatch(setBankStatus({ ...response, status: status || 'pending' }));
        if (message) {
          Toast.success(message, { duration: 5000 });
        }
      }
    );

    const unsubscribeBuybackStatus = socketService.on(
      BUYBACK_STATUS_SOCKET,
      (response: BuybackStatusResponse | any) => {
        dispatch(setShouldRefreshBuyback(true));
        const message = response?.message || response?.data?.message;
        if (message) {
          Toast.success(message, { duration: 5000 });
        }
      }
    );

    // Define things that need to be done on disconnect
    return () => {
      unsubscribeConnect?.();
      unsubscribeDisconnect?.();
      unsubscribeConnectError?.();
      unsubscribeVerificationStatus?.();
      unsubscribeBlockStatus?.();
      unsubscribePaymentStatus?.();
      unsubscribeOrderStatus?.();
      unsubscribeReferralStatus?.();
      unsubscribePanCardStatus?.();
      unsubscribeBankStatus?.();
      unsubscribeBuybackStatus?.();
      socketService.disconnect();
    };
  }, [token, getUserProfile]);

  // Define the value to be returned
  const value = useMemo<SocketCtx>(
    () => ({
      connected,
      connect: (t: string) => socketService.connect(t),
      disconnect: () => socketService.disconnect(),
    }),
    [connected]
  );

  // Return the context provider
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Custom hook to use the socket context
export function useSocket() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSocket must be used within <SocketProvider>');
  return ctx;
}
