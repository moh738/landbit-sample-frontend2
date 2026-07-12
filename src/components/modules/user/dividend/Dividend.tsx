import { Col, Row } from 'react-bootstrap';
import CommonFilter from '../../../common/commonFilter/CommonFilter';
import CommonHeading from '../../../common/commonHeading/CommonHeading';
import CustomPagination from '../../../common/customPagination/CustomPagination';
import CommonTable from '../../../ui/commonTable/CommonTable';
import './Dividend.scss';
import StatsCard from '../dashboard/statsCard/StatsCard';
import { TotalInvestmentsIcon, NoRecordIcon } from '../../../../assets/icons/SvgIcon';
import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDividend } from '../../../../hooks/useDividend';
import { useExportPolling } from '../../../../hooks/useExportPolling';
import { setShouldRefreshDividends } from '../../../../redux/Slices/wallet.slice';
import { AdminExportStatus } from '../../../../interfaces/responses/types';
import { limit } from '../../../../constants/modules/onBoarding/marketPlaceConstants';
import {
  formatCompactNumber,
  formatCurrencyWithCrypto,
  formatDate,
  formatMonthYear,
  formatUSDT,
  formatUSDTCompact,
  safeNumber,
} from '../../../../helpers/user/maskEmail';
import { useUsdtPrice } from '../../../../hooks/useUsdtPrice';
import CustomTooltip from '../../../ui/customTooltip/CustomTooltip';
import SearchField from '../../../formik/searchField/SearchField';

