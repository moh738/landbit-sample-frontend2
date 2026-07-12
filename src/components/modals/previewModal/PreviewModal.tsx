import NiceModal, { useModal } from '@ebay/nice-modal-react';
import CommonButton from '../../ui/commonButton/CommonButton';
import CommonModal from '../CommonModal';
import { Col, Row } from 'react-bootstrap';
import { useCallback, useMemo } from 'react';
import { QuestionIcon } from '../../../assets/icons/SvgIcon';
import './PreviewModal.scss';
import Toast from '../../common/Toast';
import { callPostMethod } from '../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../services/api.service';
import { API_ENDPOINTS } from '../../../constants/apis/apiEndpoints';
import { useDispatch, useSelector } from 'react-redux';
import { formatCurrency, formatWithCommas, balanceFormatWithoutRoundOffCrypto, formatUSDTWithCommas } from '../../../helpers/user/maskEmail';
import store from '../../../redux/Store';
import { useUsdtPrice } from '../../../hooks/useUsdtPrice';

interface PreviewModalProps {
  closePreviewModal: () => void;
  financialInfo: any;
  committedCapital: string | number;
  quantity: string | number;
  method: string;
  fee?: string | number;
  currentValuation?: string | number | undefined;
  investedAmount?: string | number;
  propertyId: string;
  resetForm?: () => void;
  onOrderSuccess?: () => void;
  loadBankAmount?: () => void;
  navigate?: (path: string) => void;
  listingType?: 'Full Ownership' | 'Fractional Ownership' | string;
  tickers: any;
  useReferral?: boolean;
  uploadedDocumentPath?: string;
}

