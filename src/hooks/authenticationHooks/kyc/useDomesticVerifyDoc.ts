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

export type DomesticVerifyDocType = 'Voter ID' | 'Passport' | 'Driving License';

export type DomesticVerifyAddress = {
  buildingName?: string;
  flatNumber?: string;
  subStreet?: string;
  street?: string;
  state?: string;
  buildingNumber?: string;
  town?: string;
  postCode?: string;
  country?: string;
  formattedAddress?: string;
  [key: string]: any;
};

type BaseVerifyPayload = {
  documentType: DomesticVerifyDocType;
  documentNumber: string;
  dob: string; // YYYY-MM-DD
  fullName: string;
};

export type DomesticVerifyDocPayload =
  | (BaseVerifyPayload & {
      documentType: 'Driving License';
      relationName?: string;
      address?: DomesticVerifyAddress;
      doi?: string;
      doe?: string;
    })
  | (BaseVerifyPayload & {
      documentType: 'Voter ID';
      relationName?: string;
      address?: DomesticVerifyAddress;
    })
  | (BaseVerifyPayload & {
      documentType: 'Passport';
      fileNo?: string;
      doi?: string;
      address?: DomesticVerifyAddress;
    }); // doi: YYYY-MM-DD

function isIsoDate(v: string): boolean {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(s);
  return !Number.isNaN(t);
}

function normalizePayload(p: DomesticVerifyDocPayload): DomesticVerifyDocPayload | null {
  const documentType = p?.documentType;
  const documentNumber =
    typeof p?.documentNumber === 'string' ? p.documentNumber.trim() : '';
  const dob = typeof p?.dob === 'string' ? p.dob.trim() : '';
  const fullName = typeof p?.fullName === 'string' ? p.fullName.trim() : '';

  if (
    documentType !== 'Driving License' &&
    documentType !== 'Voter ID' &&
    documentType !== 'Passport'
  )
    return null;
  if (!documentNumber) return null;
  if (!fullName) return null;
  if (!dob || !isIsoDate(dob)) return null;

  if (documentType === 'Passport') {
    const fileNo = typeof (p as any)?.fileNo === 'string' ? (p as any).fileNo.trim() : '';
    const doi = typeof (p as any)?.doi === 'string' ? (p as any).doi.trim() : '';
    const addressRaw = (p as any)?.address;
    const address =
      addressRaw && typeof addressRaw === 'object'
        ? addressRaw
        : typeof addressRaw === 'string'
          ? ({ formattedAddress: addressRaw.trim() } as DomesticVerifyAddress)
          : undefined;
    if (doi && !isIsoDate(doi)) return null;
    return {
      documentType,
      documentNumber,
      dob,
      fullName,
      ...(fileNo ? { fileNo } : {}),
      ...(doi ? { doi } : {}),
      ...(address ? { address } : {}),
    } as DomesticVerifyDocPayload;
  }

  if (documentType === 'Voter ID') {
    const relationName =
      typeof (p as any)?.relationName === 'string' ? (p as any).relationName.trim() : '';
    const addressRaw = (p as any)?.address;
    const address =
      addressRaw && typeof addressRaw === 'object'
        ? addressRaw
        : typeof addressRaw === 'string'
          ? ({ formattedAddress: addressRaw.trim() } as DomesticVerifyAddress)
          : undefined;
    return {
      documentType,
      documentNumber,
      dob,
      fullName,
      ...(relationName ? { relationName } : {}),
      ...(address ? { address } : {}),
    } as DomesticVerifyDocPayload;
  }

  if (documentType === 'Driving License') {
    const relationName =
      typeof (p as any)?.relationName === 'string' ? (p as any).relationName.trim() : '';
    const addressRaw = (p as any)?.address;
    const address =
      addressRaw && typeof addressRaw === 'object'
        ? addressRaw
        : typeof addressRaw === 'string'
          ? ({ formattedAddress: addressRaw.trim() } as DomesticVerifyAddress)
          : undefined;
    const doi = typeof (p as any)?.doi === 'string' ? (p as any).doi.trim() : '';
    const doe = typeof (p as any)?.doe === 'string' ? (p as any).doe.trim() : '';
    if (doi && !isIsoDate(doi)) return null;
    if (doe && !isIsoDate(doe)) return null;
    return {
      documentType,
      documentNumber,
      dob,
      fullName,
      ...(relationName ? { relationName } : {}),
      ...(address ? { address } : {}),
      ...(doi ? { doi } : {}),
      ...(doe ? { doe } : {}),
    } as DomesticVerifyDocPayload;
  }

  return null;
}

export function useDomesticVerifyDoc() {
  const dispatch = useDispatch();
  const [domesticVerifyDocData, setDomesticVerifyDocData] = useState<any>(null);

  const verifyDomesticDoc = useCallback(
    async (payload: DomesticVerifyDocPayload): Promise<any | null> => {
      const normalized = normalizePayload(payload);
      if (!normalized) {
        Toast.error(
          'Invalid document details. Please check document number, full name, and date format (YYYY-MM-DD).'
        );
        return null;
      }

      try {
        dispatch(loader(true));
        const res: any = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.DOMESTIC_KYC_VERIFY_DOC,
          data: normalized,
          dispatch,
          showToaster: false,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });

        if (res?.success && (res?.data != null || res?.verify != null)) {
          const data = res?.data ?? res?.verify ?? res;
          setDomesticVerifyDocData(data);
          return data;
        }

        Toast.error(getErrorMessage(res, 'Document verification failed. Please check your details and try again.'));
        return null;
      } catch (e: any) {
        Toast.error(getErrorMessage(e, 'Verification request failed. Please try again.'));
        return null;
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  return { domesticVerifyDocData, verifyDomesticDoc };
}

