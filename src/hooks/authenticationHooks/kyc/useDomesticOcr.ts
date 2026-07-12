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

export type DomesticOcrDocType = 'Voter ID' | 'Passport' | 'Driving License';

export type DomesticOcrRequest = {
  documentFrontUrl: string;
  documentBackUrl?: string;
  docType: DomesticOcrDocType;
};

function normalizeDomesticOcrRequest(input: DomesticOcrRequest): Record<string, any> | null {
  const front =
    typeof input?.documentFrontUrl === 'string' ? input.documentFrontUrl.trim() : '';
  const back =
    typeof input?.documentBackUrl === 'string' ? input.documentBackUrl.trim() : '';
  const docType = input?.docType;

  if (!front) return null;
  if (docType !== 'Voter ID' && docType !== 'Passport' && docType !== 'Driving License')
    return null;

  const backRequired = docType === 'Driving License' || docType === 'Voter ID';
  if (backRequired && !back) return null;

  return {
    documentFrontUrl: front,
    ...(back ? { documentBackUrl: back } : {}),
    docType,
  };
}

export function useDomesticOcr() {
  const dispatch = useDispatch();
  const [domesticOcrData, setDomesticOcrData] = useState<any>(null);

  const runDomesticOcr = useCallback(
    async (req: DomesticOcrRequest): Promise<any | null> => {
      const normalized = normalizeDomesticOcrRequest(req);
      if (!normalized) {
        Toast.error(
          'Please upload required document images (front and back if applicable) and select a valid document type.'
        );
        return null;
      }
      try {
        dispatch(loader(true));
        const res: any = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.DOMESTIC_KYC_OCR,
          data: normalized,
          dispatch,
          showToaster: false,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });

        if (res?.success && (res?.data != null || res?.ocr != null)) {
          const data = res?.data ?? res?.ocr ?? res;
          setDomesticOcrData(data);
          return data;
        }

        Toast.error(getErrorMessage(res, 'OCR verification failed. Please try again.'));
        return null;
      } catch (e: any) {
        Toast.error(getErrorMessage(e, 'OCR request failed. Please try again.'));
        return null;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  return { domesticOcrData, runDomesticOcr };
}

