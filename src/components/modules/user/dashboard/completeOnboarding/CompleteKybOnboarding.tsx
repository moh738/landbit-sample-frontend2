import { Form, Formik } from 'formik';
import CommonHeading from '../../../../common/commonHeading/CommonHeading';
import FormControl from '../../../../formik/FormControl';
import * as Yup from 'yup';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import { Col, Row } from 'react-bootstrap';
import { CalendarIcon, QuestionIcon } from '../../../../../assets/icons/SvgIcon';
import UploadDocCard from '../../../../ui/uploadDocCard/UploadDocCard';
import {
  emailField,
  phoneField,
  ScrollToError,
} from '../../../../onBoarding/signUp/validationSchema';
import { Country, State, City } from 'country-state-city';
import { useCallback, useEffect, useState } from 'react';
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

const CompleteKybOnboarding = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { getOnboardingStatus } = useOnboardingStatus();
  const [countryCode, setCountryCode] = useState('IN');
  const [prefillData, setPrefillData] = useState<any>('');
  const [onboardingData, setOnboardingData] = useState<any>('');
  const [isEditable, setIsEditable] = useState(true);
  const [uploadUrl, setUploadUrl] = useState<any>({});
  const [prefilledStatusCheck, setPrefilledStatusCheck] = useState<any>(null);
  const { accountType, email, fullName, phoneNo, country: profileCountry } = useSelector(
    (state: RootState) => state?.user?.profile
  );

  const countries = Country?.getAllCountries()?.map((country) => ({
    value: country?.isoCode,
    label: country?.name,
  }));

  const getStates = (countryCode: string) =>
    State.getStatesOfCountry(countryCode)?.map((state) => ({
      value: state?.isoCode,
      label: state?.name,
    }));

  const getCities = (countryCode: string, stateCode: string) =>
    City.getCitiesOfState(countryCode, stateCode)?.map((city) => ({
      value: city?.name,
      label: city?.name,
    }));

  // Helper function to find country ISO code from country name or ISO value
  const getCountryCodeFromNameOrIso = (countryValue: string): string => {
    if (!countryValue) return '';
    const trimmed = countryValue.trim();
    const all = Country?.getAllCountries();
    const directIso = all.find(
      (c) => c.isoCode.toLowerCase() === trimmed.toLowerCase()
    );
    if (directIso) return directIso.isoCode;
    const byName = all.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    return byName?.isoCode || '';
  };

  // Helper function to find state ISO code from state name and country code
  const getStateCodeFromName = (stateName: string, countryCode: string): string => {
    if (!stateName || !countryCode) return '';
    const state = State.getStatesOfCountry(countryCode)?.find(
      (s) => s.name.toLowerCase() === stateName.toLowerCase()
    );
    return state?.isoCode || '';
  };

  const DOC_TYPES = {
    INCORP_CERT: 'incorporationCertUrl',
    GST_CERT: 'gstCertUrl',
    ADDRESS_PROOF: 'addressProofUrl',
    SIGNATORY_ID: 'signatoryIdUrl',
  };

  // Helper function to format date in local timezone (YYYY-MM-DD)
  const formatDateLocal = (date: Date | string | null): string | null => {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const profileCountryCode = profileCountry
    ? getCountryCodeFromNameOrIso(profileCountry)
    : '';
  const prefilledCountryCode = prefillData?.country
    ? getCountryCodeFromNameOrIso(prefillData.country)
    : '';
  const prefilledStateCode = prefillData?.state && prefilledCountryCode
    ? getStateCodeFromName(prefillData.state, prefilledCountryCode)
    : '';

  const initialValues = {
    fullName: onboardingData?.fullName || fullName || '',
    email: accountType === 'Institutional' && email ? email : '',
    phoneNumber: onboardingData?.phoneNo || phoneNo || '+91',
    registrationNumber: prefillData?.regtNo || '',
    inCorporationDate: prefillData?.incorporationDate
      ? new Date(prefillData.incorporationDate)
      : null,
    annualTurnOver: prefillData?.annualTurnover || '',
    detailedAddress: prefillData?.address || '',
    postalCode: prefillData?.postalCode || '',
    country: prefilledCountryCode || profileCountryCode || '',
    state: prefilledStateCode,
    city: prefillData?.city || '',
    legalDocs: [
      prefillData?.incorporationCertUrl || null,
      prefillData?.gstCertUrl || null,
      prefillData?.addressProofUrl || null,
      prefillData?.signatoryIdUrl || null,
    ],
    institutionType: prefillData?.institutionType || '',
  };

  const validationSchema = Yup.object({
    fullName: Yup.string()
      .required('Institution Name is required')
      .trim()
      .matches(
        /^[A-Za-z0-9]{2,}(?: [A-Za-z0-9]+)*$/,
        'Enter institution name (2–100 letters and numbers) with single spaces only.'
      ),

    email: emailField,

    phoneNumber: phoneField(countryCode),

    registrationNumber: Yup.string()
      .required('Registration Number is required')
      .matches(
        /^[a-zA-Z0-9/]{5,30}$/,
        'Registration Number must be 5–30 characters and may include letters, numbers, and /.'
      ),

    inCorporationDate: Yup.date()
      .required('Date Of Incorporation is required')
      .test(
        'not-future',
        'Date of Incorporation cannot be in the future',
        function (value) {
          if (!value) return true;
          const today = new Date();
          today.setHours(23, 59, 59, 999); // Set to end of today
          return value <= today;
        }
      ),

    annualTurnOver: Yup.string()
      .required('Annual Turnover is required')
      .matches(
        /^[0-9]+(\,[0-9]{3})*(\.[0-9]+)?$/,
        'Enter a valid amount (numbers, commas, decimals only)'
      )
      .test(
        'nonNegative',
        'Annual Turnover must be 0 or greater',
        (value) => !!value && parseFloat(value.replace(/,/g, '')) >= 0
      ),

    detailedAddress: Yup.string()
      .required('Detailed Address is required')
      .trim()
      .matches(
        /^.{10,300}$/,
        'Detailed Address must be 10–300 characters and include letters, numbers, spaces, or common punctuation.'
      )
      .max(300, 'Detailed Address cannot exceed the allowed length'),

    institutionType: Yup.string()
      .transform((v) => (v == null || v === undefined ? '' : String(v)))
      .trim()
      .required('Institutional Type is required'),

    legalDocs: Yup.array()
      .of(Yup.mixed()?.nullable())
      .test(
        'first-doc-required',
        'Incorporation certificate is required',
        (docs) => {
          return docs && docs[0] != null;
        }
      ),

    // postalCode: Yup.string()
    //   .required('Postal Code is required')
    //   .trim()
    //   .when('country', {
    //     is: (country: string) => country === 'IN',
    //     then: (schema) =>
    //       schema.matches(
    //         /^\d{3}\s?\d{3}$/,
    //         'Postal code for India must be 6 digits (e.g. 400001 or 400 001)'
    //       ),
    //     otherwise: (schema) =>
    //       schema.matches(
    //         /^[a-zA-Z0-9]{4,10}$/,
    //         'Postal code must be 4–10 alphanumeric characters.'
    //       ),
    //   }),
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
              'Postal code must be 4–10 characters. Letters and numbers only.'
            ),
      }),

    country: Yup.string().required('Country is required'),
    state: Yup.string()
      .transform((v) => (v == null || v === '') ? '' : String(v))
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
  });

  const institutionalOptions = [
    {
      value: 'Corporation / Private Limited Company',
      label: 'Corporation / Private Limited Company',
    },
    { value: 'Public Limited Company', label: 'Public Limited Company' },
    { value: 'Partnership Firm', label: 'Partnership Firm' },
    {
      value: 'Limited Liability Partnership (LLP)',
      label: 'Limited Liability Partnership (LLP)',
    },
    {
      value: 'Sole Proprietorship',
      label: 'Sole Proprietorship',
    },
    {
      value: 'Trust',
      label: 'Trust',
    },
    {
      value: 'Foundation / Non-Profit Organization',
      label: 'Foundation / Non-Profit Organization',
    },
    {
      value: 'Government Entity / Public Sector Unit',
      label: 'Government Entity / Public Sector Unit',
    },
    {
      value: 'Financial Institution',
      label: 'Financial Institution',
    },
    {
      value: 'Family Office / Investment Fund',
      label: 'Family Office / Investment Fund',
    },
  ];

  const legalDoc = [
    {
      label: 'Incorporation certificate',
      required: true,
      docType: DOC_TYPES?.INCORP_CERT,
    },
    {
      label: 'GST certificate',
      required: false,
      docType: DOC_TYPES?.GST_CERT,
    },
    {
      label: 'Proof of Address of Company',
      required: false,
      docType: DOC_TYPES?.ADDRESS_PROOF,
    },
    {
      label: 'Authorized Signatory’s ID Proof',
      required: false,
      docType: DOC_TYPES?.SIGNATORY_ID,
    },
  ];

  const AlertModal = useModal('AlertModal');
  const closeAlertModal = useCallback(() => {
    AlertModal?.remove();
  }, [AlertModal]);

  const fetchOnboardingData = useCallback(
    async (status: KYCStatus | null) => {
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

        if (res?.success && res?.data) {
          setOnboardingData(res?.data);
          const prefilledDocs = res.data.legalDocs?.length
            ? res.data.legalDocs
            : Array(4)?.fill(null);

          setPrefillData({
            ...res.data,
            legalDocs: prefilledDocs,
          });
          const mappedDocs: Record<string, { upload: string; preview: string }> = {};

          if (res.data.incorporationCertUrl) {
            mappedDocs[DOC_TYPES?.INCORP_CERT] = {
              upload: res?.data?.incorporationCertUrl,
              preview:
                res?.data?.incorporationCertUrlPreview ||
                res?.data?.incorporationCertUrl,
            };
          }
          if (res.data.gstCertUrl) {
            mappedDocs[DOC_TYPES?.GST_CERT] = {
              upload: res?.data?.gstCertUrl,
              preview: res?.data?.gstCertUrlPreview || res?.data?.gstCertUrl,
            };
          }
          if (res?.data?.addressProofUrl) {
            mappedDocs[DOC_TYPES?.ADDRESS_PROOF] = {
              upload: res?.data?.addressProofUrl,
              preview:
                res?.data?.addressProofUrlPreview || res?.data?.addressProofUrl,
            };
          }
          if (res?.data?.signatoryIdUrl) {
            mappedDocs[DOC_TYPES?.SIGNATORY_ID] = {
              upload: res?.data?.signatoryIdUrl,
              preview: res?.data?.signatoryIdUrlPreview || res?.data?.signatoryIdUrl,
            };
          }

          setUploadUrl(mappedDocs);

          if (status === 'Pending') {
            setIsEditable(false);
          } else if (status === 'Rejected' || status === 'Initialised') {
            setIsEditable(true);
          } else if (status === null) {
            setIsEditable(true);
          }
        }
      } catch (error: any) {
        console.error('Error fetching onboarding data:', error);
      } finally {
        dispatch(loader(false));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    (async () => {
      const status = await getOnboardingStatus();
      setPrefilledStatusCheck(status);
      if (
        status === 'Initialised' ||
        status === 'Pending' ||
        status === 'Rejected'
      ) {
        fetchOnboardingData(status);
      }
      if (status === null) {
        setIsEditable(true);
      }
    })();
  }, [getOnboardingStatus, fetchOnboardingData]);

  const uploadSingleDoc = async (
    file: File,
    type: (typeof DOC_TYPES)[keyof typeof DOC_TYPES]
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData?.append('file', file);
      formData?.append('type', type);

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
        const previewFile =
          uploadRes?.data?.previewFile ||
          uploadRes?.data?.uploadFilePreview ||
          uploadedFile;

        if (uploadedFile) {
          setUploadUrl((prev: any) => ({
            ...prev,
            [type]: {
              upload: uploadedFile,
              preview: previewFile,
            },
          }));
          return uploadedFile;
        } else {
          Toast.error('File upload succeeded but no file URL was returned');
          return null;
        }
      } else {
        // Handle API error response
        const errorMessage =
          uploadRes?.error ||
          uploadRes?.message ||
          'Failed to upload file. Please try again.';

        Toast.error(errorMessage);
        return null;
      }
    } catch (error: any) {
      // Handle unexpected errors (network errors, etc.)
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

  const handleSaveandDraft = async (values: any) => {
    try {
      const countryObj = Country.getCountryByCode(values?.country);
      const stateObj = State?.getStateByCodeAndCountry(
        values?.state,
        values?.country
      );
      // Allow today's date as incorporation date
      const incorporationDate = formatDateLocal(values?.inCorporationDate);

      const payload: any = {
        fullName: values?.fullName?.trim(),
        incorporationDate: incorporationDate,
        phoneNo: values?.phoneNumber,
        institutionType: values?.institutionType,
        regtNo: values?.registrationNumber,
        annualTurnover: String(values?.annualTurnOver),
        address: values?.detailedAddress,
        country: countryObj?.name || values?.country,
        state: stateObj?.name || values?.state,
        city: values?.city,
        postalCode: values?.postalCode,
        documents: Object?.keys(uploadUrl)?.reduce((acc: any, key) => {
          acc[key] = uploadUrl[key]?.upload;
          return acc;
        }, {}),
        email: values?.email,
        mode: 'draft',
      };
      const res = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.CREATE_KYB,
        data: payload,
        token: true,
        dispatch,
        showToaster: true,
        showLoader: true,
        showButtonLoader: false,
        buttonKey: 'onboardingbtn',
      });
      if (res?.success) {
        await fetchOnboardingData(res?.data?.status || null);
        setIsEditable(true);
        Toast.success(res?.message);
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

  const handleSaveandProceed = async (values: any, resetForm: () => void) => {
    try {
      const countryObj = Country.getCountryByCode(values?.country);
      const stateObj = State.getStateByCodeAndCountry(
        values?.state,
        values?.country
      );
      const incorporationDate = formatDateLocal(values?.inCorporationDate);

      const payload = {
        fullName: values?.fullName?.trim(),
        incorporationDate: incorporationDate,
        phoneNo: values?.phoneNumber,
        institutionType: values?.institutionType,
        regtNo: values?.registrationNumber,
        annualTurnover: String(values?.annualTurnOver),
        address: values?.detailedAddress,
        country: countryObj?.name || values?.country,
        state: stateObj?.name || values?.state,
        city: values?.city,
        postalCode: values?.postalCode,
        documents: Object.keys(uploadUrl).reduce((acc: any, key) => {
          acc[key] = uploadUrl[key].upload;
          return acc;
        }, {}),
        email: values?.email,
        mode: 'save',
      };
      const res = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.CREATE_KYB,
        token: true,
        data: payload,
        showToaster: true,
        dispatch,
        showLoader: true,
        showButtonLoader: false,
        buttonKey: 'onboardingbtn',
      });
      if (res?.success) {
        resetForm();
        await getOnboardingStatus();
        Toast.success(res?.message);
        navigate('/user/dashboard');
      } else {
        Toast.error(res?.message);
      }
    } catch (error: any) {
      console.error('Error Onboarding:', error);
      Toast.error(error.message);
    } finally {
      dispatch(loader(false));
    }
  };

  return (
    <>
      <section className="completeOnboarding">
        <CommonHeading heading="Complete onboarding" />
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
            dirty,
          }) => (
            <Form onSubmit={handleSubmit}>
              <div className="completeOnboarding_institution">
                <CommonHeading heading="Institutional Information" />
                <Row>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      label="Institution Name"
                      name="fullName"
                      type="text"
                      placeholder="Enter full name"
                      value={values?.fullName}
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
                        touched?.fullName && errors?.fullName ? errors?.fullName : ''
                      }
                      disabled={!isEditable}
                    />
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      label="Email"
                      name="email"
                      type="email"
                      placeholder="xyz123@gmail.com"
                      value={values?.email}
                      required
                      maxLength={100}
                      onChange={(e: any) => {
                        handleChange(e);
                        setFieldTouched('email', true, false);
                      }}
                      onBlur={handleBlur}
                      error={touched?.email && errors?.email ? errors?.email : ''}
                      readOnly={accountType === 'Institutional'}
                      disabled
                    />
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      label="Phone Number"
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
                      disabled={!isEditable}
                      maxLength={13}
                    />
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      label="Date Of Incorporation"
                      control="date"
                      name="inCorporationDate"
                      type="date"
                      value={
                        values?.inCorporationDate
                          ? new Date(Number(values?.inCorporationDate))
                          : null
                      }
                      calendarIcon={<CalendarIcon />}
                      maxDate={(() => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        return today;
                      })()}
                      onChange={(date: Date) => {
                        setFieldValue('inCorporationDate', date);
                      }}
                      onBlur={() => setFieldTouched('inCorporationDate', true, true)}
                      sup
                      error={touched?.inCorporationDate && errors?.inCorporationDate}
                      disabled={!isEditable}
                    />
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      label="Institutional Type"
                      control="select"
                      name="institutionType"
                      className="blockchain_sel"
                      options={institutionalOptions}
                      placeholder="Choose Institutional Type"
                      required
                      value={
                        institutionalOptions?.find(
                          (opt) => opt?.value === values?.institutionType
                        ) || null
                      }
                      onChange={(option: any) =>
                        setFieldValue('institutionType', option?.value || '')
                      }
                      onBlur={() => {
                        setFieldTouched('institutionType', true, true);
                        validateField('institutionType');
                      }}
                      error={
                        touched?.institutionType && errors?.institutionType
                          ? (values?.institutionType?.trim?.()
                              ? ''
                              : errors.institutionType)
                          : ''
                      }
                      disabled={!isEditable}
                    />
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      label="Registration Number"
                      name="registrationNumber"
                      type="text"
                      placeholder="Enter Registration Number"
                      value={values?.registrationNumber}
                      required
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newValue = e.target?.value?.replace(/\s/g, '');
                        setFieldValue('registrationNumber', newValue);
                        setFieldTouched('registrationNumber', true, false);
                        validateField('registrationNumber');
                      }}
                      onBlur={(e: any) => {
                        handleBlur(e);
                        validateField('registrationNumber');
                      }}
                      maxLength={30}
                      error={
                        touched?.registrationNumber && errors?.registrationNumber
                          ? errors?.registrationNumber
                          : ''
                      }
                      disabled={!isEditable}
                    />
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      label="Annual Turn Over (INR)"
                      name="annualTurnOver"
                      type="text"
                      placeholder="Enter annual turn over"
                      value={values?.annualTurnOver}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        let newValue = e.target?.value;
                        newValue = newValue?.replace(/[^0-9.,]/g, '');
                        setFieldValue('annualTurnOver', newValue);
                        setFieldTouched('annualTurnOver', true, false);
                        validateField('annualTurnOver');
                      }}
                      onBlur={(e: any) => {
                        handleBlur(e);
                        validateField('annualTurnOver');
                      }}
                      maxLength={15}
                      required
                      error={
                        touched?.annualTurnOver && errors?.annualTurnOver
                          ? errors?.annualTurnOver
                          : ''
                      }
                      disabled={!isEditable}
                    />
                  </Col>
                </Row>
              </div>
              <div className="completeOnboarding_address">
                <CommonHeading heading="Address Details" />
                <Row>
                  <Col xs={12} sm={6} lg={4}>
                    <FormControl
                      label="Detailed Address"
                      name="detailedAddress"
                      type="text"
                      placeholder="Enter Detailed Address like #53, street..."
                      value={values?.detailedAddress}
                      onChange={(e: any) => {
                        handleChange(e);
                        setFieldTouched('detailedAddress', true, false);
                        validateField('detailedAddress');
                      }}
                      onBlur={(e: any) => {
                        handleBlur(e);
                        validateField('detailedAddress');
                      }}
                      maxLength={300}
                      required
                      error={
                        touched?.detailedAddress && errors?.detailedAddress
                          ? errors?.detailedAddress
                          : ''
                      }
                      disabled={!isEditable}
                    />
                  </Col>
                  <Col xs={12} sm={6} lg={4}>
                    {countries?.length > 0 ? (
                      <FormControl
                        label="Country"
                        control="select"
                        name="country"
                        className="blockchain_sel"
                        options={countries}
                        value={countries?.find(
                          (c) => c.value === values?.country
                        ) || null}
                        placeholder="Select a Country"
                        required
                        onBlur={() => {
                          setFieldTouched('country', true, true);
                          validateField('country');
                        }}
                        error={
                          touched?.country && errors?.country
                            ? (values?.country?.trim?.() ? '' : errors?.country)
                            : ''
                        }
                        disabled
                      />
                    ) : (
                      <FormControl
                        label="Country"
                        control="input"
                        type="text"
                        name="country"
                        className="blockchain_inp"
                        value={values?.country}
                        placeholder="Enter Country"
                        required
                        onBlur={() => {
                          setFieldTouched('country', true, true);
                          validateField('country');
                        }}
                        error={
                          touched?.country && errors?.country
                            ? (values?.country?.trim?.() ? '' : errors?.country)
                            : ''
                        }
                        disabled
                        readOnly
                      />
                    )}
                  </Col>
                  <Col xs={12} sm={6} lg={4}>
                    {values?.country && getStates(values?.country)?.length > 0 ? (
                      <FormControl
                        label="State"
                        control="select"
                        name="state"
                        className="blockchain_sel"
                        options={values?.country ? getStates(values?.country) : []}
                        value={
                          values?.state != null && String(values?.state).trim() !== ''
                            ? getStates(values?.country)?.find(
                                (s) => String(s?.value) === String(values?.state)
                              ) ?? null
                            : null
                        }
                        noOptionsMessage={() => 'Please select your country first.'}
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
                          touched?.state && errors?.state ? errors?.state : undefined
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
                        value={values?.state}
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
                        error={
                          touched?.state && errors?.state
                            ? (values?.state != null && String(values?.state).trim() !== ''
                                ? ''
                                : errors?.state)
                            : ''
                        }
                        disabled={!isEditable}
                      />
                    )}
                  </Col>
                  <Col xs={12} sm={6} lg={4}>
                    {values?.country &&
                    values?.state &&
                    getCities(values?.country, values?.state)?.length > 0 ? (
                      <FormControl
                        label="City"
                        control="select"
                        name="city"
                        className="blockchain_sel"
                        options={
                          values?.country && values?.state
                            ? getCities(values?.country, values?.state)
                            : []
                        }
                        noOptionsMessage={() => 'Please select your state first.'}
                        value={
                          values?.country && values?.state
                            ? getCities(values?.country, values?.state)?.find(
                                (c) => String(c?.value) === String(values?.city)
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
                        error={
                          touched?.city && errors?.city
                            ? (values?.city?.trim?.() ? '' : errors?.city)
                            : ''
                        }
                        disabled={!isEditable}
                      />
                    ) : (
                      <FormControl
                        label="City"
                        control="input"
                        type="text"
                        name="city"
                        className="blockchain_inp"
                        value={values?.city}
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
                        error={
                          touched?.city && errors?.city
                            ? (values?.city?.trim?.() ? '' : errors?.city)
                            : ''
                        }
                        disabled={!isEditable}
                      />
                    )}
                  </Col>
                  <Col xs={12} sm={6} lg={4}>
                    <FormControl
                      label="Postal Code"
                      name="postalCode"
                      type="text"
                      placeholder="Enter postal code like 125 354"
                      maxLength={10}
                      value={values.postalCode}
                      onChange={(e: any) => {
                        handleChange(e);
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
                      restrictNumberInput
                      disabled={!isEditable}
                    />
                  </Col>
                </Row>
              </div>
              <div className="completeOnboarding_doc">
                <CommonHeading heading="Legal Documents" />
                <Row>
                  {legalDoc?.map((item, index) => {
                    const preview = prefilledStatusCheck == 'Pending';
                    if (preview && typeof values?.legalDocs[index] !== 'string')
                      return <></>;
                    return (
                      <Col
                        key={index}
                        lg={3}
                        md={4}
                        sm={6}
                        className="mb-4 mb-lg-0"
                        onClick={() => {
                          setFieldTouched(`legalDocs.${index}`, true, true);
                          validateField(`legalDocs`);
                        }}
                      >
                        <UploadDocCard
                          label={item.label}
                          docType={item?.docType}
                          required={item.required}
                          name={`legalDocs.${index}`}
                          value={values?.legalDocs[index]}
                          setFieldValue={async (
                            field: string,
                            file: File | null
                          ) => {
                            if (file && file instanceof File) {
                              setFieldValue(field, file);
                              try {
                                const uploadedDoc = await uploadSingleDoc(
                                  file,
                                  item?.docType
                                );
                                if (uploadedDoc) {
                                  setFieldValue(field, uploadedDoc);
                                } else {
                                  // Clear the field if upload failed
                                  setFieldValue(field, null);
                                }
                              } catch (err) {
                                // Clear the field on unexpected error
                                setFieldValue(field, null);
                                console.error('Error in file upload:', err);
                              }
                            } else {
                              setFieldValue(field, file);
                            }
                          }}
                          prefilledUrl={
                            uploadUrl?.[item.docType]?.preview ||
                            (item.docType === DOC_TYPES?.INCORP_CERT
                              ? prefillData?.incorporationCertUrlPreview
                              : item.docType === DOC_TYPES?.GST_CERT
                                ? prefillData?.gstCertUrlPreview
                                : item.docType === DOC_TYPES?.ADDRESS_PROOF
                                  ? prefillData?.addressProofUrlPreview
                                  : item.docType === DOC_TYPES?.SIGNATORY_ID
                                    ? prefillData?.signatoryIdUrlPreview
                                    : undefined)
                          }
                          prefilledStatusCheck={prefilledStatusCheck}
                          setUploadUrl={setUploadUrl}
                        />
                      </Col>
                    );
                  })}
                  {touched?.legalDocs && (errors?.legalDocs ?? [])?.length > 0 && (
                    <div className="error_text">
                      {(Array?.isArray(errors?.legalDocs)
                        ? errors?.legalDocs[0]
                        : typeof errors?.legalDocs === 'string'
                          ? errors?.legalDocs
                          : 'Something happend'
                      )?.toString()}
                    </div>
                  )}
                </Row>
              </div>
              <div className="completeOnboarding_actionbtn">
                <Row>
                  <Col xs={12} sm={6} lg={3} className="mb-4 mb-sm-0">
                    <CommonButton
                      title="Save as Draft"
                      type="button"
                      fluid
                      disabled={!dirty || !isEditable}
                      onClick={() => handleSaveandDraft(values)}
                    />
                  </Col>
                  <Col xs={12} sm={6} lg={3}>
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
          )}
        </Formik>
      </section>
    </>
  );
};

export default CompleteKybOnboarding;
