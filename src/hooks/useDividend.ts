import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { callGetMethod } from '../redux/Actions/api.action';
import { loader } from '../redux/Slices/loader.slice';

export const useDividend = () => {
  const dispatch = useDispatch();

  const fetchDividends = useCallback(
    async (params: {
      page?: number;
      limit?: number;
      status?: string;
      download?: boolean;
    } = {}) => {
      try {
        const res: any = await callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.GET.GET_DIVIDENDS,
          params,
          showToaster: false,
          dispatch,
          showLoader: !params.download,
          showButtonLoader: false,
          token: true,
        });
        return res;
      } catch (error: any) {
        console.error('Error fetching dividends:', error);
        throw error;
      } finally {
        if (!params.download) {
          dispatch(loader(false));
        }
      }
    },
    [dispatch]
  );

  const fetchDividendStats = useCallback(async () => {
    try {
      const res: any = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.GET_DIVIDEND_STATS,
        params: {},
        showToaster: false,
        dispatch,
        showLoader: false,
        showButtonLoader: false,
        token: true,
      });
      return res;
    } catch (error: any) {
      console.error('Error fetching dividend stats:', error);
      throw error;
    }
  }, [dispatch]);

  return { fetchDividends, fetchDividendStats };
};