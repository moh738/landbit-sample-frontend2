import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { callGetMethod } from '../redux/Actions/api.action';
import { loader } from '../redux/Slices/loader.slice';

export const useGetAmount = () => {
  const dispatch = useDispatch();

  const fetchAmount = useCallback(async () => {
    try {
      const res: any = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.GET_AMOUNT,
        params: {},
        showToaster: false,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        token: true,
      });
      return res;
    } catch (error: any) {
      console.error('Error fetchAmount data:', error);
      throw error;
    } finally {
      dispatch(loader(false));
    }
  }, [dispatch]);

  return { fetchAmount };
};
