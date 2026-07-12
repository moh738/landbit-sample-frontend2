import { Form, Formik } from 'formik';
import { Col, Row } from 'react-bootstrap';
import * as Yup from 'yup';
import FormControl from '../../../../../formik/FormControl';
import CommonButton from '../../../../../ui/commonButton/CommonButton';
import { BankIcon, RewardIcon, UsdtIcon } from '../../../../../../assets/icons/SvgIcon';
import { useModal } from '@ebay/nice-modal-react';
import './CreateOrder.scss';
import { OrderInformationProps } from '../../../../../../interfaces/createOrder/createOrder';
import { formatCurrency, formatUSDT, formatUSDTWithCommas } from '../../../../../../helpers/user/maskEmail';
import { useGetAmount } from '../../../../../../hooks/userGetAmount';
import { useUsdtPrice } from '../../../../../../hooks/useUsdtPrice';
import {
  useCallback, useEffect, useState, useMemo,
  useRef
} from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../../../../common/Toast';
import store from '../../../../../../redux/Store';
import { useSelector } from 'react-redux';
// import dayjs from 'dayjs';
// import customParseFormat from 'dayjs/plugin/customParseFormat';

const OrderInformation: React.FC<OrderInformationProps> = ({
  propertyDetails,
  tokenDetails,
  financialInfo,
  onOrderSuccess,
  tickers,
  investmentDetails,
}) => {
  const { cryptoEnable } = useSelector(
    (state: RootState) => state?.user?.profile
  );

  // Calculate values for Full Ownership
  const equityEnable = useSelector((state: RootState) => state?.user?.equityEnable);
  const currentValuation = equityEnable
    ? Number(financialInfo?.companyValuation) || 0
    : Number(financialInfo?.currentValuation) || 0;
  const fullOwnershipQuantity = investmentDetails?.totalToken || 0;

  const initialValues = {
    committedCapital: tokenDetails?.listingType === 'Full Ownership' ? currentValuation : '',
    quantity: tokenDetails?.listingType === 'Full Ownership' ? fullOwnershipQuantity : '',
    method: cryptoEnable ? 'USDT' : 'INR',
    tnc: false,
    useReferral: false,
    confirm: false,
  };

  const { fetchAmount } = useGetAmount();
  const { usdtPrice } = useUsdtPrice();
  const [userWalletBalance, setUserWalletBalance] = useState<any>({});
  const navigate = useNavigate();
  const PreviewModalInstance = useModal('PreviewModal');
  const CreateOrderModalInstance = useModal('CreateOrderModal');
  const availableTokens =
    investmentDetails?.totalToken - investmentDetails?.tokenSold;
  const minInvestment = tokenDetails?.minInvestment;

  const [
    uploadedDocumentPath,
    setUploadedDocumentPath
  ] = useState<string | null>(
    // '91c801631e5049e393a02fa4ceca79fe/ordersignature/91c801631e5049e393a02fa4ceca79fe.pdf'
    null
  );
  const previewPayloadRef = useRef<any>(null);

  const validationSchema = useMemo(() => {
    const schema: any = {
      method: Yup.string().required('Method is required'),
      tnc: Yup.boolean().oneOf([true], 'You must accept Privacy Policy & Terms'),
      confirm: Yup.boolean().oneOf([true], 'You must confirm order information'),
    };

    const inrBalance = Number(userWalletBalance?.inrBalance) || 0;
    const usdtBalance = Number(userWalletBalance?.usdtBalance) || 0;
    const referralBalance = Number(userWalletBalance?.referralBalance) || 0;
    const applicableFee = Number(financialInfo?.platformFee) || 0;

    if (tokenDetails?.listingType !== 'Full Ownership') {
      schema.committedCapital = Yup.number()
        // .typeError('Must be a number')
        // .moreThan(0, 'Cannot be 0')
        .test('wallet-balance-check', 'Insufficient balance', function (value) {
          if (!value) return true;

          const committedCapital = Number(value);
          const { useReferral, method } = this.parent;
          const isUSDT = method === 'USDT';
          if (isUSDT && !usdtPrice) return true;

          if (isUSDT) {
            const capitalInUsdt = committedCapital / (usdtPrice || 1); // INR → USDT
            if (!useReferral) {
              if (capitalInUsdt > usdtBalance) {
                return this.createError({
                  message: `Insufficient USDT wallet balance. Required: ${formatUSDT(capitalInUsdt) || '0'} USDT`,
                });
              }
              return true;
            }
            const payoutInInr =
              committedCapital * 0.25 < referralBalance
                ? committedCapital * 0.25
                : referralBalance;
            const remainingInr = committedCapital - payoutInInr;
            const remainingUsdtRequired = remainingInr / (usdtPrice || 1);

            if (usdtBalance < remainingUsdtRequired) {
              return this.createError({
                message: `Insufficient USDT balance. Need at least ${formatUSDT(remainingUsdtRequired) || '0'} USDT`,
              });
            }

            return true;
          }
          const feeAmount = useReferral
            ? 0
            : (committedCapital * applicableFee) / 100;
          if (!useReferral) {
            const totalPayable = committedCapital + feeAmount;

            if (totalPayable > inrBalance) {
              return this.createError({
                message: `Insufficient INR wallet balance. Required: ${formatCurrency(totalPayable)}`,
              });
            }
            return true;
          }
          const payout =
            committedCapital * 0.25 < referralBalance
              ? committedCapital * 0.25
              : referralBalance;

          const remainingInrRequired = committedCapital - payout + feeAmount;

          if (inrBalance < remainingInrRequired) {
            return this.createError({
              message: `Insufficient INR balance. Need at least ${formatCurrency(remainingInrRequired)}`,
            });
          }

          return true;
        });

      let customMinMessage = '';

      if (availableTokens < minInvestment) {
        customMinMessage = `Due to limited stocks you need to buy all the remaining ${availableTokens} tokens.`;
      } else customMinMessage = '';

      let newMinInvestment =
        availableTokens < minInvestment ? availableTokens : minInvestment;
      let newMaxInvestment =
        availableTokens < tokenDetails?.maxInvestment
          ? availableTokens
          : tokenDetails?.maxInvestment;

      schema.quantity = Yup.number()
        .typeError('Must be a number')
        .required('Quantity is required')
        .moreThan(0, 'Cannot be 0')
        .min(
          newMinInvestment,
          customMinMessage
            ? customMinMessage
            : `Minimum quantity is ${newMinInvestment || 1}`
        )

        .test('custom-max-message', function (value) {
          if (
            value > tokenDetails?.maxInvestment &&
            tokenDetails.maxInvestment < availableTokens
          ) {
            return this.createError({
              message: `Maximum quantity is ${newMaxInvestment}`,
            });
          } else if (value > availableTokens) {
            return this.createError({
              message: `Maximum available quantity is ${newMaxInvestment}`,
            });
          }
          return true;
        });
    }
    if (tokenDetails?.listingType === 'Full Ownership') {
      schema.committedCapital = Yup.number()
        .typeError('Must be a number')
        .moreThan(0, 'Cannot be 0')
        .test('full-ownership-balance', 'Insufficient balance', function () {
          const { useReferral, method } = this.parent;
          const isUSDT = method === 'USDT';
          if (isUSDT && !usdtPrice) return true;

          const equityEnable = store.getState().user.equityEnable;
          const currentValuation =
            Number(
              equityEnable
                ? financialInfo?.companyValuation
                : financialInfo?.currentValuation
            ) || 0;

          if (isUSDT) {
            const valuationInUsdt = currentValuation / (usdtPrice || 1); // INR → USDT
            if (!useReferral) {
              if (valuationInUsdt > usdtBalance) {
                return this.createError({
                  message: `Insufficient USDT wallet balance. Required: ${formatUSDT(valuationInUsdt) || '0'} USDT`,
                });
              }
              return true;
            }
            const referralUsedInInr = Math.min(referralBalance, currentValuation);
            const remainingInr = currentValuation - referralUsedInInr;
            const remainingUsdtRequired = remainingInr / (usdtPrice || 1);

            if (usdtBalance < remainingUsdtRequired) {
              return this.createError({
                message: `Insufficient USDT balance. Need at least ${formatUSDT(remainingUsdtRequired) || '0'} USDT`,
              });
            }

            return true;
          }

          // ----- INR FLOW (existing behaviour) -----
          const ownershipFee = useReferral
            ? 0
            : (currentValuation * applicableFee) / 100;
          if (!useReferral) {
            const totalPayable = currentValuation + ownershipFee;

            if (inrBalance < totalPayable) {
              return this.createError({
                message: `Insufficient INR balance. Required: ${formatCurrency(totalPayable)}`,
              });
            }
            return true;
          }
          const referralUsed = Math.min(referralBalance, currentValuation);

          const remainingInrRequired =
            currentValuation - referralUsed + ownershipFee;

          if (inrBalance < remainingInrRequired) {
            return this.createError({
              message: `Insufficient INR balance. Need at least ${formatCurrency(remainingInrRequired)}`,
            });
          }

          return true;
        });
    }

    return Yup.object().shape(schema);
  }, [
    tokenDetails?.listingType,
    userWalletBalance,
    financialInfo?.platformFee,
    financialInfo?.currentValuation,
    financialInfo?.companyValuation,
    usdtPrice,
  ]);

  const loadBankAmount = useCallback(async () => {
    try {
      const res = await fetchAmount();
      if (res?.success && res?.data) {
        setUserWalletBalance(res?.data?.portfolio);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  }, [fetchAmount]);

  useEffect(() => {
    loadBankAmount();
  }, [loadBankAmount]);

  const onSubmit = (values: any) => {
    console.log('Form values submitted:', values);
  };

  useEffect(() => {
    if (!uploadedDocumentPath) return;
    PreviewModalInstance.show({
      ...previewPayloadRef.current,
      uploadedDocumentPath,
      closePreviewModal: () => PreviewModalInstance.remove(),
    });
  }, [uploadedDocumentPath]);

  return (
    <div className="create_order_info">
      <Formik
        initialValues={initialValues}
        validateOnChange
        validateOnBlur
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isValid,
          resetForm,
          setFieldValue,
          setFieldTouched,
          validateField,
        }) => {
          const investmentTokens = cryptoEnable
            ? [
                {
                  value: 'USDT',
                  label: (
                    <div className="payment_method">
                      <UsdtIcon />
                      <div className="payment_method_inner">
                        <h6>USDT</h6>
                        <span>
                          Available Balance{' '}
                          {formatUSDTWithCommas(userWalletBalance?.usdtBalance || 0) || '0'} USDT
                        </span>
                      </div>
                    </div>
                  ),
                },
              ]
            : [
                {
                  value: 'INR',
                  label: (
                    <div className="payment_method">
                      <BankIcon />
                      <div className="payment_method_inner">
                        <h6>INR</h6>
                        <span>
                          Available Balance{' '}
                          {formatCurrency(userWalletBalance?.inrBalance || 0)}
                        </span>
                      </div>
                    </div>
                  ),
                },
              ];

          return (
            <Form onSubmit={handleSubmit}>
              <Row>
                {tokenDetails?.listingType !== 'Full Ownership' && (
                  <>
                    <Col sm={6}>
                      <FormControl
                        label="Quantity"
                        name="quantity"
                        type="text"
                        placeholder="Quantity"
                        value={values.quantity}
                        maxLength={20}
                        onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;

                          // Allow empty string
                          if (value === '') {
                            await setFieldValue('quantity', '', true);
                            await setFieldValue('committedCapital', 0, true);
                            return;
                          }
                          if (value === '0') {
                            await setFieldValue('quantity', '0', true);
                            await setFieldValue('committedCapital', 0, true);
                            await setFieldTouched('quantity', true, true);
                            await validateField('quantity');
                            return;
                          }
                          if (/^0{2,}$/.test(value)) {
                            return;
                          }
                          if (/^\d*$/.test(value)) {
                            const cleanedValue = value.replace(/^0+/, '') || value;
                            const numericValue = Number(cleanedValue);
                            const equityEnable = store.getState().user.equityEnable;
                            const rawPricePerToken = Number(
                              equityEnable
                                ? tokenDetails?.tokenPrice
                                : tokenDetails?.pricePerToken
                            );
                            const priceInPaise = Math.round(rawPricePerToken * 100);
                            const totalInPaise = numericValue * priceInPaise;
                            const newCommittedCapital =
                              totalInPaise > 0 ? totalInPaise / 100 : 0;
                            await setFieldValue('quantity', cleanedValue, true);
                            await setFieldValue(
                              'committedCapital',
                              newCommittedCapital,
                              true
                            );

                            await setFieldTouched('quantity', true, true);
                            await validateField('quantity');
                          }
                        }}
                        onFocus={() => setFieldTouched('quantity', true, true)}
                        onBlur={async (e: React.FocusEvent<HTMLInputElement>) => {
                          handleBlur(e);
                          await validateField('quantity');
                        }}
                        error={
                          touched.quantity && errors.quantity ? errors.quantity : ''
                        }
                        autoComplete="off"
                      />
                    </Col>

                    <Col sm={6}>
                      <FormControl
                        label="Committed capital"
                        name="committedCapital"
                        type="text"
                        placeholder="Committed capital"
                        value={(() => {
                          const committedInInr = Number(values.committedCapital) || 0;
                          const isUSDT = values.method === 'USDT';

                          if (isUSDT && usdtPrice) {
                            const capitalInUsdt = committedInInr / usdtPrice;
                            return `${formatUSDTWithCommas(capitalInUsdt)} USDT`;
                          }

                          return committedInInr ? formatCurrency(committedInInr) : '';
                        })()}
                        readOnly
                        bottomTitle={
                          <>
                            <h6 className="mb-2">
                              Min Commitment:{' '}
                              <span>
                                {(() => {
                                  const base =
                                    tokenDetails?.minInvestment *
                                    (store.getState().user.equityEnable
                                      ? tokenDetails?.tokenPrice
                                      : tokenDetails?.pricePerToken);
                                  const isUSDT = values.method === 'USDT';
                                  if (isUSDT && usdtPrice && base) {
                                    return `${formatUSDTWithCommas(base / usdtPrice)} USDT`;
                                  }
                                  return formatCurrency(base || 0) || '0.00';
                                })()}
                              </span>
                            </h6>
                            <h6>
                              Fee:{' '}
                              <span>
                                {`${financialInfo?.platformFee || 0}%`}
                              </span>
                            </h6>
                            <h6>
                              Amount Payable (after fee):{' '}
                              <span>
                                {(() => {
                                  const committedInInr =
                                    Number(values?.committedCapital) || 0;
                                  const isUSDT = values.method === 'USDT';
                                  const feePercent =
                                    Number(financialInfo?.platformFee) || 0;

                                  if (isUSDT && usdtPrice) {
                                    const capitalInUsdt = committedInInr / usdtPrice;
                                    const totalWithFee = capitalInUsdt * (1 + feePercent / 100);
                                    return `${formatUSDTWithCommas(totalWithFee)} USDT`;
                                  }

                                  return formatCurrency(
                                    committedInInr * (1 + feePercent / 100)
                                  );
                                })()}
                              </span>
                            </h6>
                          </>
                        }
                        onBlur={handleBlur}
                        error={errors.committedCapital}
                      />
                    </Col>
                  </>
                )}

                <FormControl
                  control="radio"
                  name="method"
                  type="radio"
                  options={investmentTokens}
                  value={values.method}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFieldValue('method', e.target.value);
                  }}
                  onBlur={handleBlur}
                  className="create_order_info_radio_group"
                  error={touched.method && errors.method ? errors.method : ''}
                />

                <Col xxl={5} md={6}>
                  <FormControl
                    control="checkbox"
                    name="useReferral"
                    className="referral_checkbox"
                    disabled={Number(userWalletBalance?.referralBalance) <= 0}
                    label={
                      <div className="referral_checkbox_label">
                        <RewardIcon />
                        <div className="referral_values">
                          <h6>Referral</h6>
                          <span>
                            Available Referral:{' '}
                            {(() => {
                              const referralInr =
                                Number(userWalletBalance?.referralBalance) || 0;
                              if (values.method === 'USDT' && usdtPrice) {
                                return (
                                  <span className="referral_usdt_amount">
                                    {formatUSDTWithCommas(referralInr / usdtPrice)}
                                    {'\u00A0'}
                                    USDT
                                  </span>
                                );
                              }
                              return formatCurrency(referralInr);
                            })()}
                          </span>
                          <span>
                            Claimable Referral:{' '}
                            {(() => {
                              const equityEnable =
                                store.getState().user.equityEnable;
                              const valuation = equityEnable
                                ? financialInfo?.companyValuation
                                : financialInfo?.currentValuation;

                              const claimableInr =
                                tokenDetails?.listingType === 'Full Ownership'
                                  ? Number(valuation || 0) * 0.25 <
                                    Number(userWalletBalance?.referralBalance)
                                    ? Number(valuation || 0) * 0.25
                                    : Number(userWalletBalance?.referralBalance)
                                  : Number(values.committedCapital) * 0.25 <
                                    Number(userWalletBalance?.referralBalance)
                                    ? Number(values.committedCapital) * 0.25
                                    : Number(userWalletBalance?.referralBalance);
                              if (values.method === 'USDT' && usdtPrice) {
                                return (
                                  <span className="referral_usdt_amount">
                                    {formatUSDTWithCommas(
                                      Number(claimableInr) / usdtPrice
                                    )}
                                    {'\u00A0'}
                                    USDT
                                  </span>
                                );
                              }
                              return formatCurrency(claimableInr);
                            })()}
                          </span>
                        </div>
                      </div>
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFieldValue('useReferral', e.target.checked)
                    }
                    checked={values.useReferral}
                  />
                </Col>

                <Col md={12}>
                  <div className="confirm_box mt-2">
                    <FormControl
                      control="checkbox"
                      name="tnc"
                      label={
                        <span>
                          I confirm that I have read{' '}
                          <a
                            href="https://landbitt.com/privacy-policy/"
                            rel="noopener noreferrer"
                            target="_blank"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            Privacy Policy
                          </a>{' '}
                          &{' '}
                          <a
                            href="https://landbitt.com/terms-of-use/"
                            rel="noopener noreferrer"
                            target="_blank"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            Terms of Service
                          </a>
                          .
                        </span>
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange({
                          target: {
                            name: 'tnc',
                            value: e.target.checked,
                          },
                        })
                      }
                      onBlur={handleBlur}
                      checked={values.tnc}
                      error={touched.tnc && errors.tnc}
                    />
                    <FormControl
                      control="checkbox"
                      name="confirm"
                      label="I confirm that I have reviewed the order information and that the information is correct.*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange({
                          target: {
                            name: 'confirm',
                            value: e.target.checked,
                          },
                        })
                      }
                      onBlur={handleBlur}
                      checked={values.confirm}
                      error={touched.confirm && errors.confirm}
                    />
                  </div>
                </Col>

                <Col md={5}>
                  <CommonButton
                    title="Proceed"
                    type="button"
                    className="w-100"
                    disabled={!(values.tnc && values.confirm && isValid)}
                    onClick={() => {
                      const applicableFee = Number(financialInfo?.platformFee) || 0;
                      const inrBalance = Number(userWalletBalance?.inrBalance) || 0;
                      const usdtBalance = Number(userWalletBalance?.usdtBalance) || 0;
                      const referralBalance =
                        Number(userWalletBalance?.referralBalance) || 0;
                      const committedCapital = Number(values.committedCapital) || 0;
                      const isUSDT = values.method === 'USDT';

                      if (tokenDetails?.listingType !== 'Full Ownership') {
                        if (isUSDT && usdtPrice) {
                          const capitalInUsdt = committedCapital / usdtPrice;
                          if (values.useReferral) {
                            const payoutInInr =
                              committedCapital * 0.25 < referralBalance
                                ? committedCapital * 0.25
                                : referralBalance;
                            const remainingInr = committedCapital - payoutInInr;
                            const remainingUsdtRequired = remainingInr / usdtPrice;

                            if (usdtBalance < remainingUsdtRequired) {
                              return Toast.error(
                                `Insufficient USDT balance. Need at least ${formatUSDT(remainingUsdtRequired) || '0'} USDT`
                              );
                            }
                          } else {
                            if (capitalInUsdt > usdtBalance) {
                              return Toast.error(
                                `Insufficient USDT wallet balance. Required: ${formatUSDT(capitalInUsdt) || '0'} USDT`
                              );
                            }
                          }
                        } else {
                          // INR case: with fee
                          const feeAmount = values.useReferral
                            ? 0
                            : (committedCapital * applicableFee) / 100;
                          if (values.useReferral) {
                            const payout =
                              committedCapital * 0.25 < referralBalance
                                ? committedCapital * 0.25
                                : referralBalance;
                            const remainingInrRequired =
                              committedCapital - payout + feeAmount;

                            if (inrBalance < remainingInrRequired) {
                              return Toast.error(
                                `Insufficient INR balance. Need at least ${formatCurrency(
                                  remainingInrRequired
                                )}`
                              );
                            }
                          } else {
                            const totalPayable = committedCapital + feeAmount;

                            if (totalPayable > inrBalance) {
                              return Toast.error(
                                `Insufficient INR wallet balance. Required: ${formatCurrency(
                                  totalPayable
                                )}`
                              );
                            }
                          }
                        }
                      }
                      if (tokenDetails?.listingType === 'Full Ownership') {
                        const equityEnable = store.getState().user.equityEnable;
                        const currentValuation =
                          Number(
                            equityEnable
                              ? financialInfo?.companyValuation
                              : financialInfo?.currentValuation
                          ) || 0;

                        if (isUSDT && usdtPrice) {
                          const valuationInUsdt = currentValuation / usdtPrice;
                          if (values.useReferral) {
                            const referralUsedInInr = Math.min(
                              referralBalance,
                              currentValuation
                            );
                            const remainingInr = currentValuation - referralUsedInInr;
                            const remainingUsdtRequired = remainingInr / usdtPrice;

                            if (usdtBalance < remainingUsdtRequired) {
                              return Toast.error(
                                `Insufficient USDT balance. Need at least ${formatUSDT(remainingUsdtRequired) || '0'} USDT`
                              );
                            }
                          } else {
                            if (valuationInUsdt > usdtBalance) {
                              return Toast.error(
                                `Insufficient USDT wallet balance. Required: ${formatUSDT(valuationInUsdt) || '0'} USDT`
                              );
                            }
                          }
                        } else {
                          // INR case: with fee
                          const ownershipFee = values.useReferral
                            ? 0
                            : (currentValuation * applicableFee) / 100;

                          if (values.useReferral) {
                            const referralUsed = Math.min(
                              referralBalance,
                              currentValuation
                            );
                            const remainingInrRequired =
                              currentValuation - referralUsed + ownershipFee;

                            if (inrBalance < remainingInrRequired) {
                              return Toast.error(
                                `Insufficient INR balance. Need at least ${formatCurrency(
                                  remainingInrRequired
                                )}`
                              );
                            }
                          } else {
                            const totalPayable = currentValuation + ownershipFee;
                            if (inrBalance < totalPayable) {
                              return Toast.error(
                                `Insufficient INR balance. Required: ${formatCurrency(
                                  totalPayable
                                )}`
                              );
                            }
                          }
                        }
                      }

                      // PreviewModalInstance.show({
                      //   closePreviewModal: () => PreviewModalInstance.remove(),
                      //   committedCapital: values?.committedCapital,
                      //   quantity: values?.quantity,
                      //   method: values?.method,
                      //   useReferral: values.useReferral,
                      //   fee: applicableFee,
                      //   investedAmount: values.committedCapital,
                      //   propertyId: store.getState().user.equityEnable ? tokenDetails?.equityId : tokenDetails?.propertyId,
                      //   listingType: tokenDetails?.listingType,
                      //   tickers: tickers,
                      //   currentValuation: store.getState().user.equityEnable ? financialInfo?.companyValuation : financialInfo?.currentValuation,
                      //   financialInfo: financialInfo,
                      //   resetForm,
                      //   navigate,
                      //   onOrderSuccess,
                      //   loadBankAmount: async () => {
                      //     await loadBankAmount();
                      //   },
                      //   uploadedDocumentPath,
                      // });


                      {/* Commented code for signature modal, we will use this later */ }
                      const payload = {
                        propertyDetails,
                        ...(store.getState().user.equityEnable && propertyDetails?.equityName
                          ? { equityName: propertyDetails.equityName }
                          : {}),
                        closeCreateOrderModal: () => CreateOrderModalInstance.remove(),
                        committedCapital: values?.committedCapital,
                        quantity: values?.quantity,
                        method: values?.method,
                        useReferral: values.useReferral,
                        fee: applicableFee,
                        investedAmount: values?.committedCapital,
                        propertyId: store.getState().user.equityEnable
                          ? tokenDetails?.equityId
                          : tokenDetails?.propertyId,
                        listingType: tokenDetails?.listingType,
                        tickers,
                        currentValuation: store.getState().user.equityEnable
                          ? financialInfo?.companyValuation
                          : financialInfo?.currentValuation,
                        financialInfo,
                        resetForm,
                        navigate,
                        onOrderSuccess,
                        loadBankAmount: async () => {
                          await loadBankAmount();
                        },
                        setUploadedDocumentPath: (path: string) =>
                          setUploadedDocumentPath(path),
                      };

                      previewPayloadRef.current = payload;

                      CreateOrderModalInstance.show(payload);
                      {/* Commented code for signature modal */ }

                    }}
                  />
                </Col>
              </Row>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default OrderInformation;
