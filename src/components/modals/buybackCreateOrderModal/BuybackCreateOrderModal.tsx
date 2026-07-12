import NiceModal from '@ebay/nice-modal-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useModalBackClose } from '../../../hooks/useModalBackClose';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import CommonModal from '../CommonModal';
import InputField from '../../formik/inputField/InputField';
import CommonButton from '../../ui/commonButton/CommonButton';
// import SelectField from '../../formik/selectField/SelectField';
import Toast from '../../common/Toast';
import { useModal } from '@ebay/nice-modal-react';

import './BuybackCreateOrderModal.scss';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { useUsdtPrice } from '../../../hooks/useUsdtPrice';
import { callPostMethod } from '../../../redux/Actions/api.action';

// const METHOD_OPTIONS = [
//   { value: 'INR', label: 'INR' },
//   { value: 'USDT', label: 'USDT' },
// ];

// const FEE_PERCENTAGE = 1;

interface BuybackCreateOrderModalProps {
  closeBuybackCreateOrderModal: () => void;
  buybackData?: {
    buybackRequestId?: string;
    propertyName?: string;
    buybackPrice?: string | number;
    rawBuybackPrice?: number;
    buybackPercentage?: any;
    userAvailableTokenBalance?: number;
    remainingTokens?: number;
    buybackTokens?: number;
    /** Average purchase price per token (INR) from backend, used for P/L */
    averagePricePerToken?: number;
  };
  onOrderSuccess?: () => void;
  /** Called when create-request API fails so parent can refresh list */
  onOrderError?: () => void;
}

