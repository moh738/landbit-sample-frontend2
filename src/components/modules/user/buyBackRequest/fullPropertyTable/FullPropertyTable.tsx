import { useModal } from '@ebay/nice-modal-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setShouldRefreshBuyback } from '../../../../../redux/Slices/wallet.slice';
import property_icon from '../../../../../assets/images/icons/property_icon.svg';
import CommonFilter from '../../../../common/commonFilter/CommonFilter';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import CommonTable from '../../../../ui/commonTable/CommonTable';
import CustomPagination from '../../../../common/customPagination/CustomPagination';
import './FullPropertyTable.scss';
import { ROUTES } from '../../../../../utils/Utils';
import { NoRecordIcon, CopyIcon } from '../../../../../assets/icons/SvgIcon';
import { callGetMethod } from '../../../../../redux/Actions/api.action';
import { landbitBackendUrl } from '../../../../../services/api.service';
import { API_ENDPOINTS } from '../../../../../constants/apis/apiEndpoints';
import { IMAGE_BASE_URL } from '../../../../../utils/config';
import { useUsdtPrice } from '../../../../../hooks/useUsdtPrice';
import store from '../../../../../redux/Store';
import {
  formatCurrencyWithCrypto,
  formatTxId,
} from '../../../../../helpers/user/maskEmail';
import useCopyClipboard from '../../../../../hooks/useCopyToClipboard';

interface FullPropertyTableProps {
  onStatsChange?: (stats: {
    totalCount?: number;
    activeCount?: number;
    closedCount?: number;
    upcomingCount?: number;
  }) => void;
}

