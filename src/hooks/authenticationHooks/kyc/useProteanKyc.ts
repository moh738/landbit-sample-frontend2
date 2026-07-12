import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import Toast from '../../../components/common/Toast';
import { loader } from '../../../redux/Slices/loader.slice';
import type {
  ProteanKycIdType,
  ProteanOcrData,
  ProteanLivenessResponse,
  ProteanFaceMatchResponse,
  ProteanNameMatchResponse,
  ProteanKycSubmitPayload,
  IndianProteanKycSubmitPayload,
} from '../../../interfaces/kyc/proteanKyc';

/** Extract user-facing error message from API response or caught error */
function getErrorMessage(resOrError: any, fallback: string): string {
  if (!resOrError) return fallback;
  const msg =
    resOrError?.response?.data?.message ??
    resOrError?.response?.data?.error ??
    (typeof resOrError?.message === 'string' ? resOrError.message : resOrError?.message);
  return (msg != null && String(msg).trim()) ? String(msg).trim() : fallback;
}

const ID_TYPE_TO_DOCUMENT_TYPE: Record<ProteanKycIdType, string> = {
  voter_id: 'Voter ID',
  driving_licence: 'Driving License',
  passport: 'Passport',
};

export function useProteanKyc() {
  const dispatch = useDispatch();
  const [ocrData, setOcrData] = useState<ProteanOcrData | null>(null);
  const [livenessResult, setLivenessResult] = useState<ProteanLivenessResponse | null>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<ProteanFaceMatchResponse | null>(null);
  const [nameMatchResult, setNameMatchResult] = useState<ProteanNameMatchResponse | null>(null);

  const runOcr = useCallback(
    async (_idType: ProteanKycIdType, imageUrl: string): Promise<ProteanOcrData | null> => {
      const trimmedUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
      if (!trimmedUrl) {
        Toast.error('ID image is required');
        return null;
      }
      try {
        dispatch(loader(true));
        const res: any = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.DOMESTIC_KYC_OCR,
          data: { documentUrl: trimmedUrl },
          dispatch,
          showToaster: false,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });
        if (res?.success && res?.data) {
          const data = (res.data?.ocr ?? res.data) as ProteanOcrData;
          setOcrData(data ?? null);
          return data ?? null;
        }
        Toast.error(getErrorMessage(res, 'OCR verification failed. Please ensure the image is clear and try again.'));
        return null;
      } catch (e: any) {
        Toast.error(getErrorMessage(e, 'OCR request failed. Please check your connection and try again.'));
        return null;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  const runFaceLiveness = useCallback(
    async (_selfieImageUrl: string): Promise<ProteanLivenessResponse | null> => {
      Toast.error('Protean liveness is no longer supported.');
      setLivenessResult(null);
      return null;
    },
    [dispatch]
  );

  const runFaceMatch = useCallback(
    async (_idImageUrl: string, _selfieImageUrl: string): Promise<ProteanFaceMatchResponse | null> => {
      Toast.error('Protean face match is no longer supported.');
      setFaceMatchResult(null);
      return null;
    },
    [dispatch]
  );

  const runNameMatch = useCallback(
    async (
      _providedName: string,
      _ocrName: string
    ): Promise<ProteanNameMatchResponse | null> => {
      Toast.error('Protean name match is no longer supported.');
      setNameMatchResult(null);
      return null;
    },
    [dispatch]
  );

  const submitProteanKyc = useCallback(
    async (payload: ProteanKycSubmitPayload): Promise<boolean> => {
      if (!payload?.documentUrl?.trim() || !payload?.fullName?.trim()) {
        Toast.error('Missing required data. Please complete all steps.');
        return false;
      }
      try {
        dispatch(loader(true));
        const res: any = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.CREATE_KYC,
          data: {
            ...payload,
            mode: 'save',
            source: 'protean',
          },
          dispatch,
          showToaster: true,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });
        if (res?.success) {
          Toast.success(res?.message || 'KYC submitted successfully');
          return true;
        }
        Toast.error(getErrorMessage(res, 'KYC submission failed. Please try again.'));
        return false;
      } catch (e: any) {
        Toast.error(getErrorMessage(e, 'Submission failed. Please check your connection and try again.'));
        return false;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  /** Indian user: 2-step flow. Submit document + selfie; backend handles OCR, face match, name match. */
  const submitIndianProteanKyc = useCallback(
    async (payload: IndianProteanKycSubmitPayload): Promise<boolean> => {
      const docUrl = payload?.documentUrl?.trim();
      const selfieUrl = payload?.selfieImageUrl?.trim();
      if (!docUrl || !selfieUrl) {
        Toast.error('ID document and selfie are required.');
        return false;
      }
      if (!payload?.documentType?.trim()) {
        Toast.error('Document type is required.');
        return false;
      }
      try {
        dispatch(loader(true));
        const res: any = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.CREATE_KYC,
          data: {
            documentType: payload.documentType,
            documentUrl: docUrl,
            documentUrlBack: payload.documentUrlBack?.trim() || undefined,
            selfieImageUrl: selfieUrl,
            fullName: payload.fullName ?? undefined,
            mode: 'save',
            source: 'protean',
            kycFlow: 'indian_2step',
          },
          dispatch,
          showToaster: true,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });
        if (res?.success) {
          Toast.success(res?.message || 'KYC submitted successfully');
          return true;
        }
        Toast.error(getErrorMessage(res, 'KYC submission failed. Please try again.'));
        return false;
      } catch (e: any) {
        Toast.error(getErrorMessage(e, 'Submission failed. Please check your connection and try again.'));
        return false;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  const resetProteanState = useCallback(() => {
    setOcrData(null);
    setLivenessResult(null);
    setFaceMatchResult(null);
    setNameMatchResult(null);
  }, []);

  return {
    ocrData,
    livenessResult,
    faceMatchResult,
    nameMatchResult,
    runOcr,
    runFaceLiveness,
    runFaceMatch,
    runNameMatch,
    submitProteanKyc,
    submitIndianProteanKyc,
    resetProteanState,
    idTypeToDocumentType: ID_TYPE_TO_DOCUMENT_TYPE,
  };
}
