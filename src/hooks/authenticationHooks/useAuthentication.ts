import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setIsLoggedIn, setAuthToken } from '../../redux/Slices/user.slice';
import { setLoginEmail } from '../../redux/Slices/loginProgress.slice';
import { setSignUpEmail } from '../../redux/Slices/signUpProgress.slice';
import { setForgotPasswordEmail } from '../../redux/Slices/forgotPassword.slice';
import { useOnboardingStatus } from './useOnboardngStatus';
import { callPostMethod, callPutMethod } from '../../redux/Actions/api.action';
import store from '../../redux/Store';
import { landbitBackendUrl } from '../../services/api.service';
import { API_ENDPOINTS } from '../../constants/apis/apiEndpoints';
import { resetRedux } from '../../helpers/cache/cacheManager';
import Toast from '../../components/common/Toast';
import { LoginNotifyResponse } from '../../interfaces/responses/responses';
import { useCallback } from 'react';
import { setUsdcPrice } from '../../redux/Slices/marketPlace.slice ';

export const useAuthentication = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { getUserProfile } = useOnboardingStatus();

  const handleLogin = async (token: string) => {
    dispatch(setAuthToken(token));
    dispatch(setIsLoggedIn(true));
    handleResetAuthProgress();
    await getUserProfile();
    await getUsdcPrice();
  };

  const handleLogout = async () => {
    try {
      window.zE?.('messenger', 'logoutUser');
      window.zE?.('messenger', 'hide');
      dispatch(setIsLoggedIn(false));

      const authToken = store.getState().user.authToken;

      if (authToken) {
        await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.LOGOUT,
          data: {},
          params: {},
          showToaster: true,
          dispatch,
          showLoader: true,
          showButtonLoader: false,
          token: true,
        });
      }
    } catch (err: any) {
      console.log(err.message || 'Error during logout.');
    } finally {
      resetRedux();
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    }
  };

  /** Resets loginEmail, signUpEmail, forgotPasswordEmail */
  const handleResetAuthProgress = () => {
    dispatch(setLoginEmail(''));
    dispatch(setSignUpEmail(''));
    dispatch(setForgotPasswordEmail(''));
  };

  // This function helps to enable or disable the login notifications (example: you just logged in on this device)
  const handleLoginNotify = async (enable: boolean): Promise<void> => {
    try {
      const authToken = store.getState().user.authToken;

      if (!authToken) return;

      const res: LoginNotifyResponse = await callPutMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.PUT.LOGIN_NOTIFY,
        data: { enable },
        params: {},
        showToaster: false,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        token: true,
      });
      if (res?.success) {
        Toast.success(res?.message);
        // Calling getUserProfile so that we fetch the latest loginNotify status
        // as the loginNotify status is not provided in the response of the loginNotify API
        await getUserProfile();
      } else {
        console.log(res?.message || 'Failed to update login notify.');
      }
    } catch (err: any) {
      console.log(err.message || 'Error updating login notify.');
    }
  };

  /**
   * get usdc price
   */
  const getUsdcPrice = useCallback(async () => {
    try {
      const authToken = store.getState().user.authToken;

      if (!authToken) return;

      // const res = await callGetMethod({
      //   apiUrl: landbitBackendUrl,
      //   endpoint: API_ENDPOINTS.GET.TOTAL_REFERRAL_DELIVERED,
      //   params: {},
      //   showToaster: false,
      //   dispatch,
      //   showLoader: true,
      //   showButtonLoader: false,
      //   token: true,
      // });

      // if (res?.success) {
      // dispatch(setUsdcPrice(res?.data?.usdcPrice));
      dispatch(setUsdcPrice(86.9));
      // } else {
      //   console.log(res?.message || 'Failed to get total referral delivered.');
      // }
    } catch (err: any) {
      console.log(err.message || 'Error fetching total referral delivered.');
    }
  }, [dispatch]);

  return {
    handleLogin,
    handleLogout,
    handleResetAuthProgress,
    handleLoginNotify,
    getUsdcPrice,
  };
};
