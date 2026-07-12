import { Form, Formik } from 'formik';
import CommonHeading from '../../../../common/commonHeading/CommonHeading';
import FormControl from '../../../../formik/FormControl';
import * as Yup from 'yup';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import { Col, Row } from 'react-bootstrap';
import UploadDocCard from '../../../../ui/uploadDocCard/UploadDocCard';
import {
  emailField,
  // phoneField,
  ScrollToError,
} from '../../../../onBoarding/signUp/validationSchema';
import { nameField } from '../../../../onBoarding/signUp/validationSchema';
import { Country, State, City } from 'country-state-city';
import { useCallback, useEffect, useRef, useState } from 'react';
import './CompleteOnboarding.scss';
import { useDispatch, useSelector } from 'react-redux';
import { useModal } from '@ebay/nice-modal-react';
import {
  callGetMethod,
  callPostMethod,
} from '../../../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../../../services/api.service';
import { API_ENDPOINTS } from '../../../../../constants/apis/apiEndpoints';
import Toast from '../../../../common/Toast';
import { loader } from '../../../../../redux/Slices/loader.slice';

import { useOnboardingStatus } from '../../../../../hooks/authenticationHooks/useOnboardngStatus';
import { KYCStatus } from '../../../../../interfaces/responses/types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../../utils/Utils';
import { QuestionIcon } from '../../../../../assets/icons/SvgIcon';
import { getKycHeading } from '../../../../../constants/messages/kycMessages';

