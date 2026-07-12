import NiceModal, { useModal } from '@ebay/nice-modal-react';
import CommonButton from '../../ui/commonButton/CommonButton';
import CommonModal from '../CommonModal';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModalBackClose } from '../../../hooks/useModalBackClose';
import { Form, Formik } from 'formik';
import { Col, Row } from 'react-bootstrap';
import FormControl from '../../formik/FormControl';
import './WalletWithdrawModal.scss';
import TabsComponent from '../../ui/tabsComponent/TabsComponent';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { useDispatch, useSelector } from 'react-redux';
import Toast from '../../common/Toast';
import { loader } from '../../../redux/Slices/loader.slice';
import * as Yup from 'yup';
import { useBankDetails } from '../../../hooks/useBankDetail';
import { useGetAmount } from '../../../hooks/userGetAmount';
import {
  // formatAmount,
  formatCurrency,
  formatWithCommas,
  formatUSDTWithCommas,
} from '../../../helpers/user/maskEmail';
import { useUserSettings } from '../../../hooks/useUserSetting';
import useCopyClipboard from '../../../hooks/useCopyToClipboard';
import { CopyIcon } from '../../../assets/icons/SvgIcon';
import { ENVIRONMENT } from '../../../utils/config';

interface WalletWithdrawModalProps {
  closeWalletWithdrawModal: () => void;
  navigate: (path: string) => void;
  onTransactionSuccess: () => void;
}

