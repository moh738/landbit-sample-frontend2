import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { landbitBackendUrl } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';
import { POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS } from '../constants/exportConstants';
import { callGetMethod } from '../redux/Actions/api.action';
import type { ExportStatusResponse } from '../interfaces/responses/types'; 

export const useExportPolling = () => {
  const dispatch = useDispatch();

  const getExportStatus = useCallback(
    async (exportId: number): Promise<ExportStatusResponse> => {
      const res: ExportStatusResponse = await callGetMethod({
        apiUrl: landbitBackendUrl,
        endpoint: `${API_ENDPOINTS.GET.EXPORT_STATUS}/${exportId}`,
        params: {},
        showToaster: false,
        dispatch,
        showLoader: false,
        showButtonLoader: false,
        token: true,
      });
      return res;
    },
    [dispatch]
  );

  const pollExportUntilReady = useCallback(
    async (exportId: number): Promise<ExportStatusResponse> => {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const res = await getExportStatus(exportId);
        const status = res?.data?.status;
        if (status === 'COMPLETED' || status === 'FAILED') return res;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      throw new Error('Export timed out');
    },
    [getExportStatus]
  );

  return { getExportStatus, pollExportUntilReady };
};
