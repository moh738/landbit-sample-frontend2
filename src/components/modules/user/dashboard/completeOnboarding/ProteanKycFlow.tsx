import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Col, Row } from 'react-bootstrap';
import CommonHeading from '../../../../common/commonHeading/CommonHeading';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import UploadDocCard from '../../../../ui/uploadDocCard/UploadDocCard';
import SelfieLiveCapture from '../../../../ui/selfieLiveCapture/SelfieLiveCapture';
import FormControl from '../../../../formik/FormControl';
import { callGetMethod, callPostMethod } from '../../../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../../../services/api.service';
import { API_ENDPOINTS } from '../../../../../constants/apis/apiEndpoints';
import Toast from '../../../../common/Toast';
import { useDomesticLiveness } from '../../../../../hooks/authenticationHooks/kyc/useDomesticLiveness';
import { useDomesticOcr } from '../../../../../hooks/authenticationHooks/kyc/useDomesticOcr';
import { useDomesticVerifyDoc } from '../../../../../hooks/authenticationHooks/kyc/useDomesticVerifyDoc';
import {
  PROTEAN_ID_TYPE_OPTIONS,
  mapApiDocumentTypeToProteanIdType,
  type ProteanKycIdType,
  type IndianProteanKycStep,
} from '../../../../../interfaces/kyc/proteanKyc';
import { useOnboardingStatus } from '../../../../../hooks/authenticationHooks/useOnboardngStatus';
import { setVerificationSteps } from '../../../../../redux/Slices/completeOnboarding.slice';
import { setProfile } from '../../../../../redux/Slices/user.slice';
import store from '../../../../../redux/Store';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../../../utils/Utils';
import { getKycHeading } from '../../../../../constants/messages/kycMessages';
import {
  getNormalizedOcrValue,
  normalizeDomesticOcr,
  parseOcrJsonRecord,
} from '../../../../../utils/kyc/domesticOcrNormalize';
import './CompleteOnboarding.scss';

/** True if the string is an absolute http(s) URL (usable as image src without a base). */
function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/** Prefer YYYY-MM-DD; best-effort from DD/MM/YYYY */
function normalizeDobFromApi(v: string): string {
  const t = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  return t;
}

/** Indian user: 3 steps. OCR/prefill verify before liveness submit. */
const STEPS: { key: IndianProteanKycStep; label: string; description: string }[] = [
  { key: 'id_upload', label: 'Upload ID Document', description: 'Upload Voter ID, Driving Licence, or Passport.' },
  { key: 'document_verify', label: 'Verify Document', description: 'Review prefilled details extracted from your document.' },
  { key: 'face_liveness', label: 'Face Liveness', description: 'Capture a live selfie so it can be verified against your ID.' },
];

