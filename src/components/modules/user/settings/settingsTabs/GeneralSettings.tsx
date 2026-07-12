import { Form, Formik } from 'formik';
import FormControl from '../../../../formik/FormControl';
import * as Yup from 'yup';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import { Col, Row } from 'react-bootstrap';
import { CalendarIcon } from '../../../../../assets/icons/SvgIcon';
import UploadDocCard from '../../../../ui/uploadDocCard/UploadDocCard';
import { useCallback, useEffect, useState } from 'react';
import { callPostMethod } from '../../../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../../../services/api.service';
import { API_ENDPOINTS } from '../../../../../constants/apis/apiEndpoints';
import { useDispatch, useSelector } from 'react-redux';
import Toast from '../../../../common/Toast';
import { nameField } from '../../../../onBoarding/signUp/validationSchema';
import { useBankDetails } from '../../../../../hooks/useBankDetail';
import { PanCardDetail } from '../../../../../interfaces/bankDetail/bankDetail';
import { useGetImageUrl } from '../../../../../hooks/useGetImageUrl';
import { useKybOnboarding } from '../../../../../hooks/authenticationHooks/useKybOnboarding';
import { setShouldRefreshPanCard } from '../../../../../redux/Slices/wallet.slice';

const parseDateOnly = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = parseInt(y!, 10);
  const month = parseInt(m!, 10) - 1;
  const day = parseInt(d!, 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
};
const formatDateOnlyForApi = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const GeneralSettings = () => {
  const today = new Date();
  const minAgeDate = new Date();
  minAgeDate.setFullYear(today.getFullYear() - 18);

  const dispatch = useDispatch();
  const { fetchBankingDetails } = useBankDetails();
  const { fetchOnboardingData } = useKybOnboarding();
  const { fetchImageUrl } = useGetImageUrl();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, { upload: string; preview: string }>
  >({});
  const [panCardDetail, setPanCardDetail] = useState<PanCardDetail>({});
  const [kybData, setKybData] = useState<any>(null);
  const [isEditable, setIsEditable] = useState<boolean>(true);
  const [panStatus, setPanStatus] = useState<
    'pending' | 'complete' | 'rejected' | null
  >(null);
  const { accountType } = useSelector((state: RootState) => state?.user?.profile);

  const { panCardStatus, shouldRefreshPanCard } = useSelector(
    (state: RootState) => state?.wallet
  );

  const loadPanDetails = useCallback(async () => {
    try {
      const res = await fetchBankingDetails(false);
      if (!res?.success || !res?.data) {
        setPanCardDetail({});
        setIsEditable(true);
        setPanStatus(null);
        return;
      }

      setPanCardDetail(res?.data?.approvedWallet);
      const status = res.data?.approvedWallet?.panStatus?.toLowerCase();
      
      setPanStatus(status);

      if (status === 'complete' || status === 'pending') {
        setIsEditable(false);
      } else {
        setIsEditable(true);
      }

      const panUrl = res?.data?.approvedWallet?.panUrl;
      if (panUrl) {
        const imageRes = await fetchImageUrl({
          path: panUrl,
        });
        const sasUrl =
          imageRes?.success && imageRes?.data?.sasUrl ? imageRes.data.sasUrl : null;
        if (sasUrl) {
          setPreviewUrl(sasUrl);
        }
      }
    } catch (error) {
      console.error('Error loading PAN details:', error);
      setIsEditable(true);
    }
  }, [fetchBankingDetails, fetchImageUrl]);

  useEffect(() => {
    loadPanDetails();
  }, [loadPanDetails]);

  useEffect(() => {
    if (shouldRefreshPanCard && panCardStatus) {
      loadPanDetails();
      dispatch(setShouldRefreshPanCard(false));
    }
  }, [shouldRefreshPanCard, panCardStatus, loadPanDetails, dispatch]);

  const initialValues = {
    panCardNumber: panCardDetail?.panNo || '',
    fullName:
      accountType === 'Institutional'
        ? kybData?.fullName || panCardDetail?.fullName || ''
        : panCardDetail?.fullName || '',
    dateOfBirth:
      accountType === 'Institutional'
        ? kybData?.incorporationDate
          ? parseDateOnly(kybData?.incorporationDate) ?? new Date(kybData.incorporationDate)
          : null
        : parseDateOnly(panCardDetail?.dateOfBirth) ?? (panCardDetail?.dateOfBirth ? new Date(panCardDetail.dateOfBirth) : null),
    panCard: panCardDetail?.panUrl || null,
  };

  const DOC_TYPES = { panCard: 'panCard' } as const;

  const validationSchema = Yup.object({
    panCardNumber: Yup.string()
      .required('PAN Card Number is required')
      .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Card Number'),
    fullName: accountType === 'Institutional' ? Yup.mixed().nullable() : nameField,
    dateOfBirth:
      accountType === 'Institutional'
        ? Yup.mixed().nullable()
        : Yup.date()
            .required('Date of Birth is required')
            .max(minAgeDate, 'You must be at least 18 years old')
            .typeError('Invalid Date of Birth'),
    panCard: Yup.mixed().required('PanCard is required'),
  });

  const uploadSingleDoc = async (file: File, type: keyof typeof DOC_TYPES) => {
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

      if (!uploadRes?.success) {
        Toast.error(uploadRes?.message || 'Failed to upload document.');
        return null;
      }
      Toast.success(uploadRes?.message);
      const uploadedFile = uploadRes?.data?.uploadFile;
      const imageRes = await fetchImageUrl({ path: uploadedFile });
      const sasUrl =
        imageRes?.success && imageRes?.data?.sasUrl ? imageRes.data.sasUrl : '';

      setPreviewUrl(sasUrl);
      setUploadedDocs(() => ({
        [type]: { upload: uploadedFile, preview: sasUrl },
      }));

      return uploadedFile;
    } catch (error: any) {
      console.error('Upload error:', error);
      Toast.error(error?.message);
      return null;
    }
  };

  const onSubmit = async (values: any, { resetForm }: any) => {
    try {
      const dateOfBirth =
        values?.dateOfBirth instanceof Date
          ? formatDateOnlyForApi(values.dateOfBirth)
          : typeof values?.dateOfBirth === 'string'
            ? values.dateOfBirth
            : formatDateOnlyForApi(values?.dateOfBirth);

      const uploadedFile =
        values.panCard instanceof File
          ? await uploadSingleDoc(values.panCard, 'panCard')
          : uploadedDocs?.panCard?.upload || values.panCard || '';

      if (!uploadedFile) {
        Toast.error('Please upload your PAN card before submitting.');
        return;
      }

      const payload = {
        panNo: values.panCardNumber,
        fullName: values.fullName,
        dateOfBirth,
        panUrl: uploadedFile,
      };

      const res = await callPostMethod({
        apiUrl: landbitBackendUrl,
        endpoint: API_ENDPOINTS.POST.PAN_CARD,
        data: payload,
        dispatch,
        showToaster: false,
        showLoader: true,
        showButtonLoader: false,
        token: true,
      });

      if (res?.success) {
        Toast.success(res.message);
        resetForm();
        loadPanDetails();
      } else {
        Toast.error(res?.message);
      }
    } catch (error) {
      console.error(error);
      Toast.error('Failed to save settings');
    }
  };

  useEffect(() => {
    if (accountType === 'Institutional') {
      (async () => {
        try {
          const res = await fetchOnboardingData();
          setKybData(res?.data || null);
        } catch (error) {
          console.error('Error fetching KYB data:', error);
        }
      })();
    }
  }, [accountType, fetchOnboardingData]);

  return (
    <section className="generalsettings">
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={validationSchema}
        validateOnChange={true}
        validateOnBlur={true}
        validateOnMount={false}
        onSubmit={onSubmit}
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
        }) => {
          const isButtonDisabled =
            !isEditable ||
            !values.panCardNumber ||
            !values.fullName ||
            !values.dateOfBirth ||
            !values.panCard ||
            panStatus === 'pending';

          return (
            <Form onSubmit={handleSubmit}>
              <div className="generalsettings_pancard mb-5">
                <h4>PAN Card Details</h4>
                {panStatus && (
                  <div
                    className={`pan-status-message ${
                      panStatus === 'rejected'
                        ? 'rejected'
                        : panStatus === 'pending'
                          ? 'pending'
                          : 'complete'
                    }`}
                  >
                    {panStatus === 'rejected' && (
                      <div className="status-row">
                        <span className="status-icon">⚠️</span>
                        <h6 className="status-heading">PAN Card Rejected</h6>
                      </div>
                    )}

                    {panStatus === 'pending' && (
                      <span className="status-icon">ℹ️</span>
                    )}
                    {panStatus === 'complete' && (
                      <span className="status-icon">✅</span>
                    )}
                    <div className="status-content">
                      <p className="status-text">
                        {panStatus === 'rejected'
                          ? 'PAN verification failed. Please re-check and upload  valid PAN card details.'
                          : panStatus === 'pending'
                            ? 'Your PAN has been submitted and is under verification.'
                            : 'Your PAN has been verified successfully.'}
                      </p>
                      {/* {panStatus === 'rejected' && panCardDetail?.reason && (
                        // <div className="rejection-reason">
                        //   <strong>Rejection Reason:</strong>
                        //   <p className="reason-text">{panCardDetail.reason}</p>
                        // </div>
                      )} */}
                    </div>
                  </div>
                )}

                <Row>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      label="PAN Card Number"
                      name="panCardNumber"
                      type="text"
                      placeholder="Enter PAN Card Number"
                      value={values.panCardNumber}
                      disabled={!isEditable}
                      onChange={(e: any) => {
                        const filtered = e.target?.value?.replace(
                          /[^A-Za-z0-9]/g,
                          ''
                        );
                        setFieldValue('panCardNumber', filtered.toUpperCase());
                        setFieldTouched('panCardNumber', true, true);
                      }}
                      onBlur={handleBlur}
                      autoComplete="off"
                      maxLength={10}
                      error={
                        (touched?.panCardNumber ||
                          (values?.panCardNumber?.length ?? 0) > 0) &&
                        errors?.panCardNumber
                          ? String(errors.panCardNumber)
                          : ''
                      }
                      required
                    />
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      // label="Full Name"
                      label={
                        accountType === 'Institutional'
                          ? 'Institution Name'
                          : 'Full Name'
                      }
                      name="fullName"
                      type="text"
                      placeholder="Enter Full Name"
                      value={values.fullName}
                      maxLength={20}
                      onChange={handleChange}
                      autoComplete="off"
                      onBlur={handleBlur}
                      error={touched?.fullName && errors?.fullName}
                      required
                      disabled={accountType === 'Institutional' ? true : !isEditable}
                    />
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <FormControl
                      label={
                        accountType === 'Institutional'
                          ? 'Date of Incorporation'
                          : 'Date of Birth'
                      }
                      control="date"
                      name="dateOfBirth"
                      sup
                      type="date"
                      value={
                        values?.dateOfBirth
                          ? values.dateOfBirth instanceof Date
                            ? values.dateOfBirth
                            : parseDateOnly(String(values.dateOfBirth)) ?? new Date(values.dateOfBirth)
                          : null
                      }
                      onChange={(date: Date) => setFieldValue('dateOfBirth', date)}
                      onBlur={() => setFieldTouched('dateOfBirth', true, true)}
                      error={touched?.dateOfBirth && errors?.dateOfBirth}
                      calendarIcon={<CalendarIcon />}
                      autoComplete="off"
                      maxDate={
                        new Date(new Date().setDate(new Date().getDate() - 1))
                      }
                      openToDate={
                        new Date(
                          new Date().getFullYear() - 18,
                          new Date().getMonth(),
                          new Date().getDate()
                        )
                      }
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      placeholderText="Select Date of Birth"
                      disabled={accountType === 'Institutional' ? true : !isEditable}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={12} sm={6} md={4} lg={3}>
                    <UploadDocCard
                      label="Upload PAN Card Copy"
                      name="panCard"
                      value={values.panCard}
                      prefilledUrl={previewUrl || ''}
                      readOnly={!isEditable}
                      disabled={!isEditable}
                      setFieldValue={async (field: string, file: File | null) => {
                        setFieldTouched(field, true);
                        if (file) {
                          setFieldValue(field, file);
                          const uploadedFile = await uploadSingleDoc(
                            file,
                            'panCard'
                          );
                          if (uploadedFile) {
                            const imageRes = await fetchImageUrl({
                              path: uploadedFile,
                            });
                            const sasUrl =
                              imageRes?.success && imageRes?.data?.sasUrl
                                ? imageRes.data.sasUrl
                                : '';
                            if (
                              sasUrl &&
                              typeof sasUrl === 'string' &&
                              sasUrl.trim() !== ''
                            ) {
                              setPreviewUrl(sasUrl);
                              setUploadedDocs(() => ({
                                panCard: { upload: uploadedFile, preview: sasUrl },
                              }));
                            } else {
                              console.warn(
                                '⚠️ No valid SAS URL found. Skipping preview update.'
                              );
                            }
                            setFieldValue(field, uploadedFile);
                          }
                        } else {
                          setFieldValue(field, null);
                          setPreviewUrl('');
                          setUploadedDocs(() => ({
                            panCard: { upload: '', preview: '' },
                          }));
                        }
                      }}
                      setUploadUrl={(url: any) => {
                        setPreviewUrl(url);
                        setUploadedDocs(() => ({
                          panCard: { upload: url, preview: url },
                        }));
                      }}
                      docType="panCard"
                      required
                      prefilledStatusCheck={panStatus}
                    />

                    {touched?.panCard && errors.panCard && (
                      <div className="error_text">{errors.panCard}</div>
                    )}
                  </Col>
                </Row>
              </div>

              <div className="generalsettings_actionbtn">
                <Row>
                  <Col xs={12} sm={6} md={4}>
                    <CommonButton
                      title="Upload Pan Card"
                      type="submit"
                      fluid
                      disabled={isButtonDisabled || !isEditable}
                    />
                  </Col>
                </Row>
              </div>
            </Form>
          );
        }}
      </Formik>
    </section>
  );
};

export default GeneralSettings;
