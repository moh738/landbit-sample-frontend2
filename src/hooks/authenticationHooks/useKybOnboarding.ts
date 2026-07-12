// src/hooks/useKybOnboarding.ts
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { loader } from '../../redux/Slices/loader.slice';
import { callGetMethod } from '../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../services/api.service';
import { API_ENDPOINTS } from '../../constants/apis/apiEndpoints';

export const useKybOnboarding = () => {
  const dispatch = useDispatch();

  const fetchOnboardingData = useCallback(async () => {
    try {
      const res: any = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.GET.GET_KYB,
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

  return { fetchOnboardingData };
};