const BuybackCreateOrderModal = NiceModal.create(
  ({
    closeBuybackCreateOrderModal,
    buybackData,
    onOrderSuccess,
    onOrderError,
  }: BuybackCreateOrderModalProps) => {
    const dispatch = useDispatch();
    const cryptoEnable = useSelector(
      (state: RootState) => state.user.profile?.cryptoEnable
    );
    const shouldRefreshBuyback = useSelector(
      (state: RootState) => state.wallet?.shouldRefreshBuyback
    );
    const { usdtPrice } = useUsdtPrice();
    const CongratulationsModal = useModal('CongratulationsModal');
    const closeCongratulationsModal = useCallback(() => {
      CongratulationsModal.remove();
    }, [CongratulationsModal]);

    const handleBackClose = useModalBackClose(closeBuybackCreateOrderModal);

    
    useEffect(() => {
      if (shouldRefreshBuyback) {
        closeBuybackCreateOrderModal();
      }
    }, [shouldRefreshBuyback, closeBuybackCreateOrderModal]);

    const parseTokenBalance = (value: unknown): number => {
      const n = Number(value);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    };

    const rawBuybackPrice = Number(buybackData?.rawBuybackPrice ?? 0) || 1;
    const userAvailableTokenBalance = parseTokenBalance(
      buybackData?.userAvailableTokenBalance
    );
    const remainingTokens = parseTokenBalance(buybackData?.remainingTokens);
    // Max sellable = min of user balance and remaining tokens for this buyback request.
    // If no remaining limit from API, use full user balance.
    const maxSellable =
      remainingTokens > 0
        ? Math.min(userAvailableTokenBalance, remainingTokens)
        : userAvailableTokenBalance;
    const buybackRequestId = buybackData?.buybackRequestId ?? '';
    const buybackPercentage =
      buybackData?.buybackPercentage != null
        ? Number(buybackData?.buybackPercentage)
        : 0;
    // Average purchase price per token (INR) provided by backend
    const averagePrice = Number(buybackData?.averagePricePerToken ?? 0) || 0;

    const getBuybackPriceDisplay = useCallback(
      (method: string) => {
        if (rawBuybackPrice <= 0) return '—';
        if (method === 'USDT' && usdtPrice && usdtPrice > 0) {
          const usdtValue = rawBuybackPrice / usdtPrice;
          return `${usdtValue.toFixed(6)} USDT`;
        }
        return `${Number(rawBuybackPrice).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} INR`;
      },
      [rawBuybackPrice, usdtPrice]
    );

    const initialValues = {
      token: '',
      method: (cryptoEnable ? 'USDT' : 'INR') as string,
      confirm: false,
    };

    const validationSchema = useMemo(
      () =>
        Yup.object({
          token: Yup.number()
            .required('Token quantity is required')
            .min(0.01, 'Minimum 0.01 token')
            .max(
              maxSellable,
              maxSellable > 0
                ? `Maximum ${maxSellable.toLocaleString()} tokens (remaining for this request)`
                : 'No tokens available to sell for this request'
            )
            .test({
              name: 'max-decimals',
              // message: 'Token: max 2 decimals for INR, max 6 for USDT',
              test(value) {
                if (value == null || (typeof value === 'number' && Number.isNaN(value))) return true;
                const method = this.parent?.method ?? 'INR';
                const dec = (String(value).split('.')[1] || '').length;
                if (method === 'USDT') return dec <= 6;
                return dec <= 2;
              },
            }),
          method: Yup.string().required('Method is required'),
        }),
      [maxSellable]
    );

    // Gross: buybackPrice * quantity. Amount you get = gross * (1 - fee%/100)
    const getAmountToReceive = useCallback(
      (quantity: number, method: string) => {
        const qty = quantity || 0;
        const grossInr = rawBuybackPrice * qty;
        const afterFeeInr = grossInr * (1 - buybackPercentage / 100);
        if (method === 'USDT' && usdtPrice && usdtPrice > 0) {
          const grossUsdt = grossInr / usdtPrice;
          const afterFeeUsdt = grossUsdt * (1 - buybackPercentage / 100);
          return {
            value: afterFeeUsdt,
            gross: grossUsdt,
            feeAmount: grossUsdt - afterFeeUsdt,
            method: 'USDT',
          };
        }
        return {
          value: afterFeeInr,
          gross: grossInr,
          feeAmount: grossInr - afterFeeInr,
          method: 'INR',
        };
      },
      [rawBuybackPrice, usdtPrice, buybackPercentage]
    );

    const getProfitLoss = useCallback(
      (quantity: number, method: string) => {
        const qty = quantity || 0;
        if (averagePrice <= 0 || rawBuybackPrice <= 0 || qty <= 0) {
          return null;
        }

        const costInr = averagePrice * qty;
        const formattedBuybackPrice = (method === 'USDT' && usdtPrice && usdtPrice> 0) ? rawBuybackPrice / usdtPrice : rawBuybackPrice;
        const saleGrossInr = formattedBuybackPrice * qty;
        // Calculate net sale amount after fees (same as amount you get)
        const saleNetInr = saleGrossInr * (1 - buybackPercentage / 100);
        // Profit/Loss = Net Sale Amount - Cost (fees already deducted)
        const plInr = saleNetInr - costInr;

        // When method is USDT, convert P/L to USDT for display
        if (method === 'USDT' && usdtPrice && usdtPrice > 0) {
          return { value: plInr, method: 'USDT' as const };
        }

        return { value: plInr, method: 'INR' as const };
      },
      [averagePrice, rawBuybackPrice, usdtPrice, buybackPercentage]
    );

    const onSubmit = async (values: any) => {
      if (!buybackRequestId) {
        Toast.error('Invalid buyback request.');
        return;
      }
      try {
        const res = await callPostMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.POST.BUYBACK_CREATE_REQUEST,
          showToaster: false,
          dispatch,
          data: {
            buybackRequestId,
            tokenQuantity: Number(values?.token),
            method: values?.method,
          },
          showLoader: true,
          showButtonLoader: false,
          buttonKey: 'bankAccbn',
          token: true,
        });

        if (res?.success) {
          closeBuybackCreateOrderModal();
          onOrderSuccess?.();
          CongratulationsModal.show({
            title: 'Congratulations!',
            description: 'Your order has been created successfully!',
            btntitle: 'Done',
            closeCongratulationsModal,
          });
        } else {
          Toast.error(res?.message);
          onOrderError?.();
          closeBuybackCreateOrderModal();
        }
      } catch (err: any) {
        Toast.error(
          err?.response?.data?.message ??
            err?.message ??
            'Failed to create buyback request'
        );
        onOrderError?.();
        closeBuybackCreateOrderModal();
      }
    };

    return (
      <CommonModal
        show
        onHide={handleBackClose}
        heading="Create Order - Buyback Request"
        className="buyback_modal"
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ values, errors, setFieldValue, isValid }) => {
            const quantity = Number(values.token) || 0;
            const amountInfo = getAmountToReceive(quantity, values.method);
            const amountValue =
              amountInfo.method === 'USDT'
                ? amountInfo.value.toFixed(6)
                : amountInfo.value.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
            const currencyCode = amountInfo.method === 'USDT' ? 'USDT' : 'INR';
            const profitLoss = getProfitLoss(quantity, values.method);
            const plRaw = profitLoss?.value ?? 0;
            const isProfit = plRaw > 0;
            const isLoss = plRaw < 0;
            const absPl = Math.abs(plRaw);
            const isUsdtMethod =
              values.method === 'USDT' || profitLoss?.method === 'USDT';
            const plFormatted = isUsdtMethod
              ? absPl.toFixed(6)
              : absPl.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
            const plSign = plRaw > 0 ? '+' : plRaw < 0 ? '-' : '';
            const plCurrencySymbol = isUsdtMethod ? 'USDT' : '₹';

            return (
              <Form>
                <div className="modal_body">
                  <Row>
                    <Col md={12}>
                      <div className="input_with_max">
                        <InputField
                          label="Token to sell"
                          name="token"
                          type="number"
                          placeholder="0"
                          value={values.token}
                          step={
                            values.method === 'USDT' ? '0.000001' : '0.01'
                          }
                          onChange={(e) =>
                            setFieldValue('token', e.target.value)
                          }
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (v === '' || v == null) return;
                            const num = Number(v);
                            if (!Number.isFinite(num)) return;
                            const decimals =
                              values.method === 'USDT' ? 6 : 2;
                            const rounded = Number(num.toFixed(decimals));
                            if (rounded !== num) {
                              setFieldValue('token', String(rounded));
                            }
                          }}
                          error={errors.token}
                        />
                        <button
                          type="button"
                          className="max_btn"
                          disabled={maxSellable <= 0}
                          onClick={() =>
                            maxSellable > 0 &&
                            setFieldValue('token', String(maxSellable))
                          }
                        >
                          MAX
                        </button>
                      </div>
                      <div className="available_text">
                        Available token: {userAvailableTokenBalance.toLocaleString()}
                        {' · '}
                        (Max you can sell: {maxSellable.toLocaleString()})
                        {' · '}
                      </div>
                    </Col>

                    <Col md={12}>
                      <div className="buyback_price_method_row">
                        <label className="form-label">Buyback Price</label>
                        <div className="buyback_price_method_input">
                          <div className="buyback_price_display">
                            {getBuybackPriceDisplay(values.method)}
                          </div>
                          {/* <SelectField
                            name="method"
                            options={METHOD_OPTIONS}Create Order - Buyback Request
                            value={
                              METHOD_OPTIONS.find(
                                (o) => o.value === values.method
                              ) ?? METHOD_OPTIONS[0]
                            }
                            onChange={(option: any) =>
                              setFieldValue('method', option?.value ?? 'INR')
                            }
                          /> */}
                        </div>
                      </div>
                    </Col>

                    <Col md={12}>
                      <div className="amount_you_get_row">
                        <label className="form-label">Amount you get</label>
                        <div className="amount_you_get_display">
                          <span className="amount_value">{amountValue}</span>
                          <span className="amount_currency">{currencyCode}</span>
                        </div>
                      </div>
                      <p
                        className={`profit_loss_inline ${isProfit ? 'profit' : ''} ${isLoss ? 'loss' : ''}`}
                      >
                        Profit / Loss:{' '}
                        {profitLoss ? (
                          isUsdtMethod ? (
                            <>
                              {plSign}
                              {plFormatted} USDT
                            </>
                          ) : (
                            <>
                              {plSign}
                              {plCurrencySymbol}
                              {plFormatted}
                            </>
                          )
                        ) : isUsdtMethod ? (
                          '0.000000 USDT'
                        ) : (
                          '₹0.00'
                        )}
                      </p>
                      <div className="fee_text">
                        {amountInfo.method === 'USDT' ? (
                          <>
                            Fee Amount: {buybackPercentage}% (
                            {amountInfo.feeAmount.toFixed(6)} USDT)
                          </>
                        ) : (
                          <>
                            Fee Amount: {buybackPercentage}% (₹
                            {amountInfo.feeAmount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            )
                          </>
                        )}
                      </div>
                    </Col>

                    {/* <Col md={12}>
                      <div className="confirm_box">
                        <input
                          type="checkbox"
                          checked={values.confirm}
                          onChange={(e) =>
                            setFieldValue('confirm', e.target.checked)
                          }
                        />
                      </div>
                      {errors.confirm && (
                        <p className="error_text">{errors.confirm}</p>
                      )}
                    </Col> */}
                  </Row>
                </div>

                <div className="modal_footer">
                  <CommonButton
                    text="Submit"
                    type="submit"
                    disabled={!isValid || maxSellable <= 0}
                    className="submit_btn"
                  />
                </div>
              </Form>
            );
          }}
        </Formik>
      </CommonModal>
    );
  }
);

export default BuybackCreateOrderModal;
