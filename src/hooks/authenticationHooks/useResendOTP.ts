import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { callGetMethod, callPostMethod } from '../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../services/api.service';
import { API_ENDPOINTS } from '../../constants/apis/apiEndpoints';
import Toast from '../../components/common/Toast';
import { OTPContext } from '../../constants/redux/auth/authConstants';
import {
  ResendOTPResponse,
  TimeRemainingToRequestNextOTPResponse,
} from '../../interfaces/responses/responses';
import { setIsBlockedForOTPs } from '../../redux/Slices/user.slice';
import {
  setBlockRemainingSeconds,
  setRemainingTimeToResendOTP,
} from '../../redux/Slices/otpData.slice';

export const useResendOTP = (context: OTPContext) => {
  const dispatch = useDispatch();
  const { isBlockedForOTPs } = useSelector((state: RootState) => state.user);
  const { blockRemainingSeconds, remainingTimeToResendOTP } = useSelector(
    (state: RootState) => state.otpData
  );

  const resendRef = useRef(remainingTimeToResendOTP);
  const blockRef = useRef(blockRemainingSeconds);

  useEffect(() => {
    resendRef.current = remainingTimeToResendOTP;
  }, [remainingTimeToResendOTP]);
  useEffect(() => {
    blockRef.current = blockRemainingSeconds;
  }, [blockRemainingSeconds]);

  const { signUpEmail } = useSelector((state: RootState) => state.signUpProgress);
  const { loginEmail } = useSelector((state: RootState) => state.loginProgress);
  const { forgotPasswordEmail } = useSelector(
    (state: RootState) => state.forgotPasswordProgress
  );

  const getEmailByContext = () => {
    if (context === 'signup') return signUpEmail;
    if (context === 'login') return loginEmail;
    if (context === 'forgotPassword') return forgotPasswordEmail;
    return undefined;
  };

  const getTimeRemainingToRequestNextOTP = async () => {
    try {
      const email = getEmailByContext();
      if (!email) return;

      const res: TimeRemainingToRequestNextOTPResponse = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.TIME_REMAINING_TO_REQUEST_NEXT_OTP,
        params: {
          email,
          context,
        },
        showToaster: false,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
      });
      if (res?.success) {
        const now = Date.now();
        const timeStamp = Number(res?.data?.otpTimeStamp) || 0;
        const secondsRemaining = Math.max(
          Math.floor((timeStamp + 60000 - now) / 1000),
          0
        );
        dispatch(setRemainingTimeToResendOTP(secondsRemaining));
        dispatch(setIsBlockedForOTPs(res?.data?.isBlocked));
        dispatch(
          setBlockRemainingSeconds(Number(res?.data?.blockRemainingSeconds) || 0)
        );
      } else {
        console.log(res?.message || 'Failed to get time remaining.');
      }
    } catch (err: any) {
      console.log(err.message || 'Error fetching time remaining.');
    }
  };

  useEffect(() => {
    getTimeRemainingToRequestNextOTP();
  }, []);

  // Resend countdown (not blocked)
  useEffect(() => {
    if (isBlockedForOTPs || remainingTimeToResendOTP <= 0) return;

    const t = setTimeout(() => {
      dispatch(setRemainingTimeToResendOTP(remainingTimeToResendOTP - 1));
    }, 1000);

    return () => clearTimeout(t);
  }, [isBlockedForOTPs, remainingTimeToResendOTP]); // no dispatch in deps

  // Block countdown (blocked)
  useEffect(() => {
    if (!isBlockedForOTPs || blockRemainingSeconds <= 0) return;

    const t = setTimeout(() => {
      dispatch(setBlockRemainingSeconds(blockRemainingSeconds - 1));
    }, 1000);

    return () => clearTimeout(t);
  }, [isBlockedForOTPs, blockRemainingSeconds]); // no dispatch in deps

  const handleResendOTP = async () => {
    try {
      const email = getEmailByContext();
      if (!email) return; // Do nothing if no email
      const res: ResendOTPResponse = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.RESEND_OTP,
        data: {
          email,
        },
        params: { context },
        showToaster: true,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
      });
      if (res?.success) {
        Toast.success(res?.message || 'OTP sent!');
      } else {
        Toast.error(res?.message || 'Failed to resend OTP.');
      }
      getTimeRemainingToRequestNextOTP();
    } catch (err: any) {
      Toast.error(err.message || 'Failed to resend OTP.');
    }
  };

  return {
    remainingTimeToResendOTP,
    isBlockedForOTPs,
    handleResendOTP,
    blockRemainingSeconds,
    getTimeRemainingToRequestNextOTP,
  };
};
