import CommonTable from '../../../../ui/commonTable/CommonTable';
import CommonFilter from '../../../../common/commonFilter/CommonFilter';
import { useEffect, useState } from 'react';
import { useFetchCreateOrder } from '../../../../../hooks/useCreateOrder';
import { useExportPolling } from '../../../../../hooks/useExportPolling';
import CustomPagination from '../../../../common/customPagination/CustomPagination';
import { limit } from '../../../../../constants/modules/onBoarding/marketPlaceConstants';
import {
  formatDateTime,
  formatCurrencyWithCrypto,
} from '../../../../../helpers/user/maskEmail';
import { getOrderTokenPrefix } from '../../../../../helpers/user/orderTokenLabel';
import { useSelector, useDispatch } from 'react-redux';
import { setShouldRefreshOrders } from '../../../../../redux/Slices/wallet.slice';
import { useUsdtPrice } from '../../../../../hooks/useUsdtPrice';
import CommonButton from '../../../../ui/commonButton/CommonButton';
import { IMAGE_BASE_URL } from '../../../../../utils/config';
import { AdminExportStatus } from '../../../../../interfaces/responses/types';

const CompletedTable = ({ activeTab }: { activeTab: string }) => {
  const fields = [
    'Property/Equity Name',
    'Order ID',
    'Token Quantity',
    'Amount',
    'Fee',
    'Date',
    'Payment Currency',
    'Status',
    'Action',
  ];
  const dispatch = useDispatch();
  const { fetchOrderHistory } = useFetchCreateOrder();
  const [completedOrder, setCompletedOrder] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'completed' | 'failed'>('idle');

  const { pollExportUntilReady } = useExportPolling();
  const { orderStatus, shouldRefreshOrders } = useSelector(
    (state: RootState) => state.wallet
  );
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const { usdtPrice } = useUsdtPrice();

  const handleFilterChange = (values: any) => {
    setPage(1);
    // setFilterValues(values);
    setSearchQuery(values?.search || '');
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (activeTab === 'Completed') {
        try {
          const res = await fetchOrderHistory({
            status: 'Completed',
            page: page,
            limit: limit,
            search: searchQuery,
          });
          if (res && res.data) {
            const allOrders = res?.data?.orders || [];
            const filteredOrders = allOrders.filter((item: any) => {
              if (cryptoEnable) {
                // Show only USDT transactions when crypto is enabled
                return item?.method === 'USDT';
              } else {
                // Show only INR transactions when crypto is disabled
                return item?.method === 'INR';
              }
            });
            setCompletedOrder(filteredOrders);
            setTotalCount(filteredOrders.length);
          } else if (res?.result) {
            // Filter orders from result
            const allOrders = Array.isArray(res?.result) ? res?.result : [];
            const filteredOrders = allOrders.filter((item: any) => {
              if (cryptoEnable) {
                return item?.method === 'USDT';
              } else {
                return item?.method === 'INR';
              }
            });
            setCompletedOrder(filteredOrders);
          } else {
            setCompletedOrder([]);
          }
        } catch (err) {
          console.error('Error fetching completed orders:', err);
        }
      }
    };
    fetchOrder();
  }, [activeTab, fetchOrderHistory, page, searchQuery, refreshFlag, cryptoEnable]);

  useEffect(() => {
    if (shouldRefreshOrders && orderStatus) {
      setRefreshFlag((prev) => !prev);
      dispatch(setShouldRefreshOrders(false));
    }
  }, [shouldRefreshOrders, orderStatus, dispatch]);

  const handlePageChange = (selected: { selected: number }) => {
    const newPage = selected?.selected + 1;
    setPage(newPage);
  };

  const handleDownloadCSV = async () => {
    try {
      const res = await fetchOrderHistory({
        status: 'Completed',
        page: 1,
        limit: 10000,
        search: searchQuery,
        download: true,
      });
      const exportId = res?.data?.exportId;
      if (res?.statusCode === 202 && typeof exportId === 'number') {
        setExportStatus('exporting');
        try {
          const statusRes = await pollExportUntilReady(exportId);
          if (statusRes?.data?.status === AdminExportStatus.COMPLETED && statusRes?.data?.downloadUrl) {
            window.open(statusRes.data.downloadUrl, '_blank', 'noopener,noreferrer');
            setExportStatus('completed');
          } else if (statusRes?.data?.status === AdminExportStatus.FAILED) {
            setExportStatus('failed');
            console.error('Export failed');
          } else {
            setExportStatus('idle');
          }
        } catch {
          setExportStatus('failed');
        } finally {
          setTimeout(() => setExportStatus('idle'), 3000);
        }
        return;
      }

      let allOrders = [];
      if (res && res.data) {
        allOrders = res?.data?.orders || [];
      } else if (res?.result) {
        allOrders = res?.result || [];
      }

      // Filter orders based on cryptoEnable and payment method
      const filteredOrders = allOrders.filter((item: any) => {
        if (cryptoEnable) {
          return item?.method === 'USDT';
        } else {
          return item?.method === 'INR';
        }
      });

      if (!filteredOrders?.length) {
        return;
      }
      const headers = [
        'Property/Equity Name',
        'Order ID',
        'Token Quantity',
        'Amount',
        'Fee',
        'Date',
        'Payment Currency',
        'Status',
      ];

      const rows = filteredOrders?.map((item: any) => {
        const prefix = getOrderTokenPrefix(item);
        const propertyName =
          [item?.propertyName, item?.type].filter(Boolean).join(', ') || '-';
        const orderIdWithNft = item?.nftId
          ? `${item?.orderId || ''} (${prefix}- ${item.nftId})`
          : item?.orderId || '-';
        const tokenQuantity = `${item?.quantity ?? 0} ${prefix} Token`;
        const amountStr = formatCurrencyWithCrypto(
          item?.amount,
          usdtPrice,
          cryptoEnable,
          item?.method
        );
        const feeStr = `${item?.fees ?? 0}%`;
        const dateStr =
          formatDateTime(item?.date) ||
          (item?.time ? `${item?.date || ''} ${item.time}` : '-');
        const paymentCurrency = cryptoEnable ? 'USDT' : item?.method || 'INR';
        return [
          `"${(propertyName || '').replace(/"/g, '""')}"`,
          `"${(orderIdWithNft || '').replace(/"/g, '""')}"`,
          `"${tokenQuantity}"`,
          `"${(amountStr || '').replace(/"/g, '""')}"`,
          `"${feeStr}"`,
          `"${(dateStr || '').replace(/"/g, '""')}"`,
          `"${paymentCurrency}"`,
          `"${item?.status || ''}"`,
        ];
      });

      const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `completed_orders_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const handleViewDocument = (item: any) => {
    window.open(`${IMAGE_BASE_URL}${item}`, '_blank');
  };

  return (
    <div className="ordersinvest_table">
      <CommonFilter
        SearchField
        searchplaceholder="Search here"
        statusplacehoder="Payment Types"
        onFilterChange={handleFilterChange}
        csvBtnTitle={
          exportStatus === 'exporting'
            ? 'Exporting...'
            : exportStatus === 'completed'
              ? 'Export ready'
              : exportStatus === 'failed'
                ? 'Export failed'
                : 'Export CSV'
        }
        className="filters_space"
        initialValues={{ search: searchQuery }}
        onCsvClick={handleDownloadCSV}
        csvDisabled={!completedOrder?.length || exportStatus === 'exporting'}
      />
      <CommonTable
        className="completed_table"
        fields={fields}
        lastColumnWidth="140px"
      >
        {completedOrder?.length > 0
          ? completedOrder?.map((item: any, index: number) => (
              <tr key={index}>
                <td>
                  <div className="offering_txt">
                    <div className="offering_txt_inner">
                      <h5>{item?.propertyName}</h5>
                      <span>{item?.type}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="order_id">
                    <h5>{item?.orderId}</h5>
                    <span>{getOrderTokenPrefix(item)}- {item?.nftId}</span>
                  </div>
                </td>
                <td>{`${item?.quantity} ${getOrderTokenPrefix(item)} Token`}</td>
                <td>
                  {formatCurrencyWithCrypto(
                    item?.amount,
                    usdtPrice,
                    cryptoEnable,
                    item?.method
                  )}
                </td>
                <td>{`${item?.fees}%`}</td>
                <td>
                  <div className="order_id">
                    <h5>{formatDateTime(item?.date)}</h5>
                    <span>{item?.time}</span>
                  </div>
                </td>
                <td>{cryptoEnable ? 'USDT' : item?.method || 'INR'}</td>
                <td>
                  <span
                    className={`act-btn ${
                      item?.status === 'Completed'
                        ? 'green'
                        : item?.status === 'Pending'
                          ? 'orange'
                          : item?.status === 'Rejected'
                            ? 'red'
                            : ''
                    }`}
                  >
                    {item?.status}
                  </span>
                </td>
                <td>
                  <CommonButton
                    title="View Doc"
                    className="btn-secondry"
                    disabled={item.disabled}
                    onClick={() => handleViewDocument(item?.orderSignature)}
                  />
                </td>
              </tr>
            ))
          : null}
      </CommonTable>
      {totalCount > limit && (
        <CustomPagination
          handlePageChange={handlePageChange}
          pageCount={Math.ceil(totalCount / limit)}
          forcePage={page - 1}
        />
      )}
    </div>
  );
};

export default CompletedTable;
