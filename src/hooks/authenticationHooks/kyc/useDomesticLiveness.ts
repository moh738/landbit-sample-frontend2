import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import Toast from '../../../components/common/Toast';
import { loader } from '../../../redux/Slices/loader.slice';

function getErrorMessage(resOrError: any, fallback: string): string {
  if (!resOrError) return fallback;
  const msg =
    resOrError?.response?.data?.message ??
    resOrError?.response?.data?.error ??
    (typeof resOrError?.message === 'string' ? resOrError.message : resOrError?.message);
  return msg != null && String(msg).trim() ? String(msg).trim() : fallback;
}

export function useDomesticLiveness() {
  const dispatch = useDispatch();
  const [domesticLivenessData, setDomesticLivenessData] = useState<any>(null);

  const runDomesticLiveness = useCallback(
    async (selfieUrl: string): Promise<any | null> => {
      const trimmed = typeof selfieUrl === 'string' ? selfieUrl.trim() : '';
      if (!trimmed) {
        Toast.error('Selfie URL is required');
        return null;
      }
      try {
        dispatch(loader(true));
        const res: any = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.DOMESTIC_KYC_LIVENESS,
          data: { selfieUrl: trimmed, type: 'liveness' },
          dispatch,
          showToaster: false,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });

        if (res?.success && (res?.data != null || res?.liveness != null)) {
          const data = res?.data ?? res?.liveness ?? res;
          setDomesticLivenessData(data);

          // If backend returns a boolean `liveness` flag, treat false as failure
          if (data?.liveness === false) {
            Toast.error(data?.message || 'Liveness check failed. Please try again with a live selfie.');
            return null;
          }

          return data;
        }

        Toast.error(getErrorMessage(res, 'Liveness verification failed. Please try again.'));
        return null;
      } catch (e: any) {
        Toast.error(getErrorMessage(e, 'Liveness request failed. Please try again.'));
        return null;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  return { domesticLivenessData, runDomesticLiveness };
}

