import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { callGetMethod } from '../redux/Actions/api.action';
import { loader } from '../redux/Slices/loader.slice';

export const useGetAdminWallet = () => {
  const dispatch = useDispatch();

  const fetchAdminWallet = useCallback(async () => {
    try {
      const res: any = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.GET_ADMIN_WALLET,
        params: {},
        showToaster: false,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        token: true,
      });
      return res;
    } catch (error: any) {
      console.error('Error fetchAdminWallet data:', error);
      throw error;
    } finally {
      dispatch(loader(false));
    }
  }, [dispatch]);

  return { fetchAdminWallet };
};