const FullPropertyTable = ({ onStatsChange }: FullPropertyTableProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const shouldRefreshBuyback = useSelector(
    (state: RootState) => state.wallet?.shouldRefreshBuyback
  );
  const { cryptoEnable } = store.getState().user.profile;
  const { usdtPrice } = useUsdtPrice();
  const BuybackCreateOrderModal = useModal('BuybackCreateOrderModal');
  const [copyToClipboard] = useCopyClipboard();

  const limit = 10;
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<any>({});
  const [inputFilters, setInputFilters] = useState<any>({});
  const [apiBuybackData, setApiBuybackData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshListTrigger, setRefreshListTrigger] = useState(0);

  const handleFilterChange = useCallback((values: any) => {
    setInputFilters(values);
    setPage(1); // Reset to first page when filters change
  }, []);

  // Debounce filter changes
  useEffect(() => {
    if (inputFilters === filters) return;
    const id = setTimeout(() => {
      setFilters((prev: any) => (prev === inputFilters ? prev : inputFilters));
    }, 700);
    return () => clearTimeout(id);
  }, [inputFilters, filters]);

  const handlePageChange = useCallback((selected: { selected: number }) => {
    setPage((selected?.selected ?? 0) + 1);
  }, []);

  const fields = [
    'Property Name',
    'Start Date',
    'End Date',
    'Buyback Price',
    'Request Id',
    'Buyback Tokens',
    'Remaining Tokens',
    'Status',
    'Action',
  ];

  const statusfield = [
    { value: 'all', label: 'All' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'OPEN', label: 'Opened' },
    { value: 'CLOSED', label: 'Closed' },
    // { value: 'APPROVED', label: 'Approved' },
    // { value: 'REJECTED', label: 'Rejected' },
  ];

  // Set default value to "all" - pass the full object for proper display
  const defaultStatus = statusfield[0];

  const getStatusValue = (status: any) => {
    if (typeof status === 'string') return status;
    return status?.value || status;
  };

  // Prepare initial values for filter
  const initialValues = {
    search: '',
    status: defaultStatus, // Pass the full object so "All" label displays
  };

  const isResetDisabled = (() => {
    const currentSearch = (inputFilters?.search ?? '').trim();
    const currentStatus = getStatusValue(inputFilters?.status);
    return currentSearch === '' && (currentStatus === 'all' || !currentStatus);
  })();

  const handleClearFilters = useCallback(() => {
    setInputFilters(initialValues);
    setFilters(initialValues);
    setPage(1);
  }, [initialValues]);

  
  useEffect(() => {
    if (shouldRefreshBuyback) {
      setRefreshListTrigger((prev) => prev + 1);
      dispatch(setShouldRefreshBuyback(false));
    }
  }, [shouldRefreshBuyback, dispatch]);

  // Fetch buyback data when page or filters change
  useEffect(() => {
    let cancelled = false;

    const fetchBuybackData = async () => {
      try {
        // Prepare API parameters
        const params: any = { page, limit };

        // Add status filter if not "all"
        const statusValue =
          typeof filters.status === 'string'
            ? filters.status
            : filters.status?.value || filters.status;
        if (statusValue && statusValue !== 'all' && statusValue !== '') {
          params.status = statusValue.toUpperCase();
        }

        // Add search query
        if (filters.search?.trim()) {
          params.search = filters.search.trim();
        }

        const res = await callGetMethod({
          apiUrl: landbitBackendUrl,
          endpoint: API_ENDPOINTS.GET.BUYBACK_REQUEST_LIST,
          params,
          showToaster: false,
          dispatch,
          showLoader: true,
          showButtonLoader: false,
          token: true,
        });

        if (cancelled) return;

        if (res?.success && res?.data) {
          // Helper function to format status for display
          const formatStatus = (status: string) => {
            const statusMap: Record<string, string> = {
              UPCOMING: 'Upcoming',
              OPEN: 'Opened',
              OPENED: 'Opened',
              CLOSED: 'Closed',
              APPROVED: 'Approved',
              REJECTED: 'Rejected',
            };
            const normalized = status?.toUpperCase?.()
              ? status.toUpperCase()
              : status;
            return (
              statusMap[normalized] ||
              (status
                ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
                : '')
            );
          };

          // Helper function to format date for display (date only, no time)
          const formatDate = (dateString: string) => {
            if (!dateString) return '';
            try {
              const date = new Date(dateString);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            } catch {
              return dateString;
            }
          };

          // Helper function to get full image URL
          const getImageUrl = (imagePath: string) => {
            if (!imagePath) return property_icon;
            // If already a full URL, return as is
            if (
              imagePath.startsWith('http://') ||
              imagePath.startsWith('https://')
            ) {
              return imagePath;
            }
            // Otherwise, append IMAGE_BASE_URL
            return IMAGE_BASE_URL + imagePath;
          };

          // Map API response to component format - use exact API data
          const mappedData = (res.data.buybackRequests || []).map((item: any) => {
            const firstImage =
              item.images && item.images.length > 0 ? item.images[0] : null;

            const rawPrice = Number(item.buybackPrice) || 0;

            const displayPrice = formatCurrencyWithCrypto(
              rawPrice,
              usdtPrice,
              cryptoEnable,
              cryptoEnable ? 'INR' : 'INR'
            );

            return {
              buybackRequestId: item.buybackRequestId, // Unique identifier for each buyback request
              propertyId: item.propertyId,
              propertyName: item.propertyName,
              detail: item.propertyName,
              startDate: formatDate(item.startDate),
              endDate: formatDate(item.endDate),
              buybackPrice: displayPrice,
              rawBuybackPrice: rawPrice,
              buybackPercentage: item.buybackPercentage ?? '',
              buybackTokens: item.tokenQuantity || '',
              remainingTokens: item.availableToken ?? '',
              userAvailableTokenBalance: item.userTokenBalance ?? '',
              totalTokens: item.tokenQuantity || '',
              status: formatStatus(item.status || ''),
              rawStatus: item.status || '', // Keep original status for filtering
              icon: firstImage ? getImageUrl(firstImage) : property_icon,
              images: item.images || [],
              // Average price per token (INR) from backend, used for P/L in buyback modal
              averagePricePerToken: Number(
                item.averagePricePerToken ?? item.avgPricePerToken ?? 0
              ),
            };
          });

          // Apply client-side status filter if status filter is active
          let filteredData = mappedData;
          const statusValue =
            typeof filters.status === 'string'
              ? filters.status
              : filters.status?.value || filters.status;

          if (
            statusValue &&
            statusValue !== 'all' &&
            statusValue !== '' &&
            statusValue !== defaultStatus?.value
          ) {
            const statusUpper = statusValue.toUpperCase();
            filteredData = mappedData.filter((item: any) => {
              // Use rawStatus (original API status) for accurate filtering
              const itemRawStatus = (item.rawStatus || '').toUpperCase();
              // Strict match - only show items with exact status match
              return itemRawStatus === statusUpper;
            });
          }

          setApiBuybackData(filteredData);
          // Use filtered data length for accurate count when filtering
          const countToUse =
            statusValue &&
            statusValue !== 'all' &&
            statusValue !== '' &&
            statusValue !== defaultStatus?.value
              ? filteredData.length
              : Number(
                  res.data?.totalCount ??
                    res.data?.stats?.totalCount ??
                    filteredData.length
                );
          setTotalCount(countToUse);

          // Expose stats to parent (BuyBackRequest) for cards
          if (onStatsChange) {
            onStatsChange({
              totalCount: Number(
                res.data?.stats?.totalCount ?? res.data?.totalCount ?? 0
              ),
              activeCount: Number(res.data?.stats?.activeCount ?? 0),
              closedCount: Number(res.data?.stats?.closedCount ?? 0),
              upcomingCount: Number(res.data?.stats?.upcomingCount ?? 0),
            });
          }
        } else {
          setApiBuybackData([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error('Error fetching buyback data:', error);
        if (!cancelled) {
          setApiBuybackData([]);
          setTotalCount(0);
        }
      }
    };

    fetchBuybackData();

    return () => {
      cancelled = true;
    };
  }, [page, filters, limit, dispatch, refreshListTrigger]);

  const pageCount = Math.ceil(totalCount / limit);

  const handleView = (item: any) => {
    navigate(
      `/${ROUTES.USER}/${ROUTES.BUYBACKREQUEST}/order-history/${item.buybackRequestId}`
    );
  };

  const closeBuybackCreateOrderModal = useCallback(() => {
    BuybackCreateOrderModal.remove();
  }, [BuybackCreateOrderModal]);

  const parseTokenBalance = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  };

  const handleCreateOrder = (item: any) => {
    if (!item?.buybackRequestId) return;
    const userAvailableTokenBalance = parseTokenBalance(
      item?.userAvailableTokenBalance ?? item?.userTokenBalance
    );
    const remainingTokens = parseTokenBalance(
      item?.remainingTokens ?? item?.availableTokens ?? item?.availableToken
    );
    BuybackCreateOrderModal.show({
      closeBuybackCreateOrderModal,
      buybackData: {
        buybackRequestId: item?.buybackRequestId,
        propertyId: item?.propertyId,
        propertyName: item?.detail || item?.propertyName,
        buybackPrice: item?.buybackPrice,
        rawBuybackPrice: Number(item?.rawBuybackPrice ?? 0),
        buybackPercentage: item?.buybackPercentage,
        userAvailableTokenBalance,
        remainingTokens,
        buybackTokens: item?.buybackTokens,
        averagePricePerToken: item?.averagePricePerToken,
      },
      onOrderSuccess: () => {
        setRefreshListTrigger((prev) => prev + 1);
      },
      onOrderError: () => {
        setRefreshListTrigger((prev) => prev + 1);
      },
    });
  };

  const canCreateOrder = (item: any) => {
    const status = (item?.rawStatus || item?.status || '').toUpperCase();
    const userBalance = parseTokenBalance(
      item?.userAvailableTokenBalance ?? item?.userTokenBalance
    );
    const remaining = parseTokenBalance(
      item?.remainingTokens ?? item?.availableTokens ?? item?.availableToken
    );
    const maxSellable = Math.min(userBalance, remaining);

    // Allow create order only for OPEN / OPENED with tokens to sell
    if (!maxSellable || maxSellable <= 0) return false;
    return status === 'OPEN' || status === 'OPENED';
  };

  const displayData = apiBuybackData;

  return (
    <div className="fullproperty_table">
      <CommonFilter
        SearchField
        searchplaceholder="Search Property Name"
        className="filters_space"
        statusfield={statusfield}
        // defaultValue={defaultStatus}
        onFilterChange={handleFilterChange}
        initialValues={initialValues}
        clearFiltersBtnTitle="Reset"
        onClearFiltersClick={handleClearFilters}
        clearFiltersBtnDisabled={isResetDisabled}
      />

      <CommonTable className="buyback_table" fields={fields} lastColumnWidth="160px">
        {displayData?.length > 0 ? (
          displayData?.map((item: any) => (
            <tr key={item?.buybackRequestId || item?.propertyId}>
              <td>
                <div className="offering_txt">
                  <div className="offering_txt_inner">
                    <h5>{item?.detail || item?.propertyName}</h5>
                  </div>
                </div>
              </td>
              <td>{item?.startDate}</td>
              <td>{item?.endDate}</td>
              <td>{item?.buybackPrice}</td>
              <td>
                <div className="buyback_id_wrapper">
                  <span>{formatTxId(item?.buybackRequestId || '') || '-'}</span>
                  {item?.buybackRequestId && (
                    <button
                      type="button"
                      className="buyback_copy_link"
                      onClick={() => copyToClipboard(item?.buybackRequestId)}
                      title="Copy Buyback Request ID"
                    >
                      <CopyIcon />
                    </button>
                  )}
                </div>
              </td>
              <td>{item?.buybackTokens || item.totalTokens}</td>
              <td>{item?.remainingTokens ?? item?.availableTokens ?? item?.availableToken ?? '-'}</td>
              <td>
                <span
                  className={`act-btn status-${(item?.status || '').toLowerCase()}`}
                >
                  {item?.status}
                </span>
              </td>
              <td>
                <div className="btn_group">
                  <CommonButton
                    className="border-btn"
                    onClick={() => handleView(item)}
                  >
                    View
                  </CommonButton>
                  {canCreateOrder(item) && (
                    <CommonButton
                      className="border-btn"
                      onClick={() => handleCreateOrder(item)}
                    >
                      Create Order
                    </CommonButton>
                  )}
                </div>
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

      {totalCount > limit && (
        <CustomPagination
          handlePageChange={handlePageChange}
          pageCount={pageCount}
          forcePage={page - 1}
        />
      )}
    </div>
  );
};

export default FullPropertyTable;
