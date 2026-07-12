import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { callGetMethod } from '../redux/Actions/api.action';
import { loader } from '../redux/Slices/loader.slice';
import { useExportPolling } from './useExportPolling';

export const usePortfolio = () => {
  const dispatch = useDispatch();
  const { pollExportUntilReady } = useExportPolling();

  const fetchPortfolio = useCallback(
    async (params: { search?: string; page?: number; limit?: number; download?: boolean } = {}) => {
      try {
        const res: any = await callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.GET.PORTFOLIO_USER,
          params,
          showToaster: false,
          dispatch,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });
        return res;
      } catch (error: any) {
        console.error('Error fetchPortfolio data:', error);
        throw error;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  return { fetchPortfolio, pollExportUntilReady };
};
