import CommonModal from '../CommonModal';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useModalBackClose } from '../../../hooks/useModalBackClose';
import phone_icon from '../../../assets/images/icons/phone.svg';
import upipayment from '../../../assets/images/upipayment.svg';
import TabsComponent from '../../ui/tabsComponent/TabsComponent';
import DepositUsdc from './DepositUsdc';
import CommonButton from '../../ui/commonButton/CommonButton';
import { Form, Formik } from 'formik';
import { Col, Row } from 'react-bootstrap';
import FormControl from '../../formik/FormControl';
import './WalletDepositModal.scss';
import * as Yup from 'yup';
import { useGetAdminWallet } from '../../../hooks/useGetAdminWallet';
import { useBankDetails } from '../../../hooks/useBankDetail';
import { useUserSettings } from '../../../hooks/useUserSetting';
import Toast from '../../common/Toast';
import { formatAmount } from '../../../helpers/user/maskEmail';
import { useSelector } from 'react-redux';


const WalletDepositModal = NiceModal.create(
  ({
    closeWalletDepostModal,
    onTransactionSuccess,
    navigate,
  }: {
    closeWalletDepostModal: () => void;
    onTransactionSuccess: () => void;
    navigate: (path: string) => void;
  }) => {
    const TransactionDetailModal = useModal('TransactionDetailModal');
    const closeTransactionDetailModal = useCallback(() => {
      TransactionDetailModal.remove();
    }, [TransactionDetailModal]);

    const { cryptoEnable } = useSelector(
      (state: RootState) => state?.user?.profile
    );

    const [activeTab, setActiveTab] = useState(cryptoEnable ? 'usdt' : 'inr');
    const maxDepositAmount = 1000000;
    const [adminWallet, setAdminWallet] = useState<any>(null);
    const [AccountNumber, setAccountNumber] = useState('');
    const [upiId, setUpiId] = useState('');
    const [selectedAmount, setSelectedAmount] = useState<string>('');
    const [bankActive, setBankActive] = useState<number>();
    const [upiActive, setUpiActive] = useState<number>();
    const [depositfees, setDepositFees] = useState<number>();
    const [pendingPaymentThrough, setPendingPaymentThrough] = useState<string[]>([]);
    const { fetchBankingDetails } = useBankDetails();
    const { fetchAdminWallet } = useGetAdminWallet();
    const { fetchUserSettings } = useUserSettings();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
      'Bank' | 'UPI' | null
    >(null);

    const handleBackClose = useModalBackClose(closeWalletDepostModal);
    

    const initialValues = {
      amount: '',
    };

    const tabItems = useMemo(() => {
      if (cryptoEnable) {
        return [{ key: 'usdt', label: 'USDT' }];
      }
      return [{ key: 'inr', label: 'INR' }];
    }, [cryptoEnable]);

    const DepositSchema = useMemo(() => {
      return Yup.object().shape({
        amount: Yup.number()
          .transform((originalValue) => {
            const num = Number(originalValue);
            return isNaN(num) ? undefined : num;
          })
          .typeError('Enter a valid amount')
          .required('Amount is required')
          .min(500, 'Minimum deposit amount is ₹500')
          .max(maxDepositAmount, 'Maximum deposit amount is ₹10,00,000 (10 lakhs)')
          .test('decimal-places', activeTab === 'usdt' ? 'Enter a valid amount (up to 6 decimals)' : 'Enter a valid amount (up to 2 decimals)', (value) => {
            if (activeTab === 'usdt') {
              // USDT supports 6 decimals
              return /^\d*\.?\d{0,6}$/.test(String(value ?? ''));
            }
            // INR supports 2 decimals
            return /^\d*\.?\d{0,2}$/.test(String(value ?? ''));
          }),
      });
    }, [activeTab, maxDepositAmount]);

    const banklist = [
      { name: 'Account Holder Name', info: adminWallet?.holderName },
      { name: 'Acc. Number', info: adminWallet?.accountNumber },
      { name: 'IFSC Code', info: adminWallet?.ifscCode },
      { name: 'Bank & Branch', info: adminWallet?.bankName },
    ];

    const upilist = [
      { name: 'Holder Name', info: adminWallet?.holderName },
      { name: 'Upi Id', info: adminWallet?.upiId },
    ];

    const onSubmit = (values: any) => {
      console.log('Form values submitted:', values);
    };

    useEffect(() => {
      const getWalletData = async () => {
        try {
          const res = await fetchAdminWallet();
          setAdminWallet(res?.data?.approvedWallet);
        } catch (err) {
          console.error('Failed to fetch admin wallet:', err);
        }
      };
      getWalletData();
    }, [fetchAdminWallet]);

    useEffect(() => {
      const getUserWalletData = async () => {
        try {
          const res = await fetchBankingDetails(true);
          const approvedWallet = res?.data?.approvedWallet;
          const pendingRequestsArray = res?.data?.pendingRequests || [];
          setAccountNumber(approvedWallet?.accountNumber);
          setUpiId(
            approvedWallet?.upiId ||
              (approvedWallet?.accountNumber?.includes('@')
                ? approvedWallet?.accountNumber
                : null)
          );
          const hasPendingBank = pendingRequestsArray.some(
            (req: any) => req?.bankName && req?.ifscCode && req?.status === 'Pending'
          );
          const hasPendingUpi = pendingRequestsArray.some(
            (req: any) =>
              !req?.bankName &&
              !req?.ifscCode &&
              req?.accountNumber?.includes('@') &&
              req?.status === 'Pending'
          );
          const pendingMethods: string[] = [];
          if (hasPendingBank) pendingMethods.push('Bank');
          if (hasPendingUpi) pendingMethods.push('UPI');
          setPendingPaymentThrough(
            pendingMethods.length > 0
              ? pendingMethods
              : res?.data?.pendingPaymentThrough || []
          );
        } catch (err) {
          console.error('Failed to fetch admin wallet:', err);
        }
      };
      getUserWalletData();
    }, [fetchBankingDetails]);

    useEffect(() => {
      const getUserWalletSettings = async () => {
        try {
          const res = await fetchUserSettings();
          setBankActive(res?.data?.bankActive);
          setUpiActive(res?.data?.upiActive);
          setDepositFees(res?.data?.depositFee);
        } catch (err) {
          console.error('Failed to fetch admin wallet:', err);
        }
      };
      getUserWalletSettings();
    }, [fetchUserSettings]);

    // Reset tab based on cryptoEnable
    useEffect(() => {
      if (cryptoEnable && activeTab === 'inr') {
        setActiveTab('usdt');
      } else if (!cryptoEnable && activeTab === 'usdt') {
        setActiveTab('inr');
      }
    }, [cryptoEnable]);

    return (
      <>
        <CommonModal className="depositModal"heading={"Deposit Funds"} show onHide={handleBackClose}>
          <TabsComponent
            activeTab={activeTab}
            onSelect={(key) => {
              const selectedTab = tabItems.find((tab) => tab.key === key);
              if (selectedTab) {
                setActiveTab(key ?? 'inr');
              }
            }}
            tabItems={tabItems}
            className="deposit_tabs"
          />
          <div className="tab_content">
            {activeTab === 'inr' && (
              <Formik
                initialValues={initialValues}
                onSubmit={onSubmit}
                validationSchema={DepositSchema}
              >
                {({
                  handleSubmit,
                  values,
                  handleBlur,
                  setFieldValue,
                  touched,
                  errors,
                  setFieldTouched,
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col sm={12}>
                        <FormControl
                          type="text"
                          name="amount"
                          label="Amount (INR)"
                          required
                          placeholder="1000"
                          value={values.amount}
                          maxlength={6}
                          onChange={(e: any) => {
                            const value = e.target.value;
                            // INR supports 2 decimals
                            const regex = /^\d*\.?\d{0,2}$/;
                            if (regex.test(value)) {
                              setFieldValue('amount', value);
                              setFieldTouched('amount', true, false);
                              setSelectedAmount('');
                            }
                          }}
                          onBlur={handleBlur}
                          autoComplete="off"
                          maxLength={Number(maxDepositAmount?.toString().length) + 1}
                          error={
                            touched?.amount && errors?.amount ? errors?.amount : ''
                          }
                          bottomTitle={
                            <>
                              <h6>
                                Deposit Fee:{' '}
                                <span>{`${formatAmount(depositfees) || '0.00'}%`}</span>
                              </h6>
                            </>
                          }
                        />
                      </Col>
                    </Row>
                    <div className="amount_btns">
                      {['5000', '10000', '25000', '50000']?.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className={selectedAmount === amt ? 'active' : ''}
                          onClick={() => {
                            setFieldTouched('amount', true, false);
                            setFieldValue('amount', amt);
                            setSelectedAmount(amt);
                          }}
                        >
                          ₹{Number(amt).toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>

                    {errors.amount && touched.amount && (
                      <div className="error-text">{errors.amount}</div>
                    )}

                    <div className="upi_method">
                      <p>Payment Method</p>
                      <div
                        className={`payment_method ${pendingPaymentThrough.some((method) => method?.toLowerCase() === 'bank') || (AccountNumber && (!values.amount || Number(bankActive) === 0)) ? 'disabled' : ''} ${selectedPaymentMethod === 'Bank' ? 'active' : ''}`}
                        onClick={() => {
                          if (
                            !values?.amount ||
                            !AccountNumber ||
                            !adminWallet?.accountNumber ||
                            Number(bankActive) === 0 ||
                            pendingPaymentThrough?.some(
                              (method) => method?.toLowerCase() === 'bank'
                            )
                          )
                            return;
                          setSelectedPaymentMethod('Bank');
                        }}
                      >
                        <img src={phone_icon} alt="phone-icon" />
                        <div className="payment_info">
                          {pendingPaymentThrough?.some(
                            (method) => method?.toLowerCase() === 'bank'
                          ) ? (
                            <>
                              <h5>Manual Bank Transfer</h5>
                              <span className="unavailable_text">
                                Bank Transfer Pending Approval
                              </span>
                            </>
                          ) : Number(bankActive) === 0 ? (
                            <>
                              <h5>Manual Bank Transfer</h5>
                              <span className="unavailable_text">
                                Bank Transfer Unavailable
                              </span>
                            </>
                          ) : AccountNumber ? (
                            <>
                              <h5>Manual Bank Transfer</h5>
                              <span>
                                {AccountNumber?.replace(/\d(?=\d{4})/g, 'X')
                                  ?.replace(/(.{4})/g, '$1 ')
                                  ?.trim()}
                              </span>
                            </>
                          ) : (
                            <CommonButton
                              title="Add Bank Account"
                              className="bank_btn"
                              onClick={() => {
                                closeWalletDepostModal();
                                navigate('/user/settings?tab=bankdetails');
                              }}
                            />
                          )}
                        </div>
                      </div>
                      {upiId ? (
                        <div
                          className={`payment_method ${!values.amount || !adminWallet?.upiId || Number(upiActive) === 0 || pendingPaymentThrough.some((method) => method?.toLowerCase() === 'upi') ? 'disabled' : ''} ${
                            selectedPaymentMethod === 'UPI' ? 'active' : ''
                          }`}
                          onClick={() => {
                            if (
                              !values?.amount ||
                              !adminWallet?.upiId ||
                              !upiId ||
                              Number(upiActive) === 0 ||
                              pendingPaymentThrough.some(
                                (method) => method?.toLowerCase() === 'upi'
                              )
                            )
                              return;
                            setSelectedPaymentMethod('UPI');
                          }}
                        >
                          <img src={upipayment} alt="upi-icon" />
                          <div className="payment_info">
                            <h5>UPI Payment</h5>
                            {pendingPaymentThrough?.some(
                              (method) => method?.toLowerCase() === 'upi'
                            ) ? (
                              <span className="unavailable_text">
                                UPI Payment Pending Approval
                              </span>
                            ) : !adminWallet?.upiId || Number(upiActive) === 0 ? (
                              <span className="unavailable_text">
                                UPI Payment Unavailable
                              </span>
                            ) : (
                              <h6>{upiId}</h6>
                            )}
                          </div>
                        </div>
                      ) : pendingPaymentThrough?.some(
                          (method) => method?.toLowerCase() === 'upi'
                        ) ? (
                        <div className={`payment_method disabled`}>
                          <img src={upipayment} alt="upi-icon" />
                          <div className="payment_info">
                            <h5>UPI Payment</h5>
                            <span className="unavailable_text">
                              UPI Payment Pending Approval
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="only_add_upi_btn">
                          <img src={upipayment} alt="upi-icon" />
                          <CommonButton
                            title="Add UPI Account"
                            className="bank_btn"
                            onClick={() => {
                              closeWalletDepostModal();
                              navigate('/user/settings?tab=bankdetails');
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="payment_gateway">
                      <p>Payment gateway coming soon</p>
                    </div>

                    <div className="payment_gateway">
                      <p className="note">
                        <span>Note:</span> Deposits can be made only from your linked
                        bank account or UPI ID.
                      </p>
                    </div>

                    <div className="deposit_info">
                      <CommonButton
                        title={'Cancel'}
                        onClick={handleBackClose}
                        className="btn-secondry"
                        fluid
                      />
                      <CommonButton
                        title={`Proceed to pay ₹${values.amount || '0'}`}
                        type="submit"
                        fluid
                        disabled={
                          !values.amount ||
                          Number(values.amount) < 500 ||
                          Number(values.amount) > 1000000 ||
                          !selectedPaymentMethod
                        }
                        className={
                          !values.amount ||
                          Number(values.amount) < 500 ||
                          Number(values.amount) > 1000000 ||
                          !selectedPaymentMethod
                            ? 'disabled-btn'
                            : ''
                        }
                        onClick={() => {
                          if (!values?.amount || !selectedPaymentMethod) return;
                          if (selectedPaymentMethod === 'Bank' && !AccountNumber) {
                            Toast.info(
                              'Deposit unavailable — Admin bank details are not configured yet.'
                            );
                            return;
                          }
                          if (selectedPaymentMethod === 'UPI' && !upiId) {
                            Toast.info(
                              'Deposit unavailable — Admin UPI details are not configured yet.'
                            );
                            return;
                          }
                          closeWalletDepostModal();
                          if (selectedPaymentMethod === 'Bank') {
                            TransactionDetailModal.show({
                              closeTransactionDetailModal,
                              listheading: 'Bank Transfer Details',
                              list: banklist,
                              amount: values?.amount,
                              selectedPaymentMethod,
                              onTransactionSuccess: () => {
                                onTransactionSuccess?.();
                              },
                            });
                          } else if (selectedPaymentMethod === 'UPI') {
                            TransactionDetailModal.show({
                              closeTransactionDetailModal,
                              listheading: 'UPI Details',
                              list: upilist,
                              amount: values?.amount,
                              selectedPaymentMethod,
                              onTransactionSuccess: () => {
                                onTransactionSuccess?.();
                              },
                            });
                          }
                        }}
                      />
                    </div>
                  </Form>
                )}
              </Formik>
            )}

            {activeTab === 'usdt' && <DepositUsdc currency="USDT" />}
          </div>
        </CommonModal>
      </>
    );
  }
);

export default WalletDepositModal;