const WalletWithdrawModal = NiceModal.create(
  ({
    closeWalletWithdrawModal,
    navigate,
    onTransactionSuccess,
  }: WalletWithdrawModalProps) => {
    const dispatch = useDispatch();
    const CongratulationsModal = useModal('CongratulationsModal');
    const closeCongratulationsModal = useCallback(() => {
      CongratulationsModal.remove();
    }, [CongratulationsModal]);
    const { cryptoEnable } = useSelector((state: RootState) => state?.user?.profile);
    const [bankUserDetailFetch, setBankUserDetailFetch] = useState<any>({});
    const [activeTab, setActiveTab] = useState(cryptoEnable ? 'usdt' : 'inr');
    const [maxWithdraw, setmaxWithdraw] = useState<number>();
    const [minWithdraw, setminWithdraw] = useState<number>();
    const [maxWithdrawUsdt, setMaxWithdrawUsdt] = useState<number>();
    const [minWithdrawUsdt, setMinWithdrawUsdt] = useState<number>();
    const [feesPerecntage, setfeesPerecntage] = useState<any>();
    const [withdrawalFeeUsdt, setWithdrawalFeeUsdt] = useState<number>(0);
    const [withdrawalFeeUsdtPercent, setWithdrawalFeeUsdtPercent] = useState<number>(0);
    const [withdrawalFeeUsdtFixed, setWithdrawalFeeUsdtFixed] = useState<number | undefined>();
    const [userWalletBalance, setUserWalletBalance] = useState<any>({});
    const [pendingPaymentThrough, setPendingPaymentThrough] = useState<string[]>([]);
    const { fetchBankingDetails } = useBankDetails();
    const { fetchUserSettings } = useUserSettings();
    const [selectedAccountType, setSelectedAccountType] = useState<'Bank' | 'UPI'>(
      'Bank'
    );
    const { fetchAmount } = useGetAmount();
    const [copyToClipboard] = useCopyClipboard();
    const resetFormRef = useRef<(() => void) | null>(null);

    const handleBackClose = useModalBackClose(closeWalletWithdrawModal);

    const isProd = ENVIRONMENT === 'prod';
    const defaultNetwork = isProd ? 'polygon' : 'amoy';

    const initialValues = {
      amount: '',
      address: '',
      network: defaultNetwork,
    };

    const getAccountDetailsList = () => {
      if (selectedAccountType === 'UPI') {
        return [
          { name: 'Account Holder Name', info: bankUserDetailFetch?.holderName },
          { name: 'UPI ID', info: bankUserDetailFetch?.upiId },
        ];
      } else {
        return [
          { name: 'Account Holder Name', info: bankUserDetailFetch?.holderName },
          { name: 'Acc. Number', info: bankUserDetailFetch?.accountNumber },
          { name: 'IFSC Code', info: bankUserDetailFetch?.ifscCode },
          { name: 'Bank & Branch', info: bankUserDetailFetch?.bankName },
        ];
      }
    };

    const networkselect = isProd
      ? [{ value: 'polygon', label: 'Polygon' }]
      : [{ value: 'amoy', label: 'Amoy' }];

    const tabItems = useMemo(() => {
      if (cryptoEnable) {
        return [{ key: 'usdt', label: 'USDT' }];
      }
      return [{ key: 'inr', label: 'INR' }];
    }, [cryptoEnable]);

    const DepositSchema = useMemo(() => {
      return Yup.object().shape({
        amount: Yup.number()
          .typeError('Enter a valid amount')
          .required('Amount is required')
          .test(
            'decimal-places',
            activeTab === 'usdt'
              ? 'Enter a valid amount (up to 6 decimals)'
              : 'Enter a valid amount (up to 2 decimals)',
            function (value) {
              if (value === undefined || value === null) return true;
              const valueStr = String(value);
              if (activeTab === 'usdt') {
                // USDT supports 6 decimals
                return /^\d*\.?\d{0,6}$/.test(valueStr);
              }
              // INR supports 2 decimals
              return /^\d*\.?\d{0,2}$/.test(valueStr);
            }
          )
          .test('min-withdraw', function (value) {
            if (!value) return this.createError({ message: 'Amount is required' });

            // For USDT, check minWithdrawUsdt
            if (activeTab === 'usdt') {
              if (!value || value <= 0) {
                return this.createError({ message: 'Enter a valid amount' });
              }

              if (minWithdrawUsdt === undefined || minWithdrawUsdt === null) {
                return this.createError({
                  message: 'Withdraw unavailable, please try again later',
                });
              }

              if (minWithdrawUsdt > 0 && value < minWithdrawUsdt) {
                return this.createError({
                  message: `Minimum withdraw amount is ${minWithdrawUsdt} USDT`,
                });
              }
              return true;
            }

            if (minWithdraw === undefined || minWithdraw === null) {
              return this.createError({
                message: 'Withdraw unavailable, please try again later',
              });
            }

            if (minWithdraw > 0 && value < minWithdraw) {
              return this.createError({
                message: `Minimum withdraw amount is ₹${minWithdraw}`,
              });
            }
            return true;
          })
          .test('max-withdraw', function (value) {
            if (!value) return false;

            // For USDT, check maxWithdrawUsdt
            if (activeTab === 'usdt') {
              if (maxWithdrawUsdt === undefined || maxWithdrawUsdt === null) {
                return this.createError({
                  message: 'Withdraw unavailable, please try again later',
                });
              }

              if (maxWithdrawUsdt <= 0) {
                return this.createError({
                  message: 'Withdraw unavailable, please try again later',
                });
              }

              if (value > maxWithdrawUsdt) {
                return this.createError({
                  message: `Maximum withdraw amount is ${maxWithdrawUsdt} USDT`,
                });
              }
              return true;
            }

            if (maxWithdraw === undefined || maxWithdraw === null) {
              return this.createError({
                message: 'Withdraw unavailable, please try again later',
              });
            }

            if (maxWithdraw <= 0) {
              return this.createError({
                message: 'Withdraw unavailable, please try again later',
              });
            }

            if (value > maxWithdraw) {
              return this.createError({
                message: `Maximum withdraw amount is ₹${maxWithdraw}`,
              });
            }
            return true;
          })
          .test('balance-check', function (value) {
            if (!value) return false;

            // For USDT, check USDT balance
            if (activeTab === 'usdt') {
              const usdtBalance = userWalletBalance?.usdtBalance || 0;
              if (value > usdtBalance) {
                return this.createError({
                  message: 'Insufficient wallet balance',
                });
              }
              return true;
            }

            const fullBalance = userWalletBalance?.inrBalance || 0;

            if (value > fullBalance) {
              return this.createError({
                message: 'Insufficient wallet balance',
              });
            }

            return true;
          }),
        address: Yup.string().when([], {
          is: () => activeTab === 'usdt',
          then: (schema) =>
            schema
              .required('Wallet address is required')
              .matches(
                /^0x[a-fA-F0-9]{40}$/,
                `Please enter a valid ${isProd ? 'Polygon' : 'Amoy'} wallet address (0x followed by 40 hexadecimal characters)`
              ),
          otherwise: (schema) => schema,
        }),
        network: Yup.string().when([], {
          is: () => activeTab === 'usdt',
          then: (schema) => schema.required('Please select a network'),
          otherwise: (schema) => schema,
        }),
      });
    }, [
      activeTab,
      minWithdraw,
      maxWithdraw,
      minWithdrawUsdt,
      maxWithdrawUsdt,
      userWalletBalance?.inrBalance,
      userWalletBalance?.usdtBalance,
      userWalletBalance?.inrDepositInLastXDays,
      userWalletBalance?.usdtDepositInLastXDays,
      cryptoEnable,
      feesPerecntage,
    ]);

    useEffect(() => {
      const getUserWalletSettings = async () => {
        try {
          const res = await fetchUserSettings();
          setmaxWithdraw(
            res?.data?.maxWithdraw ? Number(res.data.maxWithdraw) : undefined
          );
          setminWithdraw(
            res?.data?.minWithdraw ? Number(res.data.minWithdraw) : undefined
          );
          setMaxWithdrawUsdt(
            res?.data?.maxWithdrawUsdt ? Number(res.data.maxWithdrawUsdt) : undefined
          );
          setMinWithdrawUsdt(
            res?.data?.minWithdrawUsdt ? Number(res.data.minWithdrawUsdt) : undefined
          );
          setfeesPerecntage(res?.data?.withdrawalFee);
          const feeUsdt =
            Number(res?.data?.withdrawalFeeUsdt) ||
            Number(res?.data?.withdrawal_fee_usdt) ||
            0;
          const feeUsdtPercent =
            Number(res?.data?.withdrawalFeeUsdtPercent) ||
            Number(res?.data?.withdrawal_fee_usdt_percent) ||
            0;
          const feeUsdtFixed =
            Number(res?.data?.withdrawalFeeUsdtFixed) ||
            Number(res?.data?.withdrawal_fee_usdt_fixed);
          setWithdrawalFeeUsdt(feeUsdt);
          setWithdrawalFeeUsdtPercent(feeUsdtPercent);
          setWithdrawalFeeUsdtFixed(feeUsdtFixed);
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

    const loadBankAmount = useCallback(async () => {
      try {
        const res = await fetchAmount();
        if (res?.success && res?.data) {
          setUserWalletBalance(res?.data?.portfolio);
        }
      } catch (error) {
        console.error('Error preloading bank Amount:', error);
      }
    }, [fetchAmount]);

    const loadBankDetails = useCallback(async () => {
      if (cryptoEnable) {
        setBankUserDetailFetch({});
        return;
      }

      try {
        const res = await fetchBankingDetails(true);
        if (!res?.success || !res?.data) {
          //  Toast.info('Kindly add your bank details!');
          closeWalletWithdrawModal();
          navigate('/user/settings?tab=bankdetails');
          return;
        }
        const approvedWallet = res?.data?.approvedWallet;
        const pendingRequestsArray = res?.data?.pendingRequests || [];

        const { accountNumber, ifscCode, upiId, panNo } = approvedWallet || {};
        if (!panNo) {
          //  Toast.info('Please add your PAN card to proceed.');
          closeWalletWithdrawModal();
          navigate('/user/settings?tab=general');
          return;
        }
        const isUpiAccount = accountNumber?.includes('@');
        const hasFullBankDetails = accountNumber && ifscCode && !isUpiAccount;
        const hasUpiOnly = isUpiAccount || upiId;

        if (!hasFullBankDetails && !hasUpiOnly) {
          //  Toast.info('Kindly add your bank details!');
          closeWalletWithdrawModal();
          navigate('/user/settings?tab=bankdetails');
          return;
        }

        // Set bank/UPI details
        setBankUserDetailFetch({
          ...approvedWallet,
          accountNumber: approvedWallet?.accountNumber,
          upiId: isUpiAccount
            ? approvedWallet?.accountNumber
            : approvedWallet?.upiId || '',
        });
        const hasPendingBank = pendingRequestsArray.some(
          (req: any) =>
            req?.bankName &&
            req?.ifscCode &&
            (req?.status === 'Pending' || req?.status === 'pending')
        );
        const hasPendingUpi = pendingRequestsArray.some(
          (req: any) =>
            !req?.bankName &&
            !req?.ifscCode &&
            req?.accountNumber?.includes('@') &&
            (req?.status === 'Pending' || req?.status === 'pending')
        );

        const pendingMethods: string[] = [];
        if (hasPendingBank) pendingMethods.push('Bank');
        if (hasPendingUpi) pendingMethods.push('UPI');

        const effectivePendingMethods =
          pendingMethods.length > 0
            ? pendingMethods
            : res?.data?.pendingPaymentThrough || [];

        setPendingPaymentThrough(effectivePendingMethods);

        // Decide which account type should be selected and highlighted by default:
        // - If Bank is pending but UPI is active, auto-select UPI.
        // - If UPI is pending but Bank is active, auto-select Bank.
        // - If both are active, default to Bank (matches current design).
        const lowerPending = effectivePendingMethods.map((m: string) =>
          m.toLowerCase()
        );
        const bankBlocked = lowerPending.includes('bank');
        const upiBlocked = lowerPending.includes('upi');

        if (!bankBlocked && hasFullBankDetails) {
          // Bank available and not blocked → prefer Bank
          setSelectedAccountType('Bank');
        } else if (!upiBlocked && hasUpiOnly) {
          // UPI available and not blocked → prefer UPI
          setSelectedAccountType('UPI');
        } else if (bankBlocked && !upiBlocked && hasUpiOnly) {
          // Bank blocked, UPI only → UPI
          setSelectedAccountType('UPI');
        } else if (upiBlocked && !bankBlocked && hasFullBankDetails) {
          // UPI blocked, Bank only → Bank
          setSelectedAccountType('Bank');
        } else if (hasFullBankDetails) {
          setSelectedAccountType('Bank');
        } else if (hasUpiOnly) {
          setSelectedAccountType('UPI');
        }
      } catch (error) {
        console.error('Error fetching bank details:', error);
        //  Toast.info('Kindly add your bank details!');
        closeWalletWithdrawModal();
        navigate('/user/settings?tab=bankdetails');
      }
    }, [fetchBankingDetails, closeWalletWithdrawModal, navigate, cryptoEnable]);

    useEffect(() => {
      loadBankAmount();
      loadBankDetails();
    }, [loadBankAmount, loadBankDetails]);

    useEffect(() => {
      if (resetFormRef?.current) {
        resetFormRef?.current();
      }
    }, [activeTab]);

    const onSubmit = async (
      values: any,
      { resetForm }: { resetForm: () => void }
    ) => {
      try {
        if (activeTab === 'usdt') {
          const payload = {
            amount: values?.amount?.toString(),
            address: values?.address?.trim(),
          };
          const res = await callPostMethod({
            apiUrl: landbitBackendUrl,
            endpoint: API_ENDPOINTS.POST.WITHDRAW_USDT,
            data: payload,
            showToaster: false,
            dispatch,
            showLoader: true,
            showButtonLoader: false,
            buttonKey: 'transactionDetail',
            token: true,
          });
          if (res?.success) {
            Toast.success(res?.message);
            resetForm();
            loadBankAmount();
            closeWalletWithdrawModal();
            onTransactionSuccess?.();
          } else {
            Toast.error(res?.message);
          }
          return;
        }

        // Handle INR withdrawal
        const payload = {
          amount: values?.amount,
          paymentGateway: 'Manual',
          paymentThrough: selectedAccountType,
        };
        const res = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.WITHDRAW_AMOUNT,
          data: payload,
          showToaster: false,
          dispatch,
          showLoader: true,
          showButtonLoader: false,
          buttonKey: 'transactionDetail',
          token: true,
        });
        if (res?.success) {
          Toast.success(res?.message);
          resetForm();
          loadBankAmount();
          closeWalletWithdrawModal();
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
        className="walletWithdrawModal"
        show
        onHide={handleBackClose}
      >
        <h4>Withdraw Funds</h4>
        <TabsComponent
          activeTab={activeTab}
          onSelect={(key) => {
            const selectedTab = tabItems.find((tab) => tab.key === key);
            if (selectedTab) {
              setActiveTab(key ?? 'inr');
            }
          }}
          tabItems={tabItems}
          className="withdraw_tabs"
        />
        <Formik
          initialValues={initialValues}
          onSubmit={onSubmit}
          validationSchema={DepositSchema}
        >
          {({
            handleSubmit,
            values,
            handleChange,
            handleBlur,
            setFieldValue,
            errors,
            touched,
            setFieldTouched,
            setFieldError,
            resetForm,
          }) => {
            resetFormRef.current = resetForm;
            const fullBalance =
              activeTab === 'usdt'
                ? userWalletBalance?.usdtBalance || 0
                : userWalletBalance?.inrBalance || 0;
            const depositLocked =
              activeTab === 'usdt'
                ? userWalletBalance?.usdtDepositInLastXDays || 0
                : userWalletBalance?.inrDepositInLastXDays || 0;
            let freeBalance = fullBalance - depositLocked;
            if (freeBalance < 0) freeBalance = 0;

            const amount = Number(values.amount) || 0;

            // let feeAmount = 0;
            // if (amount < depositLocked) {
            //   freeBalance = 0;
            //   feeAmount = (amount * feesPerecntage) / 100;
            // }
            // else if (amount > freeBalance) {
            //   const feeBase = amount - freeBalance;
            //   feeAmount = (feeBase * feesPerecntage) / 100;
            // }
            // else {
            //   feeAmount = 0;
            // }
            let feeAmount = 0;
            let feePercent = 0;
            if (activeTab === 'usdt') {
              if (
                withdrawalFeeUsdtFixed != null &&
                Number(withdrawalFeeUsdtFixed) > 0
              ) {
                feeAmount = Number(withdrawalFeeUsdtFixed);
              } else {
                feePercent =
                  withdrawalFeeUsdtPercent > 0
                    ? withdrawalFeeUsdtPercent
                    : withdrawalFeeUsdt;
                feeAmount = (amount * feePercent) / 100;
              }
            } else {
              if (amount > freeBalance) {
                const feeBase = amount - freeBalance;
                feeAmount = (feeBase * (feesPerecntage ?? 0)) / 100;
              }
            }
            // const totalGet = Math.max(amount - feeAmount, 0);
            const totalGet = Math.max(amount - feeAmount, 0);

            // For USDT, get balance from different source
            const usdtBalance = userWalletBalance?.usdtBalance || 0;
            // Display actual balance for both cases
            const displayBalance = activeTab === 'usdt' ? usdtBalance : fullBalance;
            const currencySymbol = activeTab === 'usdt' ? '$' : '₹';
            const currencyLabel = activeTab === 'usdt' ? 'USDT' : 'INR';

            return (
              <Form onSubmit={handleSubmit}>
                {activeTab === 'inr' && (
                  <>
                    <Col sm={12}>
                      <FormControl
                        type="text"
                        name="amount"
                        label="Withdrawal Amount (INR)"
                        placeholder="1000"
                        value={values.amount}
                        onChange={(e: any) => {
                          const value = e.target.value;
                          // INR supports 2 decimals
                          if (/^\d*\.?\d{0,2}$/.test(value)) {
                            setFieldValue('amount', value);
                            setFieldTouched('amount', true, false);
                          }
                        }}
                        error={
                          touched?.amount && errors?.amount ? errors?.amount : ''
                        }
                        autoComplete="off"
                        required
                        maxLength={Number(maxWithdraw?.toString().length) + 1}
                        onBlur={handleBlur}
                        bottomTitle={
                          <>
                            <h6 className="balance">
                              Available Balance:
                              <span>
                                {formatCurrency(
                                  userWalletBalance?.inrBalance || '0.00'
                                )}
                              </span>
                            </h6>
                            <h6>
                              Fees Amount:{' '}
                              <span>{`${formatWithCommas(feeAmount) || '0.00'}`}</span>
                            </h6>
                            <h6>
                              You Will Get: <span>{formatCurrency(totalGet)}</span>
                            </h6>
                          </>
                        }
                      />
                    </Col>
                    <div className="amount_btns">
                      {[5000, 10000, 25000, 50000]?.map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => {
                            setFieldTouched('amount', true, false);
                            setFieldValue('amount', amt?.toString());
                          }}
                        >
                          {' '}
                          ₹{amt?.toLocaleString('en-IN')}{' '}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {activeTab === 'usdt' && (
                  <>
                    <Col sm={12}>
                      <FormControl
                        type="text"
                        name="amount"
                        label={`Withdrawal Amount (${currencyLabel})`}
                        placeholder="1000"
                        value={values.amount}
                        onChange={(e: any) => {
                          const value = e.target.value;
                          // USDT supports 6 decimals, INR supports 2 decimals
                          const regex =
                            activeTab === 'usdt'
                              ? /^\d*\.?\d{0,6}$/
                              : /^\d*\.?\d{0,2}$/;
                          if (regex.test(value)) {
                            setFieldValue('amount', value);
                            setFieldTouched('amount', true, false);
                          }
                        }}
                        error={
                          touched?.amount && errors?.amount ? errors?.amount : ''
                        }
                        autoComplete="off"
                        required
                        onBlur={handleBlur}
                        bottomTitle={
                          <>
                            <h6 className="balance">
                              Available Balance:{'  '}
                              <span>
                                {activeTab === 'usdt' ? (
                                  <>
                                    <span>{/* <UsdtIcon /> */}</span>
                                    {formatUSDTWithCommas(displayBalance) ||
                                      '0'}{' '}
                                    USDT
                                  </>
                                ) : (
                                  `${currencySymbol}${formatWithCommas(displayBalance) || '0.00'}`
                                )}
                              </span>
                            </h6>
                            <h6>
                              Fees Amount:{' '}
                              <span>
                                {activeTab === 'usdt' ? (
                                  feePercent > 0 ? (
                                    <>
                                      {feePercent}% (
                                      {formatUSDTWithCommas(feeAmount) || '0'}{' '}
                                      USDT)
                                    </>
                                  ) : (
                                    `${formatUSDTWithCommas(feeAmount) || '0'} USDT`
                                  )
                                ) : (
                                  `${formatWithCommas(feeAmount) || '0.00'}`
                                )}
                              </span>
                            </h6>
                            <h6>
                              You Will Get:{' '}
                              <span>
                                {activeTab === 'usdt'
                                  ? (() => {
                                      const formatted =
                                        formatUSDTWithCommas(totalGet) || '0';
                                      const cleaned = formatted.replace(
                                        /\.?0+$/,
                                        ''
                                      );
                                      return `${cleaned} USDT`;
                                    })()
                                  : formatCurrency(totalGet)}
                              </span>
                            </h6>
                          </>
                        }
                      />
                    </Col>
                    <div className="amount_btns">
                      {[50, 100, 250, 500]?.map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => {
                            setFieldTouched('amount', true, false);
                            setFieldValue('amount', amt?.toString());
                          }}
                        >
                          <span className="amount-text">
                            {formatUSDTWithCommas(amt) ||
                              amt?.toLocaleString('en-US')}{' '}
                            USDT
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="tab_content">
                  {activeTab === 'inr' && (
                    <Row>
                      <Col sm={12}>
                        <div className="add_acc">
                          <label>Account</label>
                          <div className="withdraw_accbtn">
                            <CommonButton
                              title="Bank Account"
                              className={`add_accbtn${selectedAccountType === 'Bank' ? ' active' : ''}`}
                              fluid
                              disabled={pendingPaymentThrough?.some(
                                (method) => method?.toLowerCase() === 'bank'
                              )}
                              onClick={() => {
                                if (
                                  pendingPaymentThrough?.some(
                                    (method) => method?.toLowerCase() === 'bank'
                                  )
                                )
                                  return;
                                setFieldError('amount', '');
                                setFieldTouched('amount', false);
                                setSelectedAccountType('Bank');
                              }}
                            />
                            <CommonButton
                              title="UPI"
                              className={`add_accbtn${selectedAccountType === 'UPI' ? ' active' : ''}`}
                              fluid
                              disabled={pendingPaymentThrough?.some(
                                (method) => method?.toLowerCase() === 'upi'
                              )}
                              onClick={() => {
                                if (
                                  pendingPaymentThrough?.some(
                                    (method) => method?.toLowerCase() === 'upi'
                                  )
                                )
                                  return;
                                setSelectedAccountType('UPI');
                                setFieldTouched('amount', false);
                                setFieldError('amount', '');
                              }}
                            />
                          </div>
                        </div>
                      </Col>
                      <Col sm={12}>
                        <div className="acc_detail">
                          {selectedAccountType === 'Bank' ? (
                            bankUserDetailFetch?.accountNumber?.trim() &&
                            bankUserDetailFetch?.ifscCode?.trim() &&
                            bankUserDetailFetch?.bankName?.trim() ? (
                              <ul>
                                <p>Withdrawal will be sent to:</p>
                                {getAccountDetailsList()?.map(
                                  (item: any, index: any) => {
                                    const itemNameLower =
                                      item?.name?.toLowerCase() || '';
                                    const shouldShowCopyButton =
                                      itemNameLower?.includes('acc. number') ||
                                      itemNameLower?.includes('account number') ||
                                      itemNameLower?.includes('ifsc');

                                    return (
                                      <li key={index}>
                                        <h6>{item?.name}</h6>
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem',
                                            justifyContent: 'flex-end',
                                          }}
                                        >
                                          <span>{item?.info || '-'}</span>
                                          {shouldShowCopyButton &&
                                            item?.info &&
                                            item?.info !== '-' && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  copyToClipboard(item.info)
                                                }
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
                                  }
                                )}
                              </ul>
                            ) : (
                              <CommonButton
                                title="Add Bank Account"
                                fluid
                                onClick={() => {
                                  closeWalletWithdrawModal();
                                  navigate('/user/settings');
                                }}
                              />
                            )
                          ) : bankUserDetailFetch?.upiId?.trim() ? (
                            <ul>
                              <p>Withdrawal will be sent to:</p>
                              {getAccountDetailsList()?.map(
                                (item: any, index: any) => {
                                  const itemNameLower =
                                    item?.name?.toLowerCase() || '';
                                  const shouldShowCopyButton =
                                    itemNameLower?.includes('upi') ||
                                    itemNameLower?.includes('upi id');

                                  return (
                                    <li key={index}>
                                      <h6>{item?.name}</h6>
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.8rem',
                                          justifyContent: 'flex-end',
                                        }}
                                      >
                                        <span>{item?.info || '-'}</span>
                                        {shouldShowCopyButton &&
                                          item?.info &&
                                          item?.info !== '-' && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                copyToClipboard(item.info)
                                              }
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
                                }
                              )}
                            </ul>
                          ) : (
                            <CommonButton
                              title="Add UPI ID"
                              fluid
                              onClick={() => {
                                closeWalletWithdrawModal();
                                navigate('/user/settings');
                              }}
                            />
                          )}
                        </div>
                      </Col>
                    </Row>
                  )}
                  {activeTab === 'usdt' && (
                    <Row>
                      <Col sm={12}>
                        {networkselect.length === 1 ? (
                          <div className="network-display">
                            <label className="form-label">Blockchain Network</label>
                            <div className="network-value">
                              {networkselect[0].label}
                            </div>
                          </div>
                        ) : (
                          <FormControl
                            control="select"
                            name="network"
                            label="Blockchain Network"
                            options={networkselect}
                            placeholder="Polygon"
                            value={networkselect.find(
                              (opt) => opt.value === 'polygon'
                            )}
                            onChange={() => {
                              // Network is disabled, no action needed
                            }}
                            isDisabled={true}
                          />
                        )}
                      </Col>
                      <Col sm={12}>
                        <FormControl
                          type="text"
                          name="address"
                          label="Destination Wallet Address"
                          maxlength={46}
                          placeholder="Enter USDT Wallet Address"
                          className="wallet_address"
                          value={values.address}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched?.address && errors?.address
                              ? errors?.address
                              : ''
                          }
                          bottomTitle={
                            <>
                              <h6>Ensure the address supports network</h6>
                            </>
                          }
                        />
                      </Col>
                    </Row>
                  )}
                </div>
                {activeTab === 'inr' && (
                  <div className="payment_gateway">
                    <p className="note">
                      <span>Note:</span> Withdrawals are allowed only to your
                      registered bank account or UPI ID.
                    </p>
                  </div>
                )}
                {activeTab === 'usdt' && (
                  <div className="payment_gateway">
                    <p className="note">
                      <span>Note:</span> Please ensure the destination wallet address
                      is correct and supports the selected network. Transactions
                      cannot be reversed.
                    </p>
                  </div>
                )}
                <Row className='bottom_action'>
                  <Col lg={6}>
                    <CommonButton
                      title={'Cancel'}
                      onClick={handleBackClose}
                      className="btn-secondry"
                      fluid
                    />
                  </Col>
                  <Col lg={6}>
                    <CommonButton
                      title={
                        activeTab === 'usdt' ? (
                          <>
                            {(() => {
                              const formatted =
                                formatUSDTWithCommas(values?.amount) || '0';
                              // Remove trailing zeros after decimal point
                              const cleaned = formatted.replace(/\.?0+$/, '');
                              return `${cleaned} USDT`;
                            })()}
                          </>
                        ) : (
                          `Withdraw ${formatCurrency(values?.amount ? values?.amount : '')}`
                        )
                      }
                      type="submit"
                      disabled={
                        !values?.amount ||
                        (activeTab === 'inr'
                          ? selectedAccountType === 'Bank'
                            ? !(
                                bankUserDetailFetch?.accountNumber?.trim() &&
                                bankUserDetailFetch?.ifscCode?.trim() &&
                                bankUserDetailFetch?.bankName?.trim()
                              )
                            : !bankUserDetailFetch?.upiId?.trim()
                          : activeTab === 'usdt'
                            ? !values?.address?.trim() || !values?.network
                            : false) ||
                        // Extra safeguard: if there is any pending Bank request,
                        // disable INR bank withdrawals even if an approved bank exists.
                        (activeTab === 'inr' &&
                          selectedAccountType === 'Bank' &&
                          pendingPaymentThrough?.some(
                            (method) => method?.toLowerCase() === 'bank'
                          ))
                      }
                      fluid
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
export default WalletWithdrawModal;