export default function ProteanKycFlow() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getOnboardingStatus, getUserProfile } = useOnboardingStatus();
  const { onBoardingStatus, reviewRejectType, numberofAttempts } =
    useSelector((state: RootState) => state.onboarding);
  const urlStepParam = searchParams.get('step') as IndianProteanKycStep | null;
  const initialStepFromUrl = urlStepParam || 'id_upload';
  const [currentStep, setCurrentStep] = useState<IndianProteanKycStep>(initialStepFromUrl);
  const [showStepsOverview, setShowStepsOverview] = useState<boolean>(!urlStepParam);

  const [idType, setIdType] = useState<ProteanKycIdType | ''>('');
  /** Storage keys / paths for API payloads (OCR, etc.) — not necessarily browser-loadable URLs. */
  const [idImageFrontUrl, setIdImageFrontUrl] = useState<string>('');
  const [idImageBackUrl, setIdImageBackUrl] = useState<string>('');
  /** SAS or full URLs for UI preview only; keep in sync when prefilling from GET or after upload. */
  const [idImageFrontPreviewUrl, setIdImageFrontPreviewUrl] = useState<string>('');
  const [idImageBackPreviewUrl, setIdImageBackPreviewUrl] = useState<string>('');
  const [selfieImageUrl, setSelfieImageUrl] = useState<string>('');
  const [idImageFrontFile, setIdImageFrontFile] = useState<File | null>(null);
  const [idImageBackFile, setIdImageBackFile] = useState<File | null>(null);
  const [selfieImageFile, setSelfieImageFile] = useState<File | null>(null);
  const [ocrPrefill, setOcrPrefill] = useState<any>(null);
  /** Prevents double submit and shows loading on action buttons */
  const [stepInProgress, setStepInProgress] = useState<IndianProteanKycStep | null>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  /** When true, status/poll updates must not force Step 2/3 while user is re-uploading on Step 1 */
  const suppressVerificationStepAutoNavRef = useRef(false);
  /** Force-open Step 1 only once when entering Pending/Rejected; do not keep overriding later steps. */
  const reviewEntryStep1AppliedRef = useRef(false);
  /** Apply GET `/user/kyc/details` once per visit so pending/resume shows API prefills (name as on document, URLs). */
  const kycDetailsAppliedRef = useRef(false);

  const { runDomesticLiveness } = useDomesticLiveness();
  const { runDomesticOcr } = useDomesticOcr();
  const { verifyDomesticDoc } = useDomesticVerifyDoc();

  const [verifyFullName, setVerifyFullName] = useState<string>('');
  const [verifyDob, setVerifyDob] = useState<string>(''); // YYYY-MM-DD
  const [verifyDocumentNumber, setVerifyDocumentNumber] = useState<string>('');
  const [verifyRelationName, setVerifyRelationName] = useState<string>('');
  const [verifyAddress, setVerifyAddress] = useState<string>('');
  const [verifyPin, setVerifyPin] = useState<string>('');
  const [verifyGender, setVerifyGender] = useState<string>(''); // VOTER only (display/edit)
  const [verifyLastUpdateDate, setVerifyLastUpdateDate] = useState<string>(''); // VOTER only (display/edit)
  const [verifyDlDoi, setVerifyDlDoi] = useState<string>(''); // DL issue (YYYY-MM-DD)
  const [verifyDlDoe, setVerifyDlDoe] = useState<string>(''); // DL expiry (YYYY-MM-DD)
  const [verifyPassportFileNo, setVerifyPassportFileNo] = useState<string>(''); // PASSPORT only
  const [verifyPassportDoi, setVerifyPassportDoi] = useState<string>(''); // PASSPORT only (YYYY-MM-DD)

  useEffect(() => {
    getOnboardingStatus();
  }, [getOnboardingStatus]);

  useEffect(() => {
    if (onBoardingStatus === 'Rejected') {
      kycDetailsAppliedRef.current = false;
    }
  }, [onBoardingStatus]);

  /** Allow GET `/user/kyc/details` to run again when user re-enters Pending / Rejected from another status */
  const prevOnboardingForDetailsRef = useRef<typeof onBoardingStatus>(onBoardingStatus);
  useEffect(() => {
    const prev = prevOnboardingForDetailsRef.current;
    if (
      (prev !== 'Pending' && onBoardingStatus === 'Pending') ||
      (prev !== 'Rejected' && onBoardingStatus === 'Rejected')
    ) {
      kycDetailsAppliedRef.current = false;
    }
    prevOnboardingForDetailsRef.current = onBoardingStatus;
  }, [onBoardingStatus]);

  useEffect(() => {
    reviewEntryStep1AppliedRef.current = false;
  }, [onBoardingStatus]);

  /** Resume after refresh: skip intro when URL has `step` or API shows an in-progress domestic flow. */
  useEffect(() => {
    if (urlStepParam) {
      setShowStepsOverview(false);
      return;
    }
    if (onBoardingStatus === 'Pending' || onBoardingStatus === 'Rejected') {
      setShowStepsOverview(false);
    }
  }, [urlStepParam, onBoardingStatus]);

  /** Prefill from `/user/kyc/details` (e.g. Pending + fullName from document, uploaded image URLs). */
  useEffect(() => {
    if (onBoardingStatus === 'Verified' || onBoardingStatus === null) return;
    if (kycDetailsAppliedRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const res: any = await callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.GET.GET_KYC,
          params: {},
          showToaster: false,
          dispatch,
          showLoader: false,
          showButtonLoader: false,
          token: true,
        });
        if (cancelled) return;
        kycDetailsAppliedRef.current = true;
        if (!res?.success || !res?.data || typeof res.data !== 'object') return;

        const d = res.data as Record<string, any>;
        if (d.verificationSteps && typeof d.verificationSteps === 'object') {
          dispatch(setVerificationSteps(d.verificationSteps));
        }
        const mappedId = mapApiDocumentTypeToProteanIdType(
          d.documentType ?? d.idDocType
        );
        if (mappedId) setIdType(mappedId);

        const frontStorage =
          (typeof d.documentUrl === 'string' && d.documentUrl.trim()) ||
          (typeof d.documentFrontUrl === 'string' && d.documentFrontUrl.trim()) ||
          '';
        const frontPreview =
          (typeof d.documentFrontPreviewUrl === 'string' && d.documentFrontPreviewUrl.trim()) ||
          (typeof d.documentUrlPreview === 'string' && d.documentUrlPreview.trim()) ||
          (frontStorage && isHttpUrl(frontStorage) ? frontStorage : '');
        if (frontStorage) setIdImageFrontUrl(frontStorage);
        if (frontPreview) setIdImageFrontPreviewUrl(frontPreview);

        const backStorage =
          (typeof d.documentUrlBack === 'string' && d.documentUrlBack.trim()) ||
          (typeof d.documentBackUrl === 'string' && d.documentBackUrl.trim()) ||
          '';
        const backPreview =
          (typeof d.documentBackPreviewUrl === 'string' && d.documentBackPreviewUrl.trim()) ||
          (typeof d.documentBackUrlPreview === 'string' && d.documentBackUrlPreview.trim()) ||
          (backStorage && isHttpUrl(backStorage) ? backStorage : '');
        if (backStorage) setIdImageBackUrl(backStorage);
        if (backPreview) setIdImageBackPreviewUrl(backPreview);

        if (typeof d.fullName === 'string' && d.fullName.trim()) {
          setVerifyFullName(d.fullName.trim());
        }

        const docNo = d.documentNumber ?? d.idDocNumber ?? d.idNumber;
        if (typeof docNo === 'string' && docNo.trim()) {
          setVerifyDocumentNumber(docNo.trim());
        }

        const dobRaw = d.dob ?? d.dateOfBirth;
        if (typeof dobRaw === 'string' && dobRaw.trim()) {
          setVerifyDob(normalizeDobFromApi(dobRaw));
        }

        let addr = '';
        if (typeof d.residentialAddress === 'string') addr = d.residentialAddress;
        else if (d.address && typeof d.address === 'object') {
          addr =
            (typeof d.address.formattedAddress === 'string' && d.address.formattedAddress) ||
            (typeof d.address.address === 'string' && d.address.address) ||
            '';
        }
        if (addr.trim()) setVerifyAddress(addr.trim());

        const pin = d.postalCode ?? d.pin ?? d.address?.postCode;
        if (typeof pin === 'string' && pin.trim()) setVerifyPin(pin.trim());

        const rel = d.relationName ?? d.fatherName;
        if (typeof rel === 'string' && rel.trim()) setVerifyRelationName(rel.trim());

        const ocrMerged: Record<string, unknown> = {};
        const ocrResult = parseOcrJsonRecord(d.ocrResult);
        const ocrDataFront = parseOcrJsonRecord(d.ocrDataFront);
        const ocrDataBack = parseOcrJsonRecord(d.ocrDataBack);
        const ocrData = parseOcrJsonRecord(d.ocrData);
        if (ocrResult) ocrMerged.ocrResult = ocrResult;
        if (ocrDataFront) ocrMerged.ocrDataFront = ocrDataFront;
        if (ocrDataBack) ocrMerged.ocrDataBack = ocrDataBack;
        if (ocrData) ocrMerged.ocrData = ocrData;
        if (Object.keys(ocrMerged).length > 0) {
          setOcrPrefill(ocrMerged);
        }
      } catch {
        kycDetailsAppliedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onBoardingStatus, dispatch]);

  /** While KYC is pending review, poll status so the screen updates when it is approved or rejected without a manual refresh */
  useEffect(() => {
    if (onBoardingStatus !== 'Pending') return;

    const POLL_MS = 15_000;
    const tick = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      const next = await getOnboardingStatus();
      if (next === 'Verified') {
        Toast.success('Your KYC is completed successfully', { duration: 5000 });
        await getUserProfile();
      }
    };

    const intervalId = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [onBoardingStatus, getOnboardingStatus, getUserProfile]);

  const uploadFile = useCallback(
    async (
      file: File,
      type: string
    ): Promise<{ uploadFile: string; uploadFilePreview: string } | null> => {
      if (!file || !(file instanceof File)) return null;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      try {
        const res: any = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.UPLOAD_DOCUMENTS,
          data: formData,
          dispatch,
          showToaster: false,
          showLoader: true,
          showButtonLoader: false,
          token: true,
        });
        const uploadedFile =
          typeof res?.data?.uploadFile === 'string' ? res.data.uploadFile.trim() : '';
        const uploadedPreview =
          (typeof res?.data?.uploadFilePreview === 'string'
            ? res.data.uploadFilePreview
            : typeof res?.data?.previewFile === 'string'
              ? res.data.previewFile
              : uploadedFile
          )?.trim?.() || uploadedFile;

        if (res?.success && uploadedFile) {
          Toast.success(res?.message || 'File uploaded');
          return { uploadFile: uploadedFile, uploadFilePreview: uploadedPreview };
        }
        Toast.error(res?.message || 'Upload failed. Please try again.');
        return null;
      } catch (err: any) {
        Toast.error(err?.message || 'Upload failed. Please check your connection.');
        return null;
      }
    },
    [dispatch]
  );

  /** When ID type changes, clear previous ID images so user re-uploads for the new type */
  useEffect(() => {
    if (!idType) {
      setIdImageFrontUrl('');
      setIdImageBackUrl('');
      setIdImageFrontPreviewUrl('');
      setIdImageBackPreviewUrl('');
      setIdImageFrontFile(null);
      setIdImageBackFile(null);
      setOcrPrefill(null);
    }
  }, [idType]);

  /** Clear stale OCR only when the user replaces images (local File), not when URLs are prefilled from GET `/user/kyc/details`. */
  useEffect(() => {
    if (idImageFrontFile || idImageBackFile) {
      setOcrPrefill(null);
    }
  }, [idImageFrontUrl, idImageBackUrl, idImageFrontFile, idImageBackFile]);

  /** Back side is required for Voter ID and Driving Licence; optional for Passport */
  const isBackRequired = idType === 'voter_id' || idType === 'driving_licence';
  const selectedIdTypeLabel =
    (idType
      ? PROTEAN_ID_TYPE_OPTIONS.find((o) => o.value === idType)?.label
      : undefined) || 'ID Document';
  const idFrontLabel = `${selectedIdTypeLabel} Image (Front)`;
  const idBackLabel = `${selectedIdTypeLabel} Image (Back)`;
  
  const canContinueStep1 = Boolean(
    idType &&
    idImageFrontUrl?.trim() &&
    (!isBackRequired || idImageBackUrl?.trim())
  );

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const canGoPrev = stepIndex > 0;

  const goToStep = useCallback((nextKey: IndianProteanKycStep) => {
    setCurrentStep(nextKey);
    setShowStepsOverview(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('step', nextKey);
      return next;
    });
  }, [setSearchParams]);

  const goToStep1ForReupload = useCallback(() => {
    suppressVerificationStepAutoNavRef.current = true;
    setCurrentStep('id_upload');
    setShowStepsOverview(false);
    const path = `${location.pathname}?step=id_upload`;
    navigate(path, { replace: true });
  }, [location.pathname, navigate]);

  /** Do not clear suppress while user is on Step 1 — prefilled URLs can make `!missing` true and otherwise yank them back to Step 2. */
  useEffect(() => {
    const missing =
      !idImageFrontUrl?.trim() ||
      (isBackRequired && !idImageBackUrl?.trim());
    if (!missing && currentStep !== 'id_upload') {
      suppressVerificationStepAutoNavRef.current = false;
    }
  }, [idImageFrontUrl, idImageBackUrl, isBackRequired, currentStep]);

  /** For review states, always open Step 1 on entry. */
  useEffect(() => {
    if (onBoardingStatus === 'Verified') return;
    const shouldForceStep1OnEntry =
      (onBoardingStatus === 'Pending' || onBoardingStatus === 'Rejected') &&
      !reviewEntryStep1AppliedRef.current;
    if (!shouldForceStep1OnEntry) return;
    goToStep('id_upload');
    if (shouldForceStep1OnEntry) {
      reviewEntryStep1AppliedRef.current = true;
    }
  }, [onBoardingStatus, goToStep]);

  const handlePrev = useCallback(() => {
    if (canGoPrev) {
      const prevKey = STEPS[stepIndex - 1].key as IndianProteanKycStep;
      if (prevKey === 'id_upload') {
        suppressVerificationStepAutoNavRef.current = true;
      }
      goToStep(prevKey);
    }
  }, [canGoPrev, goToStep, stepIndex]);

  const normalizedOcr = useMemo(() => normalizeDomesticOcr(ocrPrefill), [ocrPrefill]);

  // Prefill verify-doc form fields from OCR response (flat or ocrResult + value/confidence)
  useEffect(() => {
    if (!ocrPrefill || typeof ocrPrefill !== 'object') return;
    const n = normalizeDomesticOcr(ocrPrefill);
    const ocrName = getNormalizedOcrValue(n, 'name', 'fullName');
    const ocrDob = getNormalizedOcrValue(n, 'dob', 'dateOfBirth');
    const ocrDocNo = getNormalizedOcrValue(
      n,
      'documentNumber',
      'documentNo',
      'idNumber',
      'dlNo',
      'voterId',
      'passportNo'
    );
    // Prefer OCR when it returns a value (re-upload); otherwise keep GET `/user/kyc/details` or prior edits.
    setVerifyFullName((prev) => (ocrName?.trim() ? ocrName : prev));
    setVerifyDob((prev) => (ocrDob?.trim() ? ocrDob : prev));
    setVerifyDocumentNumber((prev) => (ocrDocNo?.trim() ? ocrDocNo : prev));
    setVerifyRelationName((prev) => (prev?.trim() ? prev : getNormalizedOcrValue(n, 'relationName')));
    setVerifyAddress((prev) => (prev?.trim() ? prev : getNormalizedOcrValue(n, 'address')));
    setVerifyPin((prev) => (prev?.trim() ? prev : getNormalizedOcrValue(n, 'pin')));
    if (idType === 'voter_id') {
      setVerifyGender((prev) => (prev?.trim() ? prev : getNormalizedOcrValue(n, 'gender')));
      setVerifyLastUpdateDate((prev) =>
        prev?.trim() ? prev : getNormalizedOcrValue(n, 'lastUpdateDate')
      );
    }
    if (idType === 'driving_licence') {
      setVerifyDlDoi((prev) => (prev?.trim() ? prev : getNormalizedOcrValue(n, 'doi')));
      setVerifyDlDoe((prev) => (prev?.trim() ? prev : getNormalizedOcrValue(n, 'doe')));
    }
    if (idType === 'passport') {
      setVerifyPassportFileNo((prev) => (prev?.trim() ? prev : getNormalizedOcrValue(n, 'fileNo')));
      setVerifyPassportDoi((prev) => (prev?.trim() ? prev : getNormalizedOcrValue(n, 'doi')));
    }
  }, [ocrPrefill, idType]);

  const hasAnyOcrField = Boolean(
    getNormalizedOcrValue(normalizedOcr, 'name', 'fullName') ||
      getNormalizedOcrValue(normalizedOcr, 'dob', 'dateOfBirth') ||
      getNormalizedOcrValue(
        normalizedOcr,
        'documentNumber',
        'documentNo',
        'idNumber',
        'dlNo',
        'voterId',
        'passportNo'
      ) ||
      getNormalizedOcrValue(normalizedOcr, 'address') ||
      getNormalizedOcrValue(normalizedOcr, 'relationName') ||
      getNormalizedOcrValue(normalizedOcr, 'pin') ||
      getNormalizedOcrValue(normalizedOcr, 'doi') ||
      getNormalizedOcrValue(normalizedOcr, 'doe')
  );

  // —— Step 1: ID type + upload front (and back if required) -> OCR -> Step 2 verify details —— 
  const handleStep1Continue = useCallback(async () => {
    if (!canContinueStep1) {
      Toast.error(
        isBackRequired
          ? 'Please select document type and upload both front and back images of your ID.'
          : 'Please select document type and upload a clear image of your document (front).'
      );
      return;
    }
    if (stepInProgress) return;
    setStepInProgress('id_upload');
    try {
      const docType =
        idType === 'driving_licence'
          ? 'Driving License'
          : idType === 'voter_id'
            ? 'Voter ID'
            : 'Passport';
      const ocrRes = await runDomesticOcr({
        documentFrontUrl: idImageFrontUrl,
        documentBackUrl: idImageBackUrl?.trim() || undefined,
        docType,
      });
      if (!ocrRes) return;
      setOcrPrefill(ocrRes);
      suppressVerificationStepAutoNavRef.current = false;
      goToStep('document_verify');
    } finally {
      setStepInProgress(null);
    }
  }, [
    canContinueStep1,
    goToStep,
    idType,
    idImageFrontUrl,
    idImageBackUrl,
    isBackRequired,
    runDomesticOcr,
    stepInProgress,
  ]);

  const handleVerifyDocAndContinue = useCallback(async () => {
    if (!idType) {
      Toast.error('Document type is missing. Please go back to Step 1.');
      return;
    }
    if (stepInProgress) return;
    setStepInProgress('document_verify');
    try {
      const documentType =
        idType === 'driving_licence'
          ? 'Driving License'
          : idType === 'voter_id'
            ? 'Voter ID'
            : 'Passport';

      const base: any = {
        documentType,
        documentNumber: verifyDocumentNumber,
        dob: verifyDob,
        fullName: verifyFullName,
      };
      if (documentType === 'Voter ID') {
        base.relationName = verifyRelationName;
        base.address = {
          formattedAddress: verifyAddress,
          postCode: verifyPin,
        };
      }
      if (documentType === 'Driving License') {
        base.relationName = verifyRelationName;
        base.address = {
          formattedAddress: verifyAddress,
          postCode: verifyPin,
        };
        base.doi = verifyDlDoi;
        base.doe = verifyDlDoe;
      }
      if (documentType === 'Passport') {
        base.fileNo = verifyPassportFileNo;
        base.doi = verifyPassportDoi;
        base.address = {
          formattedAddress: verifyAddress,
          postCode: verifyPin,
        };
      }

      const ok = await verifyDomesticDoc(base);
      if (!ok) return;
      goToStep('face_liveness');
    } finally {
      setStepInProgress(null);
    }
  }, [
    goToStep,
    idType,
    stepInProgress,
    verifyDob,
    verifyDocumentNumber,
    verifyDomesticDoc,
    verifyFullName,
    verifyRelationName,
    verifyPassportDoi,
    verifyPassportFileNo,
    verifyAddress,
    verifyPin,
    verifyDlDoi,
    verifyDlDoe,
    verifyGender,
    verifyLastUpdateDate,
  ]);

  // Scroll step content into view when moving away from overview
  useEffect(() => {
    if (!showStepsOverview && stepContentRef.current) {
      stepContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, showStepsOverview]);

  // —— Step 3: Face Liveness -> then submit to backend (backend does rest) ——
  const handleLivenessAndSubmit = useCallback(async () => {
    if (!selfieImageUrl?.trim()) {
      Toast.error('Please capture a live selfie with your camera.');
      return;
    }
    if (!idType || !idImageFrontUrl?.trim()) {
      Toast.error('ID document (front) is missing. Please go back to Step 1.');
      return;
    }
    if (isBackRequired && !idImageBackUrl?.trim()) {
      Toast.error('ID document (back) is required. Please go back to Step 1.');
      return;
    }
    if (stepInProgress) return;
    setStepInProgress('face_liveness');
    try {
      const livenessOk = await runDomesticLiveness(selfieImageUrl);
      if (livenessOk == null) return; // Toast already shown in hook
      // Only 3 KYC APIs are used: OCR -> verify-doc -> liveness.
      // After liveness success, backend should have enough to update KYC status.
      const next = await getOnboardingStatus();
      if (next === 'Verified') {
        Toast.success('Your KYC is completed successfully', { duration: 5000 });
        if (verifyFullName.trim()) {
          dispatch(
            setProfile({
              ...store.getState().user.profile,
              fullName: verifyFullName.trim(),
            })
          );
        }
        await getUserProfile();
      }
      navigate(`/${ROUTES.USER}/${ROUTES.DASHBOARD}`);
    } finally {
      setStepInProgress(null);
    }
  }, [
    selfieImageUrl,
    idType,
    idImageFrontUrl,
    idImageBackUrl,
    isBackRequired,
    runDomesticLiveness,
    getOnboardingStatus,
    navigate,
    dispatch,
    verifyFullName,
    stepInProgress,
  ]);

  // Verified users should not see KYC steps.
  if (onBoardingStatus === 'Verified') {
    return (
      <section className="completeOnboarding">
        <CommonHeading
          heading={getKycHeading(
            onBoardingStatus,
            reviewRejectType ?? null,
            numberofAttempts ?? 0,
          )}
          className="heading"
        />
        <div className="kyc-card">
          <CommonButton
            title="Back to Dashboard"
            onClick={() => navigate(`/${ROUTES.USER}/${ROUTES.DASHBOARD}`)}
            fluid
          />
        </div>
      </section>
    );
  }

  // —— Step-by-step flow ——
  return (
    <section className="completeOnboarding">
      <CommonHeading heading="Complete onboarding (KYC)" />
      <div className="kyc-card mb-4">
        <div
          className="kyc-steps mb-3"
          role="status"
          aria-label="KYC verification progress"
        >
          <span
            className={`kyc-step-badge ${
              currentStep === 'id_upload'
                ? 'active'
                : stepIndex > 0
                  ? 'done'
                  : 'upcoming'
            }`}
          >
            1. Upload & OCR
          </span>
          <span
            className={`kyc-step-badge ${
              currentStep === 'document_verify'
                ? 'active'
                : stepIndex > 1
                  ? 'done'
                  : 'upcoming'
            }`}
          >
            2. Verify document
          </span>
          <span
            className={`kyc-step-badge ${
              currentStep === 'face_liveness'
                ? 'active'
                : stepIndex > 2
                  ? 'done'
                  : 'upcoming'
            }`}
          >
            3. Face liveness
          </span>
          {/* <span
            className={`kyc-step-badge ${
              verificationSteps?.nameMatch === true ? 'done' : 'upcoming'
            }`}
          >
            4. Name match
          </span> */}
        </div>
        {/* {!showStepsOverview && (
          <button
            type="button"
            className="back_link mb-3"
            onClick={() => setShowStepsOverview(true)}
          >
            ← View all steps
          </button>
        )} */}
        {/* {!showStepsOverview && (
          <div className="kyc-steps">
            {STEPS.map((s, i) => {
              const isActive = currentStep === s.key;
              const isDone = i < currentStepIdx;
              return (
                <span
                  key={s.key}
                  className={`kyc-step-badge ${isActive ? 'active' : isDone ? 'done' : 'upcoming'}`}
                >
                  {i + 1}. {s.label}
                </span>
              );
            })}
          </div>
        )} */}

        <div className="kyc-step-content" ref={stepContentRef}>
          {showStepsOverview ? (
            <>
              <p className="text-muted mb-4">
                Complete identity verification in 3 steps. Upload your ID, review
                prefilled extracted details, and then complete face liveness.
              </p>
              <div className="kyc-steps-overview">
                <div className="kyc-steps-overview-item">
                  <div className="kyc-steps-overview-index">1</div>
                  <div className="kyc-steps-overview-body">
                    <div className="kyc-steps-overview-title">
                      Upload ID Document
                    </div>
                    <div className="kyc-steps-overview-description">
                      Upload Voter ID, Driving Licence, or Passport.
                    </div>
                  </div>
                </div>
                <div className="kyc-steps-overview-item">
                  <div className="kyc-steps-overview-index">2</div>
                  <div className="kyc-steps-overview-body">
                    <div className="kyc-steps-overview-title">Verify Document</div>
                    <div className="kyc-steps-overview-description">
                      We prefill details from your document. Confirm them before
                      continuing.
                    </div>
                  </div>
                </div>
                <div className="kyc-steps-overview-item">
                  <div className="kyc-steps-overview-index">3</div>
                  <div className="kyc-steps-overview-body">
                    <div className="kyc-steps-overview-title">Face Liveness</div>
                    <div className="kyc-steps-overview-description">
                      Capture a live selfie to complete your verification.
                    </div>
                  </div>
                </div>
              </div>
              <div className="kyc-step-actions">
                <CommonButton
                  title="Start KYC"
                  onClick={() => {
                    setCurrentStep('id_upload');
                    setShowStepsOverview(false);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set('step', 'id_upload');
                      return next;
                    });
                  }}
                  fluid
                />
              </div>
            </>
          ) : (
            <>
              {/* Step 1: Upload ID document — then click Continue to open Face Liveness */}
              {currentStep === 'id_upload' && (
                <>
                  <CommonHeading
                    heading="Upload ID Document"
                    className="mb-3"
                    required
                  />
                  <p className="text-muted">
                    Choose one: Voter ID, Driving Licence, or Passport. Upload clear
                    images of the front and, if required, the back of your document.
                  </p>
                  <Row className="gy-3">
                    <Col md={4}>
                      <FormControl
                        label="Document Type"
                        control="select"
                        name="documentType"
                        className="blockchain_sel"
                        options={PROTEAN_ID_TYPE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        value={
                          idType
                            ? PROTEAN_ID_TYPE_OPTIONS.find(
                                (option) => option.value === idType
                              ) || null
                            : null
                        }
                        placeholder="Select Document Type"
                        onChange={(option: any) => {
                          setIdType((option?.value || '') as ProteanKycIdType | '');
                        }}
                      />
                    </Col>
                    <Col md={4}>
                      <UploadDocCard
                        label={idFrontLabel}
                        docType={idType || 'id'}
                        required
                        name="idImageFront"
                        value={idImageFrontFile}
                        prefilledUrl={
                          idImageFrontPreviewUrl ||
                          (isHttpUrl(idImageFrontUrl) ? idImageFrontUrl : undefined)
                        }
                        setFieldValue={async (_field, file) => {
                          if (file) {
                            setIdImageFrontFile(file);
                            const uploaded = await uploadFile(
                              file,
                              `${idType || 'id'}_front`
                            );
                            if (uploaded?.uploadFile) {
                              setIdImageFrontUrl(uploaded.uploadFile);
                              setIdImageFrontPreviewUrl(
                                uploaded.uploadFilePreview || uploaded.uploadFile
                              );
                            }
                          } else {
                            setIdImageFrontFile(null);
                            setIdImageFrontUrl('');
                            setIdImageFrontPreviewUrl('');
                          }
                        }}
                        acceptOnlyPdf={false}
                        acceptOnlyImages
                      />
                    </Col>
                    <Col md={4}>
                      <UploadDocCard
                        label={idBackLabel}
                        docType={idType || 'id'}
                        required={isBackRequired}
                        name="idImageBack"
                        value={idImageBackFile}
                        prefilledUrl={
                          idImageBackPreviewUrl ||
                          (isHttpUrl(idImageBackUrl) ? idImageBackUrl : undefined)
                        }
                        setFieldValue={async (_field, file) => {
                          if (file) {
                            setIdImageBackFile(file);
                            const uploaded = await uploadFile(
                              file,
                              `${idType || 'id'}_back`
                            );
                            if (uploaded?.uploadFile) {
                              setIdImageBackUrl(uploaded.uploadFile);
                              setIdImageBackPreviewUrl(
                                uploaded.uploadFilePreview || uploaded.uploadFile
                              );
                            }
                          } else {
                            setIdImageBackFile(null);
                            setIdImageBackUrl('');
                            setIdImageBackPreviewUrl('');
                          }
                        }}
                        acceptOnlyPdf={false}
                        acceptOnlyImages
                      />
                    </Col>
                  </Row>
                  <div className="kyc-step-actions">
                    <CommonButton
                      title="Continue"
                      onClick={handleStep1Continue}
                      disabled={!canContinueStep1 || stepInProgress === 'id_upload'}
                      isLoading={stepInProgress === 'id_upload'}
                      fluid
                    />
                  </div>
                </>
              )}

              {/* Step 2: Verify extracted document details before liveness */}
              {currentStep === 'document_verify' && (
                <>
                  <CommonHeading
                    heading="Verify Document Details"
                    className="mb-3"
                    required
                  />
                  <p className="text-muted">
                    We extracted details from your uploaded ID. Please review and
                    continue.
                  </p>
                  {!idImageFrontUrl?.trim() ||
                  (isBackRequired && !idImageBackUrl?.trim()) ? (
                    <div className="mb-4 p-3 border border-warning rounded">
                      <p className="text-warning mb-2">
                        {!idImageFrontUrl?.trim()
                          ? 'ID document (front) is missing.'
                          : 'ID document (back) is required.'}{' '}
                        Please go back to Step 1.
                      </p>
                      <CommonButton
                        title="Back to Step 1"
                        onClick={goToStep1ForReupload}
                        fluid
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-muted small mb-3">
                        <strong>Document type:</strong> {selectedIdTypeLabel}
                        {!hasAnyOcrField ? (
                          <span className="ms-2">
                            No text was extracted automatically — please enter
                            details as they appear on your ID.
                          </span>
                        ) : null}
                      </p>
                      <Row className="gy-3 mb-3">
                        <Col md={6}>
                          <FormControl
                            label="Full Name (as per document)"
                            name="verifyFullName"
                            type="text"
                            placeholder="Enter full name"
                            value={verifyFullName}
                            onChange={(e: any) =>
                              setVerifyFullName(e?.target?.value ?? '')
                            }
                            required
                          />
                        </Col>
                        <Col md={6}>
                          <FormControl
                            label="Date of Birth (YYYY-MM-DD)"
                            name="verifyDob"
                            type="text"
                            placeholder="1990-01-01"
                            value={verifyDob}
                            onChange={(e: any) =>
                              setVerifyDob(e?.target?.value ?? '')
                            }
                            required
                          />
                        </Col>
                        <Col md={6}>
                          <FormControl
                            label={
                              idType === 'driving_licence'
                                ? 'Licence Number'
                                : idType === 'passport'
                                  ? 'Passport Number'
                                  : 'Document Number'
                            }
                            name="verifyDocumentNumber"
                            type="text"
                            placeholder="Enter document number"
                            value={verifyDocumentNumber}
                            onChange={(e: any) =>
                              setVerifyDocumentNumber(e?.target?.value ?? '')
                            }
                            required
                          />
                        </Col>
                        {(idType === 'voter_id' || idType === 'driving_licence') && (
                          <Col md={6}>
                            <FormControl
                              label="Relation / Guardian Name"
                              name="verifyRelationName"
                              type="text"
                              placeholder="As on document"
                              value={verifyRelationName}
                              onChange={(e: any) =>
                                setVerifyRelationName(e?.target?.value ?? '')
                              }
                              required={false}
                            />
                          </Col>
                        )}
                        {(idType === 'voter_id' ||
                          idType === 'driving_licence' ||
                          idType === 'passport') && (
                          <>
                            <Col md={12}>
                              <FormControl
                                label="Address"
                                name="verifyAddress"
                                type="text"
                                placeholder="Full address as on document"
                                value={verifyAddress}
                                onChange={(e: any) =>
                                  setVerifyAddress(e?.target?.value ?? '')
                                }
                                required={false}
                              />
                            </Col>
                            <Col md={6}>
                              <FormControl
                                label="PIN / Postal Code"
                                name="verifyPin"
                                type="text"
                                placeholder="e.g. 160055"
                                value={verifyPin}
                                onChange={(e: any) =>
                                  setVerifyPin(e?.target?.value ?? '')
                                }
                                required={false}
                              />
                            </Col>
                          </>
                        )}
                        {idType === 'voter_id' ? (
                          <>
                            <Col md={6}>
                              <FormControl
                                label="Gender"
                                name="verifyGender"
                                type="text"
                                placeholder="Optional"
                                value={verifyGender}
                                onChange={(e: any) =>
                                  setVerifyGender(e?.target?.value ?? '')
                                }
                                required={false}
                              />
                            </Col>
                            <Col md={6}>
                              <FormControl
                                label="Last Update Date (YYYY-MM-DD)"
                                name="verifyLastUpdateDate"
                                type="text"
                                placeholder="Optional"
                                value={verifyLastUpdateDate}
                                onChange={(e: any) =>
                                  setVerifyLastUpdateDate(e?.target?.value ?? '')
                                }
                                required={false}
                              />
                            </Col>
                          </>
                        ) : null}
                        {idType === 'driving_licence' ? (
                          <>
                            <Col md={6}>
                              <FormControl
                                label="Date of Issue (YYYY-MM-DD)"
                                name="verifyDlDoi"
                                type="text"
                                placeholder="Optional"
                                value={verifyDlDoi}
                                onChange={(e: any) =>
                                  setVerifyDlDoi(e?.target?.value ?? '')
                                }
                                required={false}
                              />
                            </Col>
                            <Col md={6}>
                              <FormControl
                                label="Valid Until / Expiry (YYYY-MM-DD)"
                                name="verifyDlDoe"
                                type="text"
                                placeholder="Optional"
                                value={verifyDlDoe}
                                onChange={(e: any) =>
                                  setVerifyDlDoe(e?.target?.value ?? '')
                                }
                                required={false}
                              />
                            </Col>
                          </>
                        ) : null}
                        {idType === 'passport' ? (
                          <>
                            <Col md={6}>
                              <FormControl
                                label="File No (optional)"
                                name="verifyPassportFileNo"
                                type="text"
                                placeholder="Enter file no"
                                value={verifyPassportFileNo}
                                onChange={(e: any) =>
                                  setVerifyPassportFileNo(e?.target?.value ?? '')
                                }
                                required={false}
                              />
                            </Col>
                            <Col md={6}>
                              <FormControl
                                label="DOI (optional, YYYY-MM-DD)"
                                name="verifyPassportDoi"
                                type="text"
                                placeholder="2018-05-12"
                                value={verifyPassportDoi}
                                onChange={(e: any) =>
                                  setVerifyPassportDoi(e?.target?.value ?? '')
                                }
                                required={false}
                              />
                            </Col>
                          </>
                        ) : null}
                      </Row>
                      <div className="kyc-step-actions">
                        <CommonButton
                          title="Verify Document & Continue"
                          onClick={handleVerifyDocAndContinue}
                          disabled={stepInProgress === 'document_verify'}
                          isLoading={stepInProgress === 'document_verify'}
                          fluid
                        />
                        <CommonButton
                          title="Back"
                          className="btn-outline-secondary"
                          onClick={handlePrev}
                          disabled={!!stepInProgress}
                          fluid
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Step 3: Selfie + Face Liveness -> then submit (backend does rest) */}
              {currentStep === 'face_liveness' && (
                <>
                  <CommonHeading heading="Face Liveness" className="mb-3" required />
                  <p className="text-muted">
                    Use your device camera to capture a live selfie (gallery upload
                    is disabled for this step). We verify liveness and then submit
                    your KYC; the rest is verified by our team.
                  </p>
                  {!idImageFrontUrl?.trim() ||
                  (isBackRequired && !idImageBackUrl?.trim()) ? (
                    <div className="mb-4 p-3 border border-warning rounded">
                      <p className="text-warning mb-2">
                        {!idImageFrontUrl?.trim()
                          ? 'ID document (front) is missing.'
                          : 'ID document (back) is required.'}{' '}
                        Please go back to Step 1.
                      </p>
                      <CommonButton
                        title="Back to Step 1"
                        onClick={goToStep1ForReupload}
                        fluid
                      />
                    </div>
                  ) : (
                    <>
                      <Row className="gy-3">
                        <Col lg={4} md={6} sm={6}>
                          <SelfieLiveCapture
                            label="Selfie"
                            required
                            name="selfieImage"
                            value={selfieImageFile}
                            setFieldValue={async (_field, file) => {
                              if (file) {
                                setSelfieImageFile(file);
                                const uploaded = await uploadFile(file, 'liveness');
                                if (uploaded?.uploadFile)
                                  setSelfieImageUrl(uploaded.uploadFile);
                              } else {
                                setSelfieImageFile(null);
                                setSelfieImageUrl('');
                              }
                            }}
                          />
                        </Col>
                      </Row>
                      <div className="kyc-step-actions">
                        <Row>
                          <Col lg={4} md={6} sm={6}>
                            {' '}
                            <CommonButton
                              title="Verify Liveness & Submit KYC"
                              onClick={handleLivenessAndSubmit}
                              disabled={
                                !selfieImageUrl || stepInProgress === 'face_liveness'
                              }
                              isLoading={stepInProgress === 'face_liveness'}
                              fluid
                            />
                          </Col>
                          <Col lg={4} md={6} sm={6}>
                            <CommonButton
                              title="Back"
                              className="btn-outline-secondary"
                              onClick={handlePrev}
                              disabled={!!stepInProgress}
                              fluid
                            />
                          </Col>
                        </Row>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
