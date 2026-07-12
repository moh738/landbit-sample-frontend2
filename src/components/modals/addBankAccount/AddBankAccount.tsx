import NiceModal, { useModal } from '@ebay/nice-modal-react';
import CommonButton from '../../ui/commonButton/CommonButton';
import CommonModal from '../CommonModal';
import { useCallback, useEffect, useState } from 'react';
import { Form, Formik } from 'formik';
import { Col, Row } from 'react-bootstrap';
import FormControl from '../../formik/FormControl';
import './AddBankAccount.scss';
import * as Yup from 'yup';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { useDispatch, useSelector } from 'react-redux';
import Toast from '../../common/Toast';
import { loader } from '../../../redux/Slices/loader.slice';
import banksData from '../../../assets/json/banks.json';
import { useBankDetails } from '../../../hooks/useBankDetail';
import {
  AddUpiProps,
  BankDetail,
  FormValues,
} from '../../../interfaces/bankDetail/bankDetail';
import { socketService } from '../../../services/socket.service';
import { BANK_STATUS_SOCKET } from '../../../constants/sockets/socketNames';
import store from '../../../redux/Store';

const AddBankAccount = NiceModal.create(
  ({ closeAddBankAccount, onSuccess }: AddUpiProps) => {
    const CongratulationsModal = useModal('CongratulationsModal');
    const closeCongratulationsModal = useCallback(() => {
      CongratulationsModal.remove();
    }, [CongratulationsModal]);

    const [bankDetail, setbankDetail] = useState<BankDetail>({});
    const { fullName } = useSelector((state: RootState) => state?.user?.profile);
    
    const { fetchBankingDetails } = useBankDetails();
    const [originalAccountNumber, setOriginalAccountNumber] = useState('');
    const dispatch = useDispatch();

    const loadBankDetails = useCallback(async () => {
      try {
        const res = await fetchBankingDetails(true);
        if (res?.success && res?.data?.approvedWallet) {
          setbankDetail(res?.data?.approvedWallet);
          setOriginalAccountNumber(res.data?.approvedWallet?.accountNumber || '');
        }
      } catch (error) {
        // console.error('Error preloading bank details:', error);
      }
    }, [fetchBankingDetails]);

    useEffect(() => {
      loadBankDetails();
    }, [loadBankDetails]);

    const initialValues: FormValues = {
      bank: bankDetail?.bankName
        ? banksData?.banks
            ?.flatMap((group) => group?.content)
            ?.find((b) => b.name === bankDetail?.bankName) || null
        : null,
      name:fullName || '',
      accountnumber: bankDetail?.accountNumber || '',
      confirmAccountNumber: bankDetail?.accountNumber || '',
      code: bankDetail?.ifscCode || '',
      branch: bankDetail?.branch || '',
    };

    const validationSchema = Yup.object().shape({
      bank: Yup.object().nullable().required('Bank is required'),
      name: Yup.string()
        .required('Holder name is required')
        .trim()
        .matches(
          /^(?!.* {2,})([A-Za-z]+(?: [A-Za-z]+){0,3})$/,
          'Enter your holder name (2–100 letters) with 3 spaces only.'
        )
        .test(
          'len',
          'Holder name must be between 2 and 100 characters',
          (val) => !!val && val.length >= 2 && val.length <= 100
        ),
      accountnumber: Yup.string()
        .required('Bank account number is required')
        .matches(/^[0-9]{9,18}$/, 'Account number must be 9–18 digits'),
      confirmAccountNumber: Yup.string()
        .required('Please confirm bank account number')
        .oneOf([Yup.ref('accountnumber')], 'Account numbers must match'),
      code: Yup.string()
        .required('IFSC code is required')
        .test(
          'ifsc-length',
          'IFSC code must be exactly 11 characters',
          (value) => value?.length === 11
        )
        .test(
          'ifsc-5th-digit',
          'The 5th character of IFSC code must be 0',
          (value) => value?.[4] === '0'
        )
        .matches(/^[A-Z0-9]+$/, 'IFSC code can contain only letters and numbers'),
    });

    const onSubmit = async (
      values: any,
      { resetForm }: { resetForm: () => void }
    ) => {
      try {
        const payload = {
          bankName: values?.bank?.name,
          bankIcon: values?.bank?.icon,
          holderName: values?.name,
          ifscCode: values?.code,
          accountNumber: values?.accountnumber,
          upiId: '',
        };

        const res = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.CREATE_WALLET,
          data: payload,
          showToaster: false,
          dispatch,
          showLoader: true,
          showButtonLoader: false,
          buttonKey: 'bankAccbn',
          token: true,
        });

        if (res?.success) {
          if (onSuccess) await onSuccess();
          resetForm();
          loadBankDetails();
          closeAddBankAccount();
          const userId = store.getState().user?.profile?.userId;
          if (userId && socketService?.isConnected()) {
            socketService?.emit(BANK_STATUS_SOCKET, { userId });
          }

          CongratulationsModal.show({
            description: (
              <>
                Your bank account details have been submitted successfully. Your
                request will be reviewed and approved within 3 to 5 working days.
                Thank you for your patience.
                <br />
              </>
            ),
            btntitle: 'Done',
            closeCongratulationsModal,
          });
        } else {
          Toast.error(res?.message || 'Failed to add bank account.');
        }
      } catch (err: any) {
        console.error('Error adding bank account:', err);
        Toast.error(err.message || 'An error occurred during sign up.');
      } finally {
        dispatch(loader(false));
      }
    };

    const bankOptions = banksData?.banks
      ?.map((banks) => {
        return banks?.content?.map((bank) => {
          return {
            value: bank,
            label: (
              <div className="flex items-center gap-2">
                <img
                  src={bank?.icon}
                  alt={bank?.name}
                  width={24}
                  height={24}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {bank?.name}
                </span>
              </div>
            ),
            searchLabel: bank?.name?.toLowerCase(),
          };
        });
      })
      ?.flat()
      ?.sort((a, b) => a.value?.name?.localeCompare(b.value?.name));

    return (
      <CommonModal
        className="addBankAccount"
        heading={
          bankDetail?.accountNumber ? 'Edit Bank Account' : 'Add Bank Account'
        }
        show
        onHide={closeAddBankAccount}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={onSubmit}
          validateOnBlur={true}
          validateOnChange={true}
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
            isValid,
          }) => {
            const isFormChanged =
              values?.name !== initialValues.name ||
              values?.accountnumber !== initialValues.accountnumber ||
              values?.code !== initialValues.code ||
              values?.bank?.name !== initialValues.bank?.name;
            return (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col sm={12}>
                    <FormControl
                      label="Select Bank"
                      control="select"
                      name="bank"
                      className="blockchain_sel"
                      options={bankOptions}
                      value={
                        values?.bank
                          ? {
                              value: values?.bank,
                              label: (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={values?.bank?.icon}
                                    alt={values?.bank?.name}
                                    width={24}
                                    height={24}
                                    style={{ marginRight: '8px' }}
                                  />
                                  <span
                                    style={{ fontSize: '14px', fontWeight: 500 }}
                                  >
                                    {values?.bank?.name}
                                  </span>
                                </div>
                              ),
                            }
                          : null
                      }
                      onChange={(option: any) => {
                        setFieldValue('bank', option?.value || null);
                        setFieldValue('code', option?.value?.ifsc || '');
                      }}
                      placeholder="Search by bank name or IFSC code"
                      required
                      onBlur={() => setFieldTouched('bank', true, true)}
                      error={
                        touched?.bank && errors?.bank
                          ? (values?.bank ? '' : errors?.bank)
                          : ''
                      }
                      isSearchable
                      filterOption={(option: any, inputValue: string) => {
                        const searchValue = inputValue?.toLowerCase().trim();
                        const bankName =
                          option?.data?.value?.name?.toLowerCase() || '';
                        const ifsc = option?.data?.value?.ifsc?.toLowerCase() || '';

                        return (
                          bankName?.includes(searchValue) ||
                          ifsc?.includes(searchValue)
                        );
                      }}
                    />
                  </Col>

                  <Col sm={12}>
                    <FormControl
                      type="text"
                      name="name"
                      label="Bank Holder Name"
                      placeholder="Bank Holder Name"
                      value={values?.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleChange(e);
                        setFieldTouched('name', true, false);
                      }}
                      disabled
                      readOnly={true}
                      maxLength={40}
                      onBlur={handleBlur}
                      error={
                        touched?.name && errors?.name ? String(errors.name) : ''
                      }
                      required
                    />
                  </Col>

                  <Col sm={12}>
                    <FormControl
                      type="password"
                      name="accountnumber"
                      label="Account Number"
                      placeholder="Account Number"
                      value={values.accountnumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleChange(e);
                        setFieldTouched('accountnumber', true, false);
                      }}
                      maxLength={18}
                      autoComplete="off"
                      onBlur={handleBlur}
                      error={
                        touched?.accountnumber && errors?.accountnumber
                          ? String(errors.accountnumber)
                          : ''
                      }
                      restrictNumberInput
                      preventCopyPaste
                      required
                      eyeIconClassName="eye-icon-zindex"
                    />
                  </Col>

                  {values?.accountnumber !== originalAccountNumber && (
                    <Col sm={12}>
                      <FormControl
                        type="password"
                        name="confirmAccountNumber"
                        label="Confirm Account Number"
                        placeholder="Account Number"
                        value={values.confirmAccountNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          handleChange(e);
                          setFieldTouched('confirmAccountNumber', true, false);
                        }}
                        maxLength={18}
                        onBlur={handleBlur}
                        autoComplete="off"
                        error={
                          touched?.confirmAccountNumber &&
                          errors?.confirmAccountNumber
                            ? String(errors.confirmAccountNumber)
                            : ''
                        }
                        restrictNumberInput
                        preventCopyPaste
                        required
                        eyeIconClassName="eye-icon-zindex"
                      />
                    </Col>
                  )}

                  <Col sm={12}>
                    <FormControl
                      type="text"
                      name="code"
                      label="IFSC Code"
                      autoComplete="off"
                      placeholder="Enter IFSC Code"
                      value={values?.code || ''}
                      onBlur={handleBlur}
                      maxLength={11}
                      error={
                        touched?.code && errors?.code ? String(errors.code) : ''
                      }
                      required
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        let value = e.target.value.toUpperCase();
                        value = value.replace(/[^A-Z0-9]/g, '');
                        if (value?.length >= 1) {
                          const first4 = value?.slice(0, 4)?.replace(/[^A-Z]/g, '');
                          value = first4 + value?.slice(4);
                        }
                        if (value?.length >= 5) {
                          value = value?.slice(0, 4) + '0' + value?.slice(5);
                        }
                        if (value.length > 5) {
                          const last6 = value?.slice(5)?.replace(/[^A-Z0-9]/g, '');
                          value = value?.slice(0, 5) + last6;
                        }
                        value = value?.slice(0, 11);

                        handleChange({
                          target: { name: 'code', value },
                        });

                        setFieldTouched('code', true, false);
                      }}
                    />
                  </Col>

                  <Col lg={6} className="mb-3 mb-lg-0">
                    <CommonButton
                      fluid
                      title="Cancel"
                      className="btn-secondry"
                      onClick={() => closeAddBankAccount()}
                    />
                  </Col>

                  <Col lg={6}>
                    <CommonButton
                      title="Confirm"
                      type="submit"
                      fluid
                      disabled={!(isFormChanged || !isValid)}
                    />
                  </Col>
                </Row>
              </Form>
            );
          }}
        </Formik>
      </CommonModal>
    );
  }
);

export default AddBankAccount;