/** Scrolls to Legal Documents section when validation fails on submit */
const ScrollToLegalDocsError = ({
  submitCount,
  hasError,
  sectionRef,
}: {
  submitCount: number;
  hasError: boolean;
  sectionRef: React.RefObject<HTMLDivElement | null>;
}) => {
  useEffect(() => {
    if (submitCount > 0 && hasError && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [submitCount, hasError, sectionRef]);
  return null;
};

/** Individual KYC document types (as per Sumsub) */
const KYC_DOC_TYPES = {
  VOTER_ID: 'voterId',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'drivingLicense',
  ID_CARD: 'idCard',
} as const;

export type KycDocTypeKey = (typeof KYC_DOC_TYPES)[keyof typeof KYC_DOC_TYPES];

/** Map API documentType string to our doc type key (GET user/kyc/details single-doc response) */
const DOCUMENT_TYPE_TO_KEY: Record<string, KycDocTypeKey> = {
  'Voter ID': KYC_DOC_TYPES.VOTER_ID,
  'Voter Id': KYC_DOC_TYPES.VOTER_ID, // API may return "Voter Id" (lowercase d)
  Passport: KYC_DOC_TYPES.PASSPORT,
  'Driving License': KYC_DOC_TYPES.DRIVING_LICENSE,
  'ID Card': KYC_DOC_TYPES.ID_CARD,
};

/** Map doc type key to API documentType label (for POST payload – passed dynamically from dropdown) */
const KEY_TO_DOCUMENT_TYPE: Record<string, string> = {
  [KYC_DOC_TYPES.VOTER_ID]: 'Voter ID',
  [KYC_DOC_TYPES.PASSPORT]: 'Passport',
  [KYC_DOC_TYPES.DRIVING_LICENSE]: 'Driving License',
  [KYC_DOC_TYPES.ID_CARD]: 'ID Card',
};

const KYC_LEGAL_DOCS = [
  { label: 'Voter ID', required: false, docType: KYC_DOC_TYPES.VOTER_ID },
  { label: 'Passport', required: false, docType: KYC_DOC_TYPES.PASSPORT },
  {
    label: 'Driving License',
    required: false,
    docType: KYC_DOC_TYPES.DRIVING_LICENSE,
  },
  { label: 'Govt ID Card', required: false, docType: KYC_DOC_TYPES.ID_CARD },
];

/** Snapshot of form + docs used to detect unsaved changes for Save as Draft */
type DraftSnapshot = {
  fullName: string;
  residentialAddress: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  uploadUrls: Record<string, string>;
};

const getDraftSnapshotFromValues = (
  values: { fullName: string; residentialAddress: string; country: string; state: string; city: string; postalCode: string },
  uploadUrl: Record<string, { upload: string; preview: string }>
): DraftSnapshot => {
  const countryObj = Country.getCountryByCode(values.country);
  const stateObj = State.getStateByCodeAndCountry(values.state, values.country);
  const uploadUrls: Record<string, string> = {};
  Object.keys(uploadUrl).forEach((key) => {
    if (uploadUrl[key]?.upload) uploadUrls[key] = uploadUrl[key].upload;
  });
  return {
    fullName: (values.fullName ?? '').trim(),
    residentialAddress: values.residentialAddress ?? '',
    country: countryObj?.name ?? values.country ?? '',
    state: stateObj?.name ?? values.state ?? '',
    city: values.city ?? '',
    postalCode: values.postalCode ?? '',
    uploadUrls,
  };
};

const getAddressFieldValue = (
  data: any,
  field: 'state' | 'city' | 'town' | 'postCode' | 'postalCode'
): string => {
  const nested = data?.address?.[field];
  const topLevel = data?.[field];
  return (nested ?? topLevel ?? '').toString().trim();
};

const getResidentialAddressValue = (data: any): string => {
  const nestedResidential = data?.address?.residentialAddress;
  const topLevelResidential = data?.residentialAddress;
  if (typeof nestedResidential === 'string' && nestedResidential.trim()) {
    return nestedResidential.trim();
  }
  if (typeof topLevelResidential === 'string' && topLevelResidential.trim()) {
    return topLevelResidential.trim();
  }
  return '';
};

// const getDraftSnapshotFromFetchedData = (
//   data: any,
//   uploadUrl: Record<string, { upload: string; preview: string }>
// ): DraftSnapshot => {
//   const uploadUrls: Record<string, string> = {};
//   Object.keys(uploadUrl).forEach((key) => {
//     if (uploadUrl[key]?.upload) uploadUrls[key] = uploadUrl[key].upload;
//   });
//   return {
//     fullName: (data?.fullName ?? '').trim(),
//     residentialAddress: data?.residentialAddress ?? data?.address ?? '',
//     country: data?.country ?? '',
//     state: data?.state ?? '',
//     city: data?.city ?? '',
//     postalCode: data?.postalCode ?? '',
//     uploadUrls,
//   };
// };

const isDraftSnapshotEqual = (a: DraftSnapshot, b: DraftSnapshot): boolean => {
  if (
    a.fullName !== b.fullName ||
    a.residentialAddress !== b.residentialAddress ||
    a.country !== b.country ||
    a.state !== b.state ||
    a.city !== b.city ||
    a.postalCode !== b.postalCode
  )
    return false;
  const aKeys = Object.keys(a.uploadUrls).sort();
  const bKeys = Object.keys(b.uploadUrls).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a.uploadUrls[k] === b.uploadUrls[k]);
};

const CompleteKycOnboardingManual = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { getOnboardingStatus } = useOnboardingStatus();
  const [countryCode, setCountryCode] = useState('IN');
  const [prefillData, setPrefillData] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [isEditable, setIsEditable] = useState(true);
  const [uploadUrl, setUploadUrl] = useState<
    Record<string, { upload: string; preview: string }>
  >({});
  const [lastSavedDraftSnapshot, setLastSavedDraftSnapshot] =
    useState<DraftSnapshot | null>(null);
  /** Base upload URLs when form/data was loaded; used so Remove → Re-upload enables Save as Draft */
  const [baseUploadUrlForDraft, setBaseUploadUrlForDraft] = useState<
    Record<string, { upload: string; preview: string }>
  >({});
  const [prefilledStatusCheck, setPrefilledStatusCheck] = useState<KYCStatus | null>(
    null
  );
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const legalDocsSectionRef = useRef<HTMLDivElement>(null);
  const { accountType, email, fullName, phoneNo, country: profileCountry } = useSelector(
    (state: RootState) => state?.user?.profile
  );

  const countries = Country?.getAllCountries()?.map((country) => ({
    value: country?.isoCode,
    label: country?.name,
  }));

  const getStates = (code: string) =>
    State.getStatesOfCountry(code)?.map((state) => ({
      value: state?.isoCode,
      label: state?.name,
    }));

  const getCities = (countryCodeVal: string, stateCode: string) =>
    City.getCitiesOfState(countryCodeVal, stateCode)?.map((city) => ({
      value: city?.name,
      label: city?.name,
    }));

  const getCountryCodeFromNameOrIso = (countryValue: string): string => {
    if (!countryValue) return '';
    const trimmed = countryValue.trim();
    const all = Country.getAllCountries();
    const directIso = all.find(
      (c) => c.isoCode.toLowerCase() === trimmed.toLowerCase()
    );
    if (directIso) return directIso.isoCode;
    const byName = all.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    return byName?.isoCode || '';
  };

  const getStateCodeFromName = (
    stateName: string,
    countryCodeVal: string
  ): string => {
    if (!stateName || !countryCodeVal) return '';
    const state = State.getStatesOfCountry(countryCodeVal)?.find(
      (s) => s.name.toLowerCase() === stateName.toLowerCase()
    );
    return state?.isoCode || '';
  };

  const profileCountryCode = profileCountry
    ? getCountryCodeFromNameOrIso(profileCountry)
    : '';
  const prefilledCountryCode = prefillData?.country
    ? getCountryCodeFromNameOrIso(prefillData.country)
    : '';
  const prefilledStateName = getAddressFieldValue(prefillData, 'state');
  const prefilledStateCode =
    prefilledStateName && prefilledCountryCode
      ? getStateCodeFromName(prefilledStateName, prefilledCountryCode)
      : '';

  // Build legalDocs from GET response: either multi-field (voterIdUrl, etc.) or single idDocType/documentType + documentUrl
  const getPrefilledLegalDocs = (): (string | null)[] => {
    const data = prefillData ?? onboardingData;
    if (!data) return [null, null, null, null];
    const docKeys = [
      KYC_DOC_TYPES.VOTER_ID,
      KYC_DOC_TYPES.PASSPORT,
      KYC_DOC_TYPES.DRIVING_LICENSE,
      KYC_DOC_TYPES.ID_CARD,
    ];
    const apiDocType = data.documentType ?? data.idDocType;
    if (apiDocType && data.documentUrl) {
      const key = DOCUMENT_TYPE_TO_KEY[apiDocType] ?? null;
      if (key) {
        const idx = docKeys.indexOf(key);
        const arr: (string | null)[] = [null, null, null, null];
        arr[idx] = data.documentUrl;
        return arr;
      }
    }
    return [
      data.voterIdUrl || null,
      data.passportUrl || null,
      data.drivingLicenseUrl || null,
      data.idCardUrl || null,
    ];
  };

  const initialValues = {
    fullName: onboardingData?.fullName ?? fullName ?? '',
    email: accountType === 'Individual' && email ? email : '',
    phoneNumber: onboardingData?.phoneNo ?? phoneNo ?? '+91',
    residentialAddress:
      getResidentialAddressValue(prefillData) ||
      getResidentialAddressValue(onboardingData) ||
      '',
    postalCode:
      getAddressFieldValue(prefillData, 'postalCode') ||
      getAddressFieldValue(prefillData, 'postCode') ||
      getAddressFieldValue(onboardingData, 'postalCode') ||
      getAddressFieldValue(onboardingData, 'postCode') ||
      '',
    country: prefilledCountryCode || profileCountryCode || 'IN',
    state: prefilledStateCode || prefilledStateName || '',
    city:
      getAddressFieldValue(prefillData, 'city') ||
      getAddressFieldValue(prefillData, 'town') ||
      getAddressFieldValue(onboardingData, 'city') ||
      getAddressFieldValue(onboardingData, 'town') ||
      '',
    legalDocs: getPrefilledLegalDocs(),
  };

  const validationSchema = Yup.object({
    fullName: nameField,
    email: emailField,
    // phoneNumber: phoneField(countryCode),
    residentialAddress: Yup.string()
      .required('Residential Address is required')
      .trim()
      .min(10, 'Residential Address must be at least 10 characters')
      .max(300, 'Residential Address cannot exceed 300 characters')
      .matches(
        /^[a-zA-Z0-9\s.,\-/()#]+$/,
        'Residential Address can only contain letters, numbers, spaces, and common punctuation (., - / ( ) #)'
      ),
    postalCode: Yup.string()
      .required('Postal Code is required')
      .trim()
      .when('country', {
        is: (country: string) => country === 'IN',
        then: (schema) =>
          schema.matches(
            /^\d{6}$/,
            'Postal code for India must be 6 digits (numbers only)'
          ),
        otherwise: (schema) =>
          schema
            .min(4, 'Postal code must be at least 4 characters')
            .max(10, 'Postal code cannot exceed 10 characters')
            .matches(
              /^[a-zA-Z0-9]+$/,
              'Postal code must be 4–10 characters. Letters and numbers only; no spaces or hyphens.'
            ),
      }),
    country: Yup.string().required('Country is required'),
    state: Yup.string()
      .transform((v) => (v == null || v === '' ? '' : String(v)))
      .required('State is required')
      .trim()
      .test(
        'state-min-length',
        'State must be at least 2 characters',
        function (value) {
          const str = value == null ? '' : String(value).trim();
          const country = (this as any).parent?.country;
          const stateOptions = country ? getStates(country) : [];
          const isFromDropdown = stateOptions.some((s) => String(s?.value) === str);
          if (isFromDropdown) return true;
          return !str || str.length >= 2 || /^\d{1,15}$/.test(str);
        }
      )
      .max(200, 'State cannot exceed 200 characters')
      .test(
        'state-has-letter-or-code',
        'State must contain at least one letter (cannot be only punctuation)',
        function (value) {
          const str = value == null ? '' : String(value).trim();
          const country = (this as any).parent?.country;
          const stateOptions = country ? getStates(country) : [];
          if (stateOptions.some((s) => String(s?.value) === str)) return true;
          return !value || /\p{L}/u.test(value) || /^[A-Za-z0-9\-]{1,15}$/.test(str);
        }
      )
      .test(
        'state-format',
        "State can only contain letters, spaces, and . ' -",
        function (value) {
          const str = value == null ? '' : String(value).trim();
          const country = (this as any).parent?.country;
          const stateOptions = country ? getStates(country) : [];
          if (stateOptions.some((s) => String(s?.value) === str)) return true;
          return !value || /^[\p{L}\s\-'.]+$/u.test(value) || /^[A-Za-z0-9\-]{1,15}$/.test(str);
        }
      ),
    city: Yup.string()
      .required('City is required')
      .trim()
      .min(2, 'City must be at least 2 characters')
      .max(200, 'City cannot exceed 200 characters')
      .test(
        'city-has-letter',
        'City must contain at least one letter (cannot be only punctuation)',
        (value) => !value || /\p{L}/u.test(value)
      )
      .matches(
        /^[\p{L}\s\-'.]+$/u,
        "City can only contain letters, spaces, and . ' -"
      ),
    legalDocs: Yup.array()
      .of(Yup.mixed().nullable())
      .test(
        'at-least-one-doc',
        'At least one legal document is required. Please upload a PDF',
        (docs) =>
          Array.isArray(docs) &&
          docs.some((d) => typeof d === 'string' && d.trim().length > 0)
      ),
  });

  const AlertModal = useModal('AlertModal');
  const closeAlertModal = useCallback(() => {
    AlertModal?.remove();
  }, [AlertModal]);

  const fetchOnboardingData = useCallback(
    async (status: KYCStatus | null) => {
      try {
        const res: any = await callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.GET.GET_KYC,
          params: {},
          showToaster: false,
          dispatch,
          showLoader: true,
          showButtonLoader: false,
          token: true,
        });

        if (res?.success && res?.data) {
          const data = res.data;
          setOnboardingData(data);
          setPrefillData(data);

          const mappedDocs: Record<string, { upload: string; preview: string }> = {};
          // Support multi-field response (voterIdUrl, passportUrl, etc.)
          if (data.voterIdUrl) {
            mappedDocs[KYC_DOC_TYPES.VOTER_ID] = {
              upload: data.voterIdUrl,
              preview: data.voterIdUrlPreview || data.voterIdUrl,
            };
          }
          if (data.passportUrl) {
            mappedDocs[KYC_DOC_TYPES.PASSPORT] = {
              upload: data.passportUrl,
              preview: data.passportUrlPreview || data.passportUrl,
            };
          }
          if (data.drivingLicenseUrl) {
            mappedDocs[KYC_DOC_TYPES.DRIVING_LICENSE] = {
              upload: data.drivingLicenseUrl,
              preview: data.drivingLicenseUrlPreview || data.drivingLicenseUrl,
            };
          }
          if (data.idCardUrl) {
            mappedDocs[KYC_DOC_TYPES.ID_CARD] = {
              upload: data.idCardUrl,
              preview: data.idCardUrlPreview || data.idCardUrl,
            };
          }
          // Support single-doc GET response (documentType + documentUrl)
          const apiDocType = data.documentType ?? data.idDocType;
          if (apiDocType && data.documentUrl) {
            const key = DOCUMENT_TYPE_TO_KEY[apiDocType];
            if (key && !mappedDocs[key]) {
              mappedDocs[key] = {
                upload: data.documentUrl,
                preview:
                  data.documentPreviewUrl ||
                  data.documentUrlPreview ||
                  data.documentUrl,
              };
            }
          }
          // Proceed case / view KYC detail: set uploadUrl and selectedDocType so document type and prefilled document show
          setUploadUrl(mappedDocs);
          setBaseUploadUrlForDraft(mappedDocs);
          if (apiDocType) {
            const key = DOCUMENT_TYPE_TO_KEY[apiDocType];
            if (key) setSelectedDocType(key);
          } else if (Object.keys(mappedDocs).length > 0) {
            setSelectedDocType(Object.keys(mappedDocs)[0]);
          }

          // Reference KYB: Pending/Verified = read-only; Initialised/Rejected/null = editable
          if (status === 'Pending' || status === 'Verified') {
            setIsEditable(false);
          } else if (
            status === 'Rejected' ||
            status === 'Initialised' ||
            status === null
          ) {
            setIsEditable(true);
          }
        }
      } catch (error: any) {
        console.error('Error fetching KYC data:', error);
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  // All cases aligned with KYB: null/Initialised/Rejected = editable; Pending/Verified = read-only
  useEffect(() => {
    (async () => {
      const status = await getOnboardingStatus();
      setPrefilledStatusCheck(status);
      if (
        status === 'Initialised' ||
        status === 'Pending' ||
        status === 'Rejected' ||
        status === 'Verified'
      ) {
        fetchOnboardingData(status);
      }
      if (status === null) {
        setIsEditable(true);
      }
    })();
  }, [getOnboardingStatus, fetchOnboardingData]);

  // When prefilled docs (uploadUrl) are set, show that type in dropdown so prefilled image/PDF is visible
  useEffect(() => {
    const keys = Object.keys(uploadUrl);
    if (keys.length > 0 && !selectedDocType) {
      setSelectedDocType(keys[0]);
    }
  }, [uploadUrl]);

  // Restore uploadUrl from Redux when user had uploaded but not saved draft (e.g. refresh or return to page)
 

  const uploadSingleDoc = async (
    file: File,
    type: string
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const uploadRes = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.UPLOAD_DOCUMENTS,
        data: formData,
        dispatch,
        showToaster: false,
        showLoader: true,
        showButtonLoader: false,
        token: true,
      });

      if (uploadRes?.success) {
        Toast.success(uploadRes?.message || 'File uploaded successfully');
        const uploadedFile = uploadRes?.data?.uploadFile;
        // Use uploadFilePreview for document preview (same flow as KYB confirm / CompleteKybOnboarding)
        const previewFile =
          uploadRes?.data?.previewFile ||
          uploadRes?.data?.uploadFilePreview ||
          uploadedFile;
        if (uploadedFile) {
          const doc = { upload: uploadedFile, preview: previewFile || uploadedFile };
          setUploadUrl((prev) => ({ ...prev, [type]: doc }));

          return uploadedFile;
        }
        Toast.error('File upload succeeded but no file URL was returned');
        return null;
      }
      const errorMessage =
        uploadRes?.error ||
        uploadRes?.message ||
        'Failed to upload file. Please try again.';
      Toast.error(errorMessage);
      return null;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'An unexpected error occurred while uploading the file. Please try again.';
      Toast.error(errorMessage);
      return null;
    }
  };

  const handleSaveandDraft = async (values: typeof initialValues) => {
    try {
      const countryObj = Country.getCountryByCode(values.country);
      const stateObj = State.getStateByCodeAndCountry(values.state, values.country);

      const firstDocKey = Object.keys(uploadUrl)[0];
      const docKeyForUrl =
        selectedDocType && uploadUrl[selectedDocType]
          ? selectedDocType
          : firstDocKey;
      const documentTypeLabel =
        selectedDocType && KEY_TO_DOCUMENT_TYPE[selectedDocType]
          ? KEY_TO_DOCUMENT_TYPE[selectedDocType]
          : firstDocKey && KEY_TO_DOCUMENT_TYPE[firstDocKey]
            ? KEY_TO_DOCUMENT_TYPE[firstDocKey]
            : undefined;
      const documentUrlValue = docKeyForUrl
        ? uploadUrl[docKeyForUrl]?.upload
        : undefined;

      const payload: any = {
        fullName: values.fullName?.trim(),
        residentialAddress: values.residentialAddress,
        country: countryObj?.name || values.country,
        state: stateObj?.name || values.state,
        city: values.city,
        postalCode: values.postalCode,
        ...(documentTypeLabel ? { documentType: documentTypeLabel } : {}),
        ...(documentUrlValue ? { documentUrl: documentUrlValue } : {}),
        mode: 'draft',
      };

      const res = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.CREATE_KYC,
        data: payload,
        token: true,
        dispatch,
        showToaster: true,
        showLoader: true,
        showButtonLoader: false,
        buttonKey: 'onboardingbtn',
      });
      if (res?.success) {
        Toast.success(res?.message);
        setLastSavedDraftSnapshot(
          getDraftSnapshotFromValues(values, uploadUrl)
        );
        const latestStatus = await getOnboardingStatus();
        await fetchOnboardingData(latestStatus ?? null);
        setIsEditable(true);
      } else {
        Toast.error(res?.message);
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      Toast.error(error?.message);
    } finally {
      dispatch(loader(false));
    }
  };

  const handleSaveandProceed = async (
    values: typeof initialValues,
    resetForm: () => void
  ) => {

    try {
      const countryObj = Country.getCountryByCode(values.country);
      const stateObj = State.getStateByCodeAndCountry(values.state, values.country);

      const firstDocKey = Object.keys(uploadUrl)[0];
      const docKeyForUrl =
        selectedDocType && uploadUrl[selectedDocType]
          ? selectedDocType
          : firstDocKey;
      const documentTypeLabel =
        selectedDocType && KEY_TO_DOCUMENT_TYPE[selectedDocType]
          ? KEY_TO_DOCUMENT_TYPE[selectedDocType]
          : firstDocKey && KEY_TO_DOCUMENT_TYPE[firstDocKey]
            ? KEY_TO_DOCUMENT_TYPE[firstDocKey]
            : undefined;
      const documentUrlValue = docKeyForUrl
        ? uploadUrl[docKeyForUrl]?.upload
        : undefined;

      const payload = {
        fullName: values.fullName?.trim(),
        residentialAddress: values.residentialAddress,
        country: countryObj?.name || values.country,
        state: stateObj?.name || values.state,
        city: values.city,
        postalCode: values.postalCode,
        ...(documentTypeLabel ? { documentType: documentTypeLabel } : {}),
        ...(documentUrlValue ? { documentUrl: documentUrlValue } : {}),
        mode: 'save',
      };

      const res = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.CREATE_KYC,
        token: true,
        data: payload,
        showToaster: true,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        buttonKey: 'onboardingbtn',
      });
      if (res?.success) {
        Toast.success(res?.message);
        await getOnboardingStatus();
        resetForm();
        navigate(`/${ROUTES.USER}/${ROUTES.DASHBOARD}`);
      } else {
        Toast.error(res?.message);
      }
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      Toast.error(error?.message);
    } finally {
      dispatch(loader(false));
    }
  };

  return (
    <>
      <section className="completeOnboarding">
        <CommonHeading
          heading={
            prefilledStatusCheck === 'Pending'
              ? getKycHeading('Pending', null, 0)
              : 'Complete onboarding'
          }
        />
        <Formik
          initialValues={initialValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting, resetForm }) => {
            AlertModal.show({
              closeAlertModal,
              icon: <QuestionIcon />,
              heading: 'Are You Sure?',
              subheading: 'You want to submit your details?',
              btntext: 'No',
              btntextclassName: 'btn-secondry',
              btncountinue: 'Yes',
              btntextOnClick: closeAlertModal,
              btncountinueOnClick: () => {
                closeAlertModal();
                handleSaveandProceed(values, resetForm);
              },
            });
            setSubmitting(false);
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            setFieldTouched,
            setFieldError,
            validateField,
            //  dirty,
            submitCount,
          }) => (
            <>
              <ScrollToLegalDocsError
                submitCount={submitCount}
                hasError={!!errors?.legalDocs}
                sectionRef={legalDocsSectionRef}
              />
              <Form onSubmit={handleSubmit}>
                <div className="completeOnboarding_institution">
                  <CommonHeading heading="Basic Information" />
                  <Row>
                    <Col sm={6} lg={4}>
                      <FormControl
                        label="Full Name"
                        name="fullName"
                        type="text"
                        placeholder="Enter full name"
                        value={values.fullName}
                        onChange={(e: any) => {
                          handleChange(e);
                          setFieldTouched('fullName', true, false);
                          validateField('fullName');
                        }}
                        onBlur={(e: any) => {
                          handleBlur(e);
                          validateField('fullName');
                        }}
                        maxLength={100}
                        required
                        error={
                          touched?.fullName && errors?.fullName
                            ? errors?.fullName
                            : ''
                        }
                        disabled={!isEditable}
                      />
                    </Col>
                    <Col sm={6} lg={4}>
                      <FormControl
                        label="Email ID"
                        name="email"
                        type="email"
                        placeholder="xyz123@gmail.com"
                        value={values.email}
                        required
                        maxLength={100}
                        onBlur={handleBlur}
                        error={touched?.email && errors?.email ? errors?.email : ''}
                        readOnly
                        disabled
                      />
                    </Col>
                    <Col sm={6} lg={4}>
                      <FormControl
                        label="Mobile Number"
                        control="phone"
                        name="phoneNumber"
                        placeholder="Mobile number"
                        onBlur={handleBlur}
                        required
                        value={values.phoneNumber}
                        country={countryCode?.toLowerCase() || 'in'}
                        error={touched?.phoneNumber && errors?.phoneNumber}
                        onChange={(value: string, data: any) => {
                          setFieldValue('phoneNumber', `+${value}`);
                          setCountryCode(data?.countryCode?.toUpperCase());
                        }}
                        disableCountryCode={true}
                        disableDropdown={false}
                        enableSearch={true}
                        disabled
                        readOnly
                        maxLength={13}
                      />
                    </Col>
                  </Row>
                </div>

                <div className="completeOnboarding_address">
                  <CommonHeading heading="Address Details" />
                  <Row>
                    <Col sm={6} lg={4}>
                      <FormControl
                        label="Residential Address"
                        name="residentialAddress"
                        type="text"
                        placeholder="Enter residential address"
                        value={values.residentialAddress}
                        onChange={(e: any) => {
                          handleChange(e);
                          setFieldTouched('residentialAddress', true, false);
                          validateField('residentialAddress');
                        }}
                        onBlur={(e: any) => {
                          handleBlur(e);
                          validateField('residentialAddress');
                        }}
                        maxLength={300}
                        required
                        error={
                          touched?.residentialAddress && errors?.residentialAddress
                            ? errors?.residentialAddress
                            : ''
                        }
                        disabled={!isEditable}
                      />
                    </Col>
                    <Col sm={6} lg={4}>
                      {countries?.length > 0 ? (
                        <FormControl
                          label="Country"
                          control="select"
                          name="country"
                          className="blockchain_sel"
                          options={countries}
                          value={
                            countries?.find((c) => c.value === values.country) ||
                            null
                          }
                          placeholder="Select a Country"
                          required
                          onBlur={() => setFieldTouched('country', true, true)}
                          error={touched?.country && errors?.country}
                          disabled
                        />
                      ) : (
                        <FormControl
                          label="Country"
                          control="input"
                          type="text"
                          name="country"
                          className="blockchain_inp"
                          value={values.country}
                          placeholder="Enter Country"
                          required
                          onBlur={() => {
                            setFieldTouched('country', true, true);
                            validateField('country');
                          }}
                          error={touched?.country && errors?.country}
                          disabled
                          readOnly
                        />
                      )}
                    </Col>
                    <Col sm={6} lg={4}>
                      {values.country && getStates(values.country)?.length > 0 ? (
                        <FormControl
                          label="State"
                          control="select"
                          name="state"
                          className="blockchain_sel"
                          options={values.country ? getStates(values.country) : []}
                          value={
                            values.state != null && String(values.state).trim() !== ''
                              ? getStates(values.country)?.find(
                                  (s) => String(s?.value) === String(values.state)
                                ) ?? null
                              : null
                          }
                          noOptionsMessage={() =>
                            'Please select your country first.'
                          }
                          onChange={(option: any) => {
                            const nextState =
                              option?.value != null ? String(option.value) : '';
                            if (option != null) setFieldError('state', undefined);
                            setFieldValue('state', nextState);
                            setFieldValue('city', '');
                            setFieldTouched('state', true, true);
                            setTimeout(() => validateField('state'), 0);
                          }}
                          placeholder="Select a State"
                          required
                          onBlur={() => {
                            setFieldTouched('state', true, true);
                            validateField('state');
                          }}
                          error={
                            touched?.state && errors?.state
                              ? errors?.state
                              : undefined
                          }
                          disabled={!isEditable}
                        />
                      ) : (
                        <FormControl
                          label="State"
                          control="input"
                          type="text"
                          name="state"
                          className="blockchain_inp"
                          value={values.state}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const v = (e.target.value || '')
                              .replace(/[^\p{L}\s\-'.]/gu, '')
                              .slice(0, 200);
                            setFieldValue('state', v);
                            setFieldTouched('state', true, true);
                            if (v.trim() !== '') setFieldError('state', undefined);
                            setTimeout(() => validateField('state'), 0);
                          }}
                          placeholder="Enter State"
                          maxLength={200}
                          required
                          onBlur={() => {
                            setFieldTouched('state', true, true);
                            validateField('state');
                          }}
                          error={touched?.state && errors?.state}
                          disabled={!isEditable}
                        />
                      )}
                    </Col>
                    <Col sm={6} lg={4}>
                      {values.country &&
                      values.state &&
                      getCities(values.country, values.state)?.length > 0 ? (
                        <FormControl
                          label="City"
                          control="select"
                          name="city"
                          className="blockchain_sel"
                          options={
                            values.country && values.state
                              ? getCities(values.country, values.state)
                              : []
                          }
                          noOptionsMessage={() => 'Please select your state first.'}
                          value={
                            values.country && values.state
                              ? getCities(values.country, values.state)?.find(
                                  (c) => String(c?.value) === String(values.city)
                                ) ?? null
                              : null
                          }
                          onChange={(option: any) => {
                            const nextCity = option?.value != null ? String(option.value) : '';
                            setFieldValue('city', nextCity);
                            setFieldTouched('city', true, true);
                            if (option != null) setFieldError('city', undefined);
                            setTimeout(() => validateField('city'), 0);
                          }}
                          placeholder="Select a City"
                          required
                          onBlur={() => {
                            setFieldTouched('city', true, true);
                            validateField('city');
                          }}
                          error={touched?.city && errors?.city}
                          disabled={!isEditable}
                        />
                      ) : (
                        <FormControl
                          label="City"
                          control="input"
                          type="text"
                          name="city"
                          className="blockchain_inp"
                          value={values.city}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const v = (e.target.value || '')
                              .replace(/[^\p{L}\s\-'.]/gu, '')
                              .slice(0, 200);
                            setFieldValue('city', v);
                            setFieldTouched('city', true, true);
                            if (v.trim() !== '') setFieldError('city', undefined);
                            setTimeout(() => validateField('city'), 0);
                          }}
                          placeholder="Enter City"
                          maxLength={200}
                          required
                          onBlur={() => {
                            setFieldTouched('city', true, true);
                            validateField('city');
                          }}
                          error={touched?.city && errors?.city}
                          disabled={!isEditable}
                        />
                      )}
                    </Col>
                    <Col sm={6} lg={4}>
                      <FormControl
                        label="Postal Code"
                        name="postalCode"
                        type="text"
                        placeholder="Enter postal code"
                        maxLength={values.country === 'IN' ? 6 : 10}
                        value={values.postalCode}
                        onChange={(e: any) => {
                          const v = (e.target.value || '').replace(/[\s\-]/g, '');
                          setFieldValue('postalCode', v);
                          setFieldTouched('postalCode', true, false);
                          validateField('postalCode');
                        }}
                        onBlur={(e: any) => {
                          handleBlur(e);
                          validateField('postalCode');
                        }}
                        required
                        error={
                          touched?.postalCode && errors?.postalCode
                            ? errors?.postalCode
                            : ''
                        }
                        disabled={!isEditable}
                      />
                    </Col>
                  </Row>
                </div>

                <div
                  className="completeOnboarding_doc"
                  ref={legalDocsSectionRef}
                  id="legal-docs-section"
                >
                  <CommonHeading heading="Legal Documents" required />
                  <Row>
                    <Col sm={6} lg={4} className="mb-4">
                      <FormControl
                        label="Document Type"
                        control="select"
                        name="documentTypeSelect"
                        className="blockchain_sel"
                        required={false}
                        options={KYC_LEGAL_DOCS.map((item) => ({
                          value: item.docType,
                          label: item.label + (item.required ? ' *' : ''),
                        }))}
                        value={(() => {
                          const opt = KYC_LEGAL_DOCS.find(
                            (d) => d.docType === selectedDocType
                          );
                          return opt
                            ? {
                                value: opt.docType,
                                label: opt.label + (opt.required ? ' *' : ''),
                              }
                            : null;
                        })()}
                        onChange={(option: any) => {
                          setSelectedDocType(option?.value ?? '');
                          setFieldTouched('legalDocs', true, true);
                        }}
                        placeholder="Select document type"
                        onBlur={() => validateField('legalDocs')}
                        error={undefined}
                        disabled={!isEditable}
                      />
                    </Col>
                  </Row>
                  {selectedDocType && (
                    <Row>
                      <Col
                        sm={6}
                        lg={4}
                        className="mb-4"
                        onClick={() => {
                          setFieldTouched('legalDocs', true, true);
                          validateField('legalDocs');
                        }}
                      >
                        {(() => {
                          const item = KYC_LEGAL_DOCS.find(
                            (d) => d.docType === selectedDocType
                          );
                          const index = item ? KYC_LEGAL_DOCS.indexOf(item) : 0;
                          if (!item) return null;
                          const preview =
                            prefilledStatusCheck === 'Pending' ||
                            prefilledStatusCheck === 'Verified';
                          if (
                            preview &&
                            typeof values?.legalDocs[index] !== 'string'
                          )
                            return null;
                          return (
                            <UploadDocCard
                              label={item.label}
                              docType={item.docType}
                              required={item.required}
                              name={`legalDocs.${index}`}
                              value={values?.legalDocs[index]}
                              acceptOnlyPdf={true}
                              acceptOnlyImages={false}
                              setFieldValue={async (
                                field: string,
                                file: File | null
                              ) => {
                                if (file && file instanceof File) {
                                  setFieldValue(field, file);
                                  try {
                                    const uploadedDoc = await uploadSingleDoc(
                                      file,
                                      item.docType
                                    );
                                    if (uploadedDoc) {
                                      setFieldValue(field, uploadedDoc);
                                    } else {
                                      setFieldValue(field, null);
                                    }
                                  } catch (err) {
                                    setFieldValue(field, null);
                                    console.error('Error in file upload:', err);
                                  }
                                } else {
                                  setFieldValue(field, file);
                                }
                              }}
                              prefilledUrl={
                                uploadUrl?.[item.docType]?.preview ??
                                (item.docType === KYC_DOC_TYPES.VOTER_ID
                                    ? prefillData?.voterIdUrlPreview
                                    : item.docType === KYC_DOC_TYPES.PASSPORT
                                      ? prefillData?.passportUrlPreview
                                      : item.docType ===
                                          KYC_DOC_TYPES.DRIVING_LICENSE
                                        ? prefillData?.drivingLicenseUrlPreview
                                        : item.docType === KYC_DOC_TYPES.ID_CARD
                                          ? prefillData?.idCardUrlPreview
                                          : undefined)
                              }
                              prefilledStatusCheck={prefilledStatusCheck}
                              setUploadUrl={setUploadUrl}
                            />
                          );
                        })()}
                      </Col>
                    </Row>
                  )}
                  {submitCount > 0 &&
                    errors?.legalDocs &&
                    (Array.isArray(errors.legalDocs) ||
                      typeof errors.legalDocs === 'string') && (
                      <div className="error_text">
                        {(Array.isArray(errors?.legalDocs)
                          ? errors?.legalDocs[0]
                          : typeof errors?.legalDocs === 'string'
                            ? errors?.legalDocs
                            : 'At least one legal document is required. Please upload a PDF.'
                        )?.toString()}
                      </div>
                    )}
                </div>

                <div className="completeOnboarding_actionbtn">
                  <Row>
                    <Col sm={4} lg={3} xs={6} className="mb-4 mb-sm-0">
                      <CommonButton
                        title="Save as Draft"
                        type="button"
                        fluid
                        disabled={
                          !isEditable ||
                          (() => {
                            const hasUploadedDoc = Object.keys(uploadUrl).some(
                              (k) => uploadUrl[k]?.upload
                            );
                            if (!hasUploadedDoc) return true;
                            return isDraftSnapshotEqual(
                              getDraftSnapshotFromValues(values, uploadUrl),
                              lastSavedDraftSnapshot ??
                                getDraftSnapshotFromValues(
                                  initialValues,
                                  baseUploadUrlForDraft
                                )
                            );
                          })()
                        }
                        onClick={() => handleSaveandDraft(values)}
                      />
                    </Col>
                    <Col sm={4} lg={3} xs={6}>
                      <CommonButton
                        title="Save & Proceed"
                        type="submit"
                        fluid
                        disabled={!isEditable}
                      />
                    </Col>
                  </Row>
                </div>
                <ScrollToError />
              </Form>
            </>
          )}
        </Formik>
      </section>
    </>
  );
};

export default CompleteKycOnboardingManual;
