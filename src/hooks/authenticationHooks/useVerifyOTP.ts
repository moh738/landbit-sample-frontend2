import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/common/Toast';
import { landbitBackendUrl } from '../../services/api.service';
import { API_ENDPOINTS } from '../../constants/apis/apiEndpoints';
import { callPostMethod } from '../../redux/Actions/api.action';
import { OTPContext } from '../../constants/redux/auth/authConstants';
import { setForgotPasswordToken } from '../../redux/Slices/forgotPassword.slice';
import { useAuthentication } from './useAuthentication';
import { useResendOTP } from './useResendOTP';
import { setRefreshAuthToken } from '../../redux/Slices/user.slice';

export const useVerifyOTP = (
  setOTP: (otp: string) => void,
  setResetKey: (cb: (prev: number) => number) => void,
  context: OTPContext
) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { signUpEmail } = useSelector((state: RootState) => state.signUpProgress);
  const { loginEmail } = useSelector((state: RootState) => state.loginProgress);
  const { forgotPasswordEmail } = useSelector(
    (state: RootState) => state.forgotPasswordProgress
  );

  const { handleLogin } = useAuthentication();

  const { getTimeRemainingToRequestNextOTP } = useResendOTP(context);

  const verifyOTP = async (OTP: string) => {
    try {
      const res = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.VERIFY_OTP,
        data: {
          email:
            context === 'signup'
              ? signUpEmail
              : context === 'login'
                ? loginEmail
                : forgotPasswordEmail,
          otp: OTP,
        },
        params: { context },
        showToaster: false,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
      });
      if (res?.success) {
        Toast.success(res?.message || 'OTP verified!');
        if (context === 'forgotPassword') {
          // if the context was forgotPassword then user is basically allowed to change the password
          // so on successful verification, we need to navigate to the change password page
          navigate('/forgot-password/change-password', { replace: true });
          dispatch(setForgotPasswordToken(res?.data?.token || ''));
        } else {
          // Currently we only have signIn or login so we can use handleLogin in else block
          // So these are basically login and signIn cases
          // todo: use await for handleLogin
          handleLogin(res?.data?.token || '');
          dispatch(setRefreshAuthToken(res?.data?.refreshToken));
          navigate('/user/dashboard');
        }
      } else {
        getTimeRemainingToRequestNextOTP();
        // Info: Using 8 seconds for otp errors
        Toast.error(res?.message, { duration: 8000 });
        setOTP('');
        setResetKey((prev) => prev + 1);
      }
    } catch (err: any) {
      Toast.error(err.message);
    }
  };

  return verifyOTP;
};
