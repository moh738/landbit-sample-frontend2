import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { callGetMethod } from '../redux/Actions/api.action';
import { loader } from '../redux/Slices/loader.slice';

export const useDepositAddress = () => {
  const dispatch = useDispatch();

  const fetchDepositAddress = useCallback(async (showLoader: boolean = false) => {
    try {
      const res: any = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.USER_DEPOSIT_ADDRESS,
        params: {},
        showToaster: false,
        dispatch,
        showLoader,
        showButtonLoader: false,
        token: true,
      });
      return res;
    } catch (error: any) {
      console.error('Error fetching deposit address:', error);
      throw error;
    } finally {
      if (showLoader) {
        dispatch(loader(false));
      }
    }
  }, [dispatch]);

  return { fetchDepositAddress };
};


