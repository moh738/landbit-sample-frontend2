import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { callGetMethod } from '../redux/Actions/api.action';
import { loader } from '../redux/Slices/loader.slice';

export const useFetchCreateOrder = () => {
  const dispatch = useDispatch();

  const fetchOrderHistory = useCallback(
    async (
      params: {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
        download?: boolean;
      } = {}
    ) => {
      try {
        const res: any = await callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.GET.GET_ORDER,
          params,
          showToaster: false,
          dispatch,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });
        return res;
      } catch (error: any) {
        console.error('Error fetchOrderHistory history:', error);
        throw error;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  return { fetchOrderHistory };
};
