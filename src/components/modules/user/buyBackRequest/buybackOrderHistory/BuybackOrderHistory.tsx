import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommonHeading from '../../../../common/commonHeading/CommonHeading';
import CommonTable from '../../../../ui/commonTable/CommonTable';
import CommonFilter from '../../../../common/commonFilter/CommonFilter';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import { LocationIcon, BackArrowIcon } from '../../../../../assets/icons/SvgIcon';
import { NoRecordIcon } from '../../../../../assets/icons/SvgIcon';
import { ROUTES } from '../../../../../utils/Utils';
import { callGetMethod } from '../../../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../../../services/api.service';
import { API_ENDPOINTS } from '../../../../../constants/apis/apiEndpoints';
import { formatCurrencyWithCrypto } from '../../../../../helpers/user/maskEmail';
import { useUsdtPrice } from '../../../../../hooks/useUsdtPrice';
import { setShouldRefreshBuyback } from '../../../../../redux/Slices/wallet.slice';
import './BuybackOrderHistory.scss';

interface PropertyDetails {
  propertyName?: string;
  registeredAddress?: string;
}

interface UserOrder {
  orderId?: string;
  quantity?: number;
  amount?: number;
  pricePerToken?: number;
  fees?: number;
  calculatedFees?: number;
  date?: string;
  method?: string;
  status?: string;
}