const Dividend = () => {
  const fields = [
    'Property/Equity Name',
    'Dividend per token',
    'Amount',
    'Declaration Date',
    'Distribution Date',
    'Div Type',
    'Status',
  ];

  const statusfield = [
    { value: 'ALL', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    // { value: 'FAILED', label: 'Failed' },
  ];

  const [dividendData, setDividendData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [totalDividendReceived, setTotalDividendReceived] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'completed' | 'failed'>('idle');

  const dispatch = useDispatch();
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const { shouldRefreshDividends } = useSelector((state: RootState) => state.wallet);
  const { usdtPrice } = useUsdtPrice();
  const { fetchDividends, fetchDividendStats } = useDividend();
  const { pollExportUntilReady } = useExportPolling();

  const loadDividends = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };

      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const res = await fetchDividends(params);

      if (res?.success) {
        setDividendData(res?.data?.rows || res?.data?.dividends || res?.data || []);
        setTotalCount(res?.data?.totalCount || res?.totalCount || 0);
      } else {
        setDividendData([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error loading dividends:', error);
      setDividendData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [fetchDividends, page, statusFilter, searchQuery]);

  const loadDividendStats = useCallback(async () => {
    try {
      const res = await fetchDividendStats();
      if (res?.success) {
        const stats = res?.data || {};
        const inrAmount = Number(stats?.totalDividendsReceived|| 0);
        setTotalDividendReceived(
          cryptoEnable 
            ? inrAmount
            : inrAmount
        );
      }
    } catch (error) {
      console.error('Error loading dividend stats:', error);
    }
  }, [fetchDividendStats, cryptoEnable, usdtPrice]);

  useEffect(() => {
    loadDividends();
  }, [loadDividends]);

  useEffect(() => {
    loadDividendStats();
  }, [loadDividendStats]);

  useEffect(() => {
    if (shouldRefreshDividends) {
      loadDividends();
      loadDividendStats();
      dispatch(setShouldRefreshDividends(false));
    }
  }, [shouldRefreshDividends, loadDividends, loadDividendStats]);

  const handleFilterChange = (values: any) => {
    setPage(1);
    const statusValue = values?.status?.value || values?.status || 'ALL';
    setStatusFilter(statusValue);
    setSearchQuery(values?.search || '');
  };

  const handleResetFilters = () => {
    setPage(1);
    setStatusFilter('ALL');
    setSearchQuery('');
    handleFilterChange({ status: statusfield[0].value || statusfield[0], search: '' });
  };

  const handlePageChange = (selected: { selected: number }) => {
    const newPage = selected?.selected + 1;
    setPage(newPage);
  };

  const handleExportCSV = async () => {
    try {
      const params: any = {
        download: true,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const res = await fetchDividends(params);

      // New flow: first API returns exportId (202), then poll and download from second API
      const exportId = res?.data?.exportId;
      if (res?.statusCode === 202 && typeof exportId === 'number') {
        setExportStatus('exporting');
        try {
          const statusRes = await pollExportUntilReady(exportId);
          if (statusRes?.data?.status === AdminExportStatus?.COMPLETED && statusRes?.data?.downloadUrl) {
            window.open(statusRes.data.downloadUrl, '_blank', 'noopener,noreferrer');
            setExportStatus('completed');
          } else if (statusRes?.data?.status === AdminExportStatus?.FAILED) {
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

      // Fallback: direct CSV string from API
      if (typeof res?.data === 'string') {
        let csvContent = res.data;
        try {
          csvContent = atob(res.data);
        } catch {}

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `dividends_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Fallback: build CSV from array
      let allData = res?.data?.rows || res?.data?.dividends || res?.data || [];

      if (!Array?.isArray(allData) || !allData?.length) {
        return;
      }

      const headers = [
        'Property/Equity Name',
        'Dividend per token',
        'Amount',
        'Declaration Date',
        'Distribution Date',
        'Div Type',
        'Status',
      ];

      const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

      const rows = allData?.map((item: any) => {
        const propertyName = item?.propertyName || '-';
        const divPerTokenStr = formatCurrency(
          item?.divPerToken ?? 0,
          cryptoEnable ? 'USDT' : 'INR'
        );
        const amountStr = formatCurrency(
          item?.amount ?? 0,
          cryptoEnable ? 'USDT' : 'INR'
        );
        const declarationDate = formatMonthYear(item?.recordDate) || '-';
        const distributionDate = formatDate(item?.distributionDate) || '-';
        const divType = item?.divType || '-';
        const status = item?.status || '-';

        return [
          escape(propertyName),
          escape(divPerTokenStr),
          escape(amountStr),
          escape(declarationDate),
          escape(distributionDate),
          escape(divType),
          escape(status),
        ].join(',');
      });

      const csvRows = [headers.join(','), ...rows];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dividends_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const formatCurrency = (amount: number | string, paymentMethod?: string | null) => {
    return formatCurrencyWithCrypto(amount, usdtPrice, cryptoEnable, paymentMethod);
  };

  const formatFullNumber = (num: any) => {
    if (num === null || num === undefined) return '0.00';
    const numValue = Number(num);
    if (isNaN(numValue)) return '0.00';
    const str = numValue.toString();
    const [integerPart, decimalPart] = str.split('.');
    const formattedInteger = Number(integerPart).toLocaleString('en-IN');
    if (decimalPart) {
      const decimals = decimalPart.substring(0, 2).padEnd(2, '0');
      return `${formattedInteger}.${decimals}`;
    }
    return `${formattedInteger}.00`;
  };

  const dividendCard = [
    {
      icon: <TotalInvestmentsIcon />,
      value: (
        <div className="value-with-tooltip">
          {cryptoEnable
            ? `${formatUSDTCompact(totalDividendReceived)} USDT`
            : `₹${formatCompactNumber(totalDividendReceived)}`}
          {CustomTooltip(
            cryptoEnable
              ? `${formatUSDT(safeNumber(totalDividendReceived))} USDT`
              : `₹${formatFullNumber(safeNumber(totalDividendReceived))}`
          )}
        </div>
      ),
      subtitle: 'Total Dividend Received',
      className: 'lightblueclr',
    },
  ];

  return (
    <section className="dividend">
      <CommonHeading heading="Dividend" />
      <div className="dividend_cards mb-4">
        <Row>
          {dividendCard?.map((item, index) => (
            <Col key={index} xl={4} lg={4} xs={6}>
              <StatsCard
                icon={item?.icon}
                value={item?.value}
                subtitle={item?.subtitle}
                className={item?.className}
              />
            </Col>
          ))}
        </Row>
      </div>
      <div className="dividend_search mb-4 mt-4">
        <SearchField
          placeholder="Search here"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            handleFilterChange({
              search: val,
              status:
                statusfield?.find((s) => s.value === statusFilter) || statusfield[0],
            });
          }}
        />
      </div>
      <div className="dividend_wrap">
        <CommonFilter
          csvBtnTitle={exportStatus === 'exporting' ? 'Exporting...' : 'Export CSV'}
          className="filters_space"
          statusfield={statusfield}
          onFilterChange={handleFilterChange}
          onCsvClick={handleExportCSV}
          csvDisabled={!dividendData?.length || exportStatus === 'exporting'}
          defaultValue={statusfield[0]}
          initialValues={{
            status:
              statusfield.find((s) => s.value === statusFilter) || statusfield[0],
          }}
          clearFiltersBtnTitle="Reset Filter"
          onClearFiltersClick={handleResetFilters}
          clearFiltersBtnDisabled={statusFilter === 'ALL' && !searchQuery}
        />
        <CommonTable
          className="dividend_table"
          fields={fields}
          lastColumnWidth="140px"
        >
          {dividendData?.length > 0
            ? dividendData?.map((item: any, index: number) => (
                <tr key={index}>
                  <td>
                    <div className="offering_txt">
                      <div className="offering_txt_inner">
                        <h5>{item?.propertyName || '-'}</h5>
                        {/* <span>{item?.address}</span> */}
                      </div>
                    </div>
                  </td>
                  <td>
                    {formatCurrency(
                      item?.divPerToken || 0,
                      cryptoEnable ? 'INR' : 'INR'
                    )}
                  </td>
                  <td>
                    {formatCurrency(item?.amount || 0, cryptoEnable ? 'INR' : 'INR')}
                  </td>
                  <td>{formatMonthYear(item?.recordDate)}</td>
                  <td>{formatDate(item?.distributionDate) || '-'}</td>
                  <td>{item?.divType || '-'}</td>
                  <td>
                    {(() => {
                      const status = item?.status || '';
                      // Display status as-is from API
                      const displayStatus = status;
                      // Determine color based on status
                      const statusColor =
                        displayStatus === 'PAID' || displayStatus === 'Paid'
                          ? 'green'
                          : displayStatus === 'PENDING' ||
                              displayStatus === 'Pending'
                            ? 'orange'
                            : displayStatus === 'FAILED' ||
                                displayStatus === 'Pending'
                              ? 'orange'
                              : '';

                      return (
                        <span className={`act-btn ${statusColor}`}>
                          {displayStatus || '-'}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))
            : !loading && (
                <tr>
                  <td colSpan={fields.length} className="no_record_box">
                    <NoRecordIcon />
                    <p>No dividends found</p>
                  </td>
                </tr>
              )}
        </CommonTable>
        {totalCount > limit && (
          <CustomPagination
            handlePageChange={handlePageChange}
            pageCount={Math.ceil(totalCount / limit)}
            forcePage={page - 1}
          />
        )}
      </div>
    </section>
  );
};

export default Dividend;
