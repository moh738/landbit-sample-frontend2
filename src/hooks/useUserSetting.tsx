import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { callGetMethod } from '../redux/Actions/api.action';
import { loader } from '../redux/Slices/loader.slice';

export const useUserSettings = () => {
  const dispatch = useDispatch();

  const fetchUserSettings = useCallback(async () => {
    try {
      const res: any = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.GET_USER_SETTINGS,
        params: {},
        showToaster: false,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        token: true,
      });
      return res;
    } catch (error: any) {
      console.error('Error fetching onboarding data:', error);
      throw error;
    } finally {
      dispatch(loader(false));
    }
  }, [dispatch]);

  return { fetchUserSettings };
};