const statusfield = [
  { value: 'all', label: 'All' },
  { value: 'COMPLETED', label: 'Complete' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REJECTED', label: 'Rejected' },
];

const defaultStatus = statusfield[0];

const getStatusValue = (status: any) => {
  if (typeof status === 'string') return status;
  return status?.value ?? status;
};

const buybackListPath = `/${ROUTES.USER}/${ROUTES.BUYBACKREQUEST}`;

const BuybackOrderHistory = () => {
  const { id: buybackRequestId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const shouldRefreshBuyback = useSelector(
    (state: RootState) => state.wallet?.shouldRefreshBuyback
  );
  const { usdtPrice } = useUsdtPrice();

  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(
    null
  );
  const [orderHistoryData, setOrderHistoryData] = useState<UserOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ status: any }>({
    status: defaultStatus,
  });
  const hasLoadedOnce = useRef(false);

  const fields = [
    'Order ID',
    'Tokens',
    'Price',
    'Amount',
    'Fees',
    'Amount Received',
    'Status',
  ];

  const initialValues = { status: defaultStatus };

  const handleFilterChange = useCallback((values: any) => {
    setFilters({
      status: values?.status ?? defaultStatus,
    });
  }, []);

  const isResetDisabled =
    getStatusValue(filters?.status) === 'all' || !getStatusValue(filters?.status);

  const handleClearFilters = useCallback(() => {
    setFilters(initialValues);
  }, []);

  useEffect(() => {
    if (buybackRequestId) {
      hasLoadedOnce.current = false;
    }
  }, [buybackRequestId]);

  useEffect(() => {
    if (!buybackRequestId) {
      setError('Invalid buyback request');
      setLoading(false);
      return;
    }

    if (shouldRefreshBuyback) {
      dispatch(setShouldRefreshBuyback(false));
    }

    let cancelled = false;

    const fetchHistory = async () => {
      const isInitialLoad = !hasLoadedOnce.current;
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setFilterLoading(true);
        }
        setError(null);

        const params: Record<string, string> = { buybackRequestId };
        const statusValue = getStatusValue(filters.status);
        const isDefaultStatus =
          !statusValue ||
          statusValue === 'all' ||
          String(statusValue).toLowerCase() === 'all';
        if (!isDefaultStatus) {
          params.status = String(statusValue);
        }

        const res = await callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.GET.BUYBACK_USER_HISTORY,
          params,
          showToaster: false,
          dispatch,
          showLoader: isInitialLoad,
          showButtonLoader: false,
          token: true,
        });

        if (cancelled) return;

        if (res?.success && res?.data) {
          setPropertyDetails(res.data.propertyDetails ?? null);
          setOrderHistoryData(res.data.userOrders ?? []);
          hasLoadedOnce.current = true;
        } else {
          setPropertyDetails(null);
          setOrderHistoryData([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load order history');
          setPropertyDetails(null);
          setOrderHistoryData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFilterLoading(false);
        }
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [buybackRequestId, dispatch, filters, shouldRefreshBuyback]);

  const formatAmount = (value: number | undefined, paymentMethod?: string) => {
    if (value == null) return '-';
    return formatCurrencyWithCrypto(
      value,
      usdtPrice,
      cryptoEnable,
      paymentMethod ?? (cryptoEnable ? 'USDT' : 'INR')
    );
  };

  // When crypto is true, price is in INR from API → show in USDT by dividing by usdtPrice (getdollervalue)
  const formatPrice = (value: number | undefined) => {
    if (value == null) return '-';
    return formatCurrencyWithCrypto(
      value,
      usdtPrice,
      cryptoEnable,
      cryptoEnable ? 'INR' : undefined
    );
  };

  const getAmountReceived = (order: UserOrder) => {
    const amount = Number(order.amount ?? 0);
    const fees = Number(order.calculatedFees ?? order.fees ?? 0);
    return amount - fees;
  };

  const getStatusClass = (status: string | undefined) => {
    const s = (status ?? '').toLowerCase();
    if (s === 'confirmed' || s === 'completed') return 'green';
    if (s === 'pending') return 'orange';
    if (s === 'rejected' || s === 'failed') return 'red';
    return '';
  };

  const headerBlock = (
    <div className="buyback_order_history_header">
      <CommonHeading heading="Buyback Order History" />
      <CommonButton
        className="back_btn"
        title="Back"
        svgIcon={<BackArrowIcon />}
        onClick={() => navigate(buybackListPath)}
      />
    </div>
  );

  if (loading) {
    return (
      <section className="buyback_order_history">
        {headerBlock}
        <div className="buyback_order_history_content">
          <div className="property_card">Loading...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="buyback_order_history">
        {headerBlock}
        <div className="buyback_order_history_content">
          <div className="property_card">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="buyback_order_history">
      {headerBlock}

      <div className="buyback_order_history_content">
        {propertyDetails && (
          <div className="property_card">
            <h5>{propertyDetails.propertyName || '-'}</h5>
            <div className="property_location">
              <span className="location_icon">
                <LocationIcon />
              </span>
              <span>{propertyDetails.registeredAddress || '-'}</span>
            </div>
          </div>
        )}

        <CommonFilter
          statusfield={statusfield}
          className="filters_space"
          initialValues={initialValues}
          onFilterChange={handleFilterChange}
          clearFiltersBtnTitle="Reset"
          onClearFiltersClick={handleClearFilters}
          clearFiltersBtnDisabled={isResetDisabled}
        />

        <div className="order_history_table_wrapper">
          {filterLoading && (
            <div className="order_history_table_loading" aria-hidden="true">
              Updating…
            </div>
          )}
          <CommonTable
            className="order_history_table"
            fields={fields}
            lastColumnWidth="140px"
          >
            {orderHistoryData?.length > 0 ? (
              orderHistoryData.map((item: UserOrder, index: number) => (
                <tr key={item?.orderId ?? index}>
                  <td>{item?.orderId ?? '-'}</td>
                  <td>{item?.quantity ?? '-'}</td>
                  <td>{formatPrice(item?.pricePerToken)}</td>
                  <td>{formatAmount(item?.amount, item?.method)}</td>
                  <td>{item.fees} %</td>
                  <td>{formatAmount(getAmountReceived(item), item?.method)}</td>
                  <td>
                    <span className={`act-btn ${getStatusClass(item?.status)}`}>
                      {item?.status ?? '-'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={fields?.length} className="no_record_box">
                  <NoRecordIcon />
                  <p>No Record Found</p>
                </td>
              </tr>
            )}
          </CommonTable>
        </div>
      </div>
    </section>
  );
};

export default BuybackOrderHistory;
