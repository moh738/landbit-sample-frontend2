import NiceModal, { useModal } from '@ebay/nice-modal-react';
import CommonButton from '../../ui/commonButton/CommonButton';
import CommonModal from '../CommonModal';
import * as Yup from 'yup';
import { ReactNode, useCallback,  useState } from 'react';
import { Form, Formik } from 'formik';
import { Col, Row } from 'react-bootstrap';
import FormControl from '../../formik/FormControl';
import './TransactionDetailModal.scss';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import Toast from '../../common/Toast';
import { loader } from '../../../redux/Slices/loader.slice';
import { useDispatch, useSelector } from 'react-redux';
import UploadDocCard from '../../ui/uploadDocCard/UploadDocCard';
import { useGetAmount } from '../../../hooks/userGetAmount';
import useCopyClipboard from '../../../hooks/useCopyToClipboard';
import { CopyIcon } from '../../../assets/icons/SvgIcon';

const TransactionDetailModal = NiceModal.create(
  ({
    closeTransactionDetailModal,
    icon,
    heading,
    subheading,
    list,
    listheading,
    amount,
    selectedPaymentMethod,
    onTransactionSuccess,
  }: {
    closeTransactionDetailModal: () => void;
    icon: ReactNode;
    heading: string;
    subheading: string;
    list: any;
    listheading: string;
    amount: string;
    selectedPaymentMethod?: 'Bank' | 'UPI' | null;
    onTransactionSuccess?: () => void;
  }) => {
    const CongratulationsModal = useModal('CongratulationsModal');
    const dispatch = useDispatch();
    const {  fullName } = useSelector(
      (state: RootState) => state?.user?.profile
    );
    const closeCongratulationsModal = useCallback(() => {
      CongratulationsModal.remove();
    }, [CongratulationsModal]);
    const [uploadedDocs, setUploadedDocs] = useState<
      Record<string, { upload: string; preview: string }>
    >({});
    
    const initialValues = {
      id: '',
      nickName: fullName,
      paymentProof: null as File | null,
    };

    const DOC_TYPES = {
      paymentProof: 'paymentProof',
    } as const;

    const { fetchAmount } = useGetAmount();
    const [copyToClipboard] = useCopyClipboard();

    const loadBankAmount = useCallback(async () => {
      try {
        const res = await fetchAmount();
        if (res?.success && res?.data) {
        }
      } catch (error) {
        console.error('Error preloading bank details:', error);
      }
    }, [fetchAmount]);

    const validationSchema = Yup.object().shape({
      id: Yup.string()
        .required('Transaction id is required')
        .matches(
          /^[a-zA-Z0-9.-]{8,30}$/,
          'Enter a valid transaction ID (8–30 chars, letters/numbers only).'
        ),

      nickName: Yup.string(),
        // .required('User name is required'),
        // .trim()
        // .matches(
        //   /^[A-Za-z]+(?: [A-Za-z]+)*$/,
        //   'Enter your User name (2–100 letters) with single spaces only.'
        // )
        // .min(2, 'User Name must be at least 2 letters')
        // .max(100, 'User Name must be 100 characters or less'),
      paymentProof: Yup.mixed().required('Payment proof is required'),
    });

    const uploadSingleDoc = async (
      file: File,
      type: keyof typeof DOC_TYPES
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
          const uploadedFile = uploadRes?.data?.uploadFile;
          const previewFile = uploadRes?.data?.previewFile || uploadedFile;

          setUploadedDocs((prev) => ({
            ...prev,
            [type]: { upload: uploadedFile, preview: previewFile },
          }));

          Toast.success(uploadRes?.message);
          return uploadedFile;
        } else {
          Toast.error(uploadRes?.message );
          return null;
        }
      } catch (err: any) {
        console.error('Upload error:', err);
        Toast.error(err?.message || 'Something went wrong during upload');
        return null;
      }
    };

    const onSubmit = async (
      values: any,
      { resetForm }: { resetForm: () => void }
    ) => {
      try {
        const payload = {
          amount: Number(amount),
          userTrxId: values?.id,
          paymentGateway: 'Manual',
          nickName: values?.nickName,
          paymentThrough: selectedPaymentMethod,
          trxUrl: uploadedDocs[DOC_TYPES?.paymentProof]?.upload,
        };

        const res = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.DEPOSIT_AMOUNT,
          data: payload,
          showToaster: false,
          dispatch,
          showLoader: true,
          showButtonLoader: true,
          buttonKey: 'transactionDetail',
          token: true,
        });

        if (res?.success) {
          Toast.success(res?.message);
          await loadBankAmount();
          resetForm();
          closeTransactionDetailModal();
          onTransactionSuccess?.();
          CongratulationsModal.show({
            title: 'Request Submitted Successfully!',
            description:
              'Your transaction will take 3 to 5 working days to be approved. Thank you for your patience.',
            btntitle: 'Done',
            closeCongratulationsModal,
          });
        } else {
          Toast.error(res?.message);
        }
      } catch (err: any) {
        console.error('Error submitting transaction detail:', err);
        Toast.error(err.message);
      } finally {
        dispatch(loader(false));
      }
    };

    return (
      <CommonModal
        className="transactionDetailModal"
        show
        onHide={closeTransactionDetailModal}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          enableReinitialize
        >
          {({
            handleSubmit,
            values,
            handleChange,
            handleBlur,
            touched,
            errors,
            setFieldValue,
            setFieldTouched,
          }) => (
            <Form onSubmit={handleSubmit}>
              <div className="detail_inner">
                <h4>Deposit Details</h4>
                {heading && (
                  <div className="heading">
                    <span className="iconbg">{icon}</span>
                    <h4>{heading}</h4>
                    <p>{subheading}</p>
                  </div>
                )}
                <ul>
                  <p>{listheading}</p>
                  {list?.map((item: any, index: any) => {
                    const itemNameLower = item.name?.toLowerCase() || '';
                    const shouldShowCopyButton = 
                      (selectedPaymentMethod === 'UPI' && (itemNameLower?.includes('upi') || itemNameLower?.includes('upi id'))) ||
                      (selectedPaymentMethod === 'Bank' && (itemNameLower?.includes('acc. number') || itemNameLower?.includes('account number') || itemNameLower?.includes('ifsc')));
                    
                    return (
                      <li key={index}>
                        <h6>{item.name}</h6>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span
                            className={item.className || ''}
                            onClick={item.onClick || null}
                          >
                            {item.info}
                          </span>
                          {shouldShowCopyButton && item?.info && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item?.info)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.4rem',
                                flexShrink: 0,
                              }}
                              title="Copy to clipboard"
                            >
                              <CopyIcon />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Row>
                  <Col sm={12} className="mb-4">
                    <FormControl
                      type="text"
                      name="id"
                      label="Transaction ID"
                      placeholder="Enter ID"
                      value={values.id}
                      onChange={(e: any) => {
                        const newValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                        handleChange({
                          target: { name: 'id', value: newValue },
                        });
                        setFieldTouched('id', true, true);
                      }}
                      maxLength={30}
                      onBlur={handleBlur}
                      error={touched?.id && errors?.id ? errors?.id : ''}
                      required
                    />
                  </Col>
                  <Col sm={12} className="mb-4">
                    <FormControl
                      type="text"
                      name="nickName"
                      label="User Name"
                      placeholder="Enter User Name"
                      value={values.nickName}
                      onChange={(e: any) => {
                        handleChange(e);
                        setFieldTouched('nickName', true, false);
                      }}
                      maxLength={100}
                      onBlur={handleBlur}
                      error={
                        touched?.nickName && errors?.nickName ? errors?.nickName : ''
                      }
                      disabled
                      required
                    />
                  </Col>
                  <Col lg={6}>
                    <UploadDocCard
                      label="Upload Payment Proof"
                      name="paymentProof"
                      value={values.paymentProof}
                      prefilledUrl={uploadedDocs?.paymentProof?.preview || ''}
                      setFieldValue={async (field: string, file: File | null) => {
                        if (file) {
                          setFieldValue(field, file);
                          const uploadedFile = await uploadSingleDoc(
                            file,
                            'paymentProof'
                          );
                          if (uploadedFile) {
                            setUploadedDocs((prev) => ({
                              ...prev,
                              paymentProof: {
                                upload: uploadedFile,
                                preview: uploadedFile,
                              },
                            }));
                          }
                        } else {
                          setFieldValue(field, null);
                          setUploadedDocs((prev) => ({
                            ...prev,
                            paymentProof: { upload: '', preview: '' },
                          }));
                        }
                      }}
                      setUploadUrl={(url: any) => {
                        setUploadedDocs((prev) => ({
                          ...prev,
                          paymentProof: { upload: url, preview: url },
                        }));
                      }}
                      docType="paymentProof"
                      required
                    />

                    {touched?.paymentProof && errors?.paymentProof && (
                      <div className="error_text">{errors?.paymentProof}</div>
                    )}
                  </Col>
                  <div className="btns">
                    <Col lg={6}>
                      <CommonButton
                        fluid
                        title="Cancel"
                        className="btn-secondry"
                        onClick={() => {
                          closeTransactionDetailModal();
                        }}
                      />
                    </Col>
                    <Col lg={6}>
                      <CommonButton title="Submit Request" type="submit" fluid />
                    </Col>
                  </div>
                </Row>
              </div>
            </Form>
          )}
        </Formik>
      </CommonModal>
    );
  }
);
export default TransactionDetailModal;