const PreviewModal = NiceModal.create(
  ({
    closePreviewModal,
    committedCapital,
    financialInfo,
    quantity,
    method,
    fee,
    investedAmount,
    propertyId,
    resetForm,
    onOrderSuccess,
    loadBankAmount,
    navigate,
    listingType,
    tickers,
    useReferral,
    currentValuation,
    uploadedDocumentPath,
  }: PreviewModalProps) => {
    const CongratulationsModal = useModal('CongratulationsModal');
    const closeCongratulationsModal = useCallback(() => {
      CongratulationsModal.remove();
    }, [CongratulationsModal]);
    const dispatch = useDispatch();
    const AlertModal = useModal('AlertModal');
    const closeAlertModal = useCallback(() => {
      AlertModal.remove();
    }, [AlertModal]);

    const { cryptoEnable } = useSelector(
      (state: RootState) => state?.user?.profile
    );
    const { usdtPrice } = useUsdtPrice();

    // Helper function to format amount based on cryptoEnable
    const formatAmount = useCallback((inrValue: number | string | undefined | null): string => {
      if (cryptoEnable && usdtPrice && usdtPrice > 0) {
        const numValue = Number(inrValue) || 0;
        const usdtValue = numValue / usdtPrice;
        const formatted = balanceFormatWithoutRoundOffCrypto(usdtValue);
        return `${formatted} USDT`;
      }
      // INR case
      if (inrValue == null || inrValue === '') return '₹0.00';
      return formatCurrency(Number(inrValue) || 0);
    }, [cryptoEnable, usdtPrice]);

    // Helper function to format amount with commas for large numbers
    const formatAmountWithCommas = useCallback((inrValue: number | string | undefined | null): string => {
      if (cryptoEnable && usdtPrice && usdtPrice > 0) {
        const numValue = Number(inrValue) || 0;
        const usdtValue = numValue / usdtPrice;
        return `${formatUSDTWithCommas(usdtValue)} USDT`;
      }
      // INR case
      if (inrValue == null || inrValue === '') return '₹0';
      return `₹${formatWithCommas(inrValue)}`;
    }, [cryptoEnable, usdtPrice]);

    const { previewDetail, totalPayableValue } = useMemo(() => {
      const platformFee = financialInfo?.platformFee || 0;
      if (listingType === 'Full Ownership') {
        const capitalNum = Number(currentValuation ?? 0);
        const capitalValue = formatAmountWithCommas(capitalNum);
        const feeAmountInr = capitalNum * (platformFee / 100);
        const feeAmountValue = formatAmount(feeAmountInr);
        const totalPayableInr = capitalNum + feeAmountInr;
        const totalPayableValue = formatAmount(totalPayableInr);

        const detail = [
          { title: 'Pay with', value: method },
          { title: 'Quantity', value: '1' },
          { title: 'Committed Capital', value: capitalValue },
          { title: 'Fee', value: `${fee}%` },
          { title: 'Fee Amount', value: feeAmountValue },
        ];
        return { previewDetail: detail, totalPayableValue };
      } else {
        const capitalNum = Number(committedCapital);
        const capitalValue = formatAmountWithCommas(committedCapital);
        const feeAmountInr = capitalNum * (platformFee / 100);
        const feeAmountValue = formatAmount(feeAmountInr);
        const totalPayableInr = capitalNum + feeAmountInr;
        const totalPayableValue = formatAmount(totalPayableInr);

        const detail = [
          { title: 'Pay with', value: method },
          { title: 'Quantity', value: `${quantity} ${tickers}` },
          { title: 'Committed Capital', value: capitalValue },
          { title: 'Fee', value: `${fee}%` },
          { title: 'Fee Amount', value: feeAmountValue },
        ];
        return { previewDetail: detail, totalPayableValue };
      }
    }, [listingType, method, quantity, tickers, committedCapital, currentValuation, fee, financialInfo?.platformFee, formatAmount, formatAmountWithCommas]);

    return (
      <CommonModal
        className="previewModal"
        heading={"Preview"}
        show
        onHide={closePreviewModal}
      >
        {/* <h4>Preview</h4> */}
        {listingType === 'Fractional Property' && (
          <div className="preview_head">
            <span>Proposed Investment</span>
            <h3>{formatAmountWithCommas(investedAmount)}</h3>
          </div>
        )}
        {listingType === 'Full Ownership' && (
          <div className="preview_head">
            <span>
              {store.getState().user.equityEnable
                ? 'Company Valuation'
                : 'Current Valuation'}
            </span>
            <h3>{formatAmountWithCommas(currentValuation ?? 0)}</h3>
          </div>
        )}
        <div className="preview_body">
          <ul>
            {previewDetail?.map((item, index) => (
              <li key={index}>
                <span>{item.title}</span>
                <h5>{item.value}</h5>
              </li>
            ))}
          </ul>
          <div className="preview_total">
            <span>Total Payable (including all fees)</span>
            <strong>{totalPayableValue}</strong>
          </div>
        </div>
        <Row>
          <Col xs={12} sm={6} className="mb-4 mb-sm-0">
            <CommonButton
              title="Cancel"
              fluid
              className="btn-secondry"
              onClick={closePreviewModal}
            />
          </Col>
          <Col xs={12} sm={6}>
            <CommonButton
              title="Continue"
              fluid
              onClick={() => {
                AlertModal.show({
                  closeAlertModal,
                  icon: <QuestionIcon />,
                  heading: 'Are You Sure?',
                  subheading: 'You want to place this order',
                  btntext: 'No',
                  btntextclassName: 'btn-secondry',
                  btncountinue: 'Yes',
                  btntextOnClick: closeAlertModal,
                  btncountinueOnClick: async () => {
                    closeAlertModal();

                    try {
                      const payload = {
                        propertyId: propertyId,
                        quantity: quantity || '',
                        method: method,
                        referral: useReferral,
                        orderSignature: uploadedDocumentPath,
                      };
                      const res = await callPostMethod({
                        apiUrl: landbitBackendUrl,
                        endpoint: API_ENDPOINTS.POST.CREATE_ORDER,
                        data: payload,
                        showToaster: true,
                        dispatch,
                        showLoader: true,
                        showButtonLoader: true,
                        buttonKey: 'changePasswordBtn',
                        token: true,
                      });
                      if (res?.success) {
                        const equityEnable = store.getState().user.equityEnable;
                        if (equityEnable) {
                          if (navigate) navigate('/user/my-orders?tab=pending');

                          if (loadBankAmount) await loadBankAmount();

                          CongratulationsModal.show({
                            title: 'Congratulations!',
                            description:
                              'Your order has been submitted and will take 3 to 5 working days for approval. Thank you for your patience!',
                            btntitle: 'Done',
                            closeCongratulationsModal,

                            onClick: () => {
                              if (resetForm) resetForm();
                              if (onOrderSuccess) onOrderSuccess();
                            },
                          });
                          return;
                        }
                        if (financialInfo?.autoTransfer === true) {
                          if (navigate) navigate('/user/my-orders?tab=completed');
                          Toast.success(res?.message);

                          if (loadBankAmount) await loadBankAmount();
                          if (resetForm) resetForm();
                          if (onOrderSuccess) onOrderSuccess();
                          return;
                        }
                        if (financialInfo?.autoTransfer === false) {
                          if (navigate) navigate('/user/my-orders?tab=pending');

                          if (loadBankAmount) await loadBankAmount();

                          CongratulationsModal.show({
                            title: 'Congratulations!',
                            description:
                              'Your order has been submitted and will take 3 to 5 working days for approval. Thank you for your patience!',
                            btntitle: 'Done',
                            closeCongratulationsModal,

                            onClick: () => {
                              if (resetForm) resetForm();
                              if (onOrderSuccess) onOrderSuccess();
                            },
                          });
                        }
                      } else {
                        Toast.error(res.message);
                      }
                    } catch (err) {
                      console.error(err);
                      Toast.error('Error saving order');
                    }
                  },
                });
                closePreviewModal();
              }}
            />
          </Col>
        </Row>
      </CommonModal>
    );
  }
);

export default PreviewModal;
