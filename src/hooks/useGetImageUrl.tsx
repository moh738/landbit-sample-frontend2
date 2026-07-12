import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';

import { loader } from '../redux/Slices/loader.slice';
import { callPostMethod } from '../redux/Actions/api.action';
import { ImageUrlPayload } from '../interfaces/bankDetail/bankDetail';



  export const useGetImageUrl = () => {
  const dispatch = useDispatch();
  const fetchImageUrl = useCallback(
    async (data: ImageUrlPayload) => {
      try {
        dispatch(loader(true));
        const res: any = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.IMAGE_URL,
          data, 
          dispatch,
          showToaster: false,
          showLoader: true,
          showButtonLoader: true,
          token: true,
        });
        return res;
      } catch (error: any) {
          dispatch(loader(false));
        console.error('Error fetchImageUrl:', error);
        throw error;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  return { fetchImageUrl };
};