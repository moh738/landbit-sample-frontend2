import CommonFilter from '../../../common/commonFilter/CommonFilter';
import CommonTable from '../../../ui/commonTable/CommonTable';
// import circle from '../../../../assets/images/icons/dark-circle.svg';
import { Col, Row } from 'react-bootstrap';
import {
  DiamondIcon,
  // RentalIcon,
  TotalInvestmentsIcon,
} from '../../../../assets/icons/SvgIcon';
import CommonHeading from '../../../common/commonHeading/CommonHeading';
import StatsCard from '../dashboard/statsCard/StatsCard';
import CustomPagination from '../../../common/customPagination/CustomPagination';
import './MyInvestment.scss';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePortfolio } from '../../../../hooks/usePortfolio';
import {
  formatCompactNumber,
  formatDate,
  safeNumber,
  formatUSDT,
  formatUSDTCompact,
  formatCurrencyWithCrypto,
} from '../../../../helpers/user/maskEmail';
import { limit } from '../../../../constants/modules/onBoarding/marketPlaceConstants';
import CommonButton from '../../../ui/commonButton/CommonButton';
import { useModal } from '@ebay/nice-modal-react';
import CustomTooltip from '../../../ui/customTooltip/CustomTooltip';
import { setShouldRefreshOrders } from '../../../../redux/Slices/wallet.slice';
import { useUsdtPrice } from '../../../../hooks/useUsdtPrice';
import { AdminExportStatus } from '../../../../interfaces/responses/types';


const MyInvestment = () => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalInvested, setTotalInvested] = useState<number>(0);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'completed' | 'failed'>('idle');
  // const [rentalIncome, setRentalIncome] = useState<number>(0);
  const { fetchPortfolio, pollExportUntilReady } = usePortfolio();
  const NFTCertificateModal = useModal('NFTCertificateModal');
  const dispatch = useDispatch();
  const { orderStatus, shouldRefreshOrders } = useSelector(
    (state: RootState) => state.wallet
  );
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const { usdtPrice } = useUsdtPrice();

  const handleFilterChange = (values: any) => {
    setPage(1);
    setSearchQuery(values.search || '');
  };

  const loadPortfolioOrder = useCallback(async () => {
    try {
      const res = await fetchPortfolio({
        page,
        limit,
        search: searchQuery,
      });

      if (res?.success) {
        setData(res?.data?.orders || []);
        setTotalCount(res?.data?.totalCount);
        // Use USDT values directly from API when crypto is enabled
        const stats = res?.data?.stats || {};
        setTotalInvested(
          cryptoEnable 
            ? Number(stats?.usdtTotalInvested || stats?.totalInvested || 0)
            : Number(stats?.totalInvested || 0)
        );
        const inrCurrentValue = Number(stats?.currentValue || 0);
        setCurrentValue(
          cryptoEnable && usdtPrice && usdtPrice > 0
            ? inrCurrentValue / usdtPrice
            : inrCurrentValue
        );
        // setRentalIncome(res?.data?.stats?.rentalIncome);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  }, [fetchPortfolio, page, searchQuery, cryptoEnable, usdtPrice]);

  useEffect(() => {
    loadPortfolioOrder();
  }, [loadPortfolioOrder, refreshFlag]);

  useEffect(() => {
    if (shouldRefreshOrders && orderStatus) {
      setRefreshFlag((prev) => !prev);
      dispatch(setShouldRefreshOrders(false));
    }
  }, [shouldRefreshOrders, orderStatus, dispatch]);

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

  const fields = [
    'Property/Equity Name',
    'Tokens Owned',
    'Invested',
    'Current Value',
    'Total Gain/Loss',
    // 'Rental Income',
    'Action',
  ];

  const investCard = [
    {
      icon: <TotalInvestmentsIcon />,
      value: (
        <div className="value-with-tooltip">
          {cryptoEnable
            ? `${formatUSDTCompact(totalInvested)} USDT`
            : `₹${formatCompactNumber(totalInvested)}`}
          {CustomTooltip(
            cryptoEnable
              ? `${formatUSDT(safeNumber(totalInvested))} USDT`
              : `₹${formatFullNumber(safeNumber(totalInvested))}`
          )}
        </div>
      ),
      subtitle: 'Total Invested',
      className: 'lightblueclr',
    },
    {
      icon: <DiamondIcon />,
      value: (
        <div className="value-with-tooltip">
          {cryptoEnable
            ? `${formatUSDTCompact(currentValue)} USDT`
            : `₹${formatCompactNumber(currentValue)}`}
          {CustomTooltip(
            cryptoEnable
              ? `${formatUSDT(safeNumber(currentValue))} USDT`
              : `₹${formatFullNumber(safeNumber(currentValue))}`
          )}
        </div>
      ),
      subtitle: 'Current Value',
    },
    // {
    //   icon: <RentalIcon />,
    //   value: (
    //     <div className="value-with-tooltip">
    //       {formatCompactNumber(rentalIncome) || '0'}
    //       {CustomTooltip(`${(rentalIncome) || 0}`)}
    //     </div>
    //   ),
    //   subtitle: 'Rental Income',
    //   className: 'lightgreenclr',
    // },
  ];

  const handlePageChange = (selectedPage: number) => {
    setPage(selectedPage);
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetchPortfolio({
        search: searchQuery,
        page: 1,
        limit: 10,
        download: true,
      });
      const exportId = res?.data?.exportId;
      if (res?.statusCode === 202 && typeof exportId === 'number') {
        setExportStatus('exporting');
        try {
          const statusRes = await pollExportUntilReady(exportId);
          if (statusRes?.data?.status === AdminExportStatus?.COMPLETED && statusRes?.data?.downloadUrl) {
            window.open(statusRes?.data?.downloadUrl, '_blank', 'noopener,noreferrer');
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
      if (typeof res?.data === 'string') {
        let csvContent = res.data;
        try {
          csvContent = atob(res.data);
        } catch {}

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `portfolio_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
      let allData =
        res?.data?.orders || res?.data?.portfolio || res?.data || res?.result || [];

      if (!Array.isArray(allData) || !allData?.length) {
        return;
      }

      const useUSDT = cryptoEnable && usdtPrice && usdtPrice > 0;
      const csvRows: string[] = [
        [
          'Property/Equity Name',
          'Tokens Owned',
          'Invested',
          'Current Value',
          'Total Gain/Loss',
        ]?.join(','),
      ];

      allData?.forEach((item: any) => {
        const investedRaw = Number(item?.invested ?? item?.usdtInvested ?? 0);
        const currentValueRaw = Number(item?.currentValue || 0);

        const invested = investedRaw;
        const currentValue =
          useUSDT && usdtPrice && usdtPrice > 0
            ? currentValueRaw / usdtPrice
            : currentValueRaw;
        const gain = currentValue - invested;
        const gainPercentNum = invested ? (gain / invested) * 100 : 0;
        const gainSign = gainPercentNum >= 0 ? '+' : '-';
        const gainPercentDisplay = `${gainSign}${Math.abs(gainPercentNum).toFixed(2)}%`;
        const totalGainLoss =
          useUSDT
            ? `${formatUSDT(gain)} USDT (${gainPercentDisplay})`
            : `₹${formatFullNumber(gain)} (${gainPercentDisplay})`;

        const tokensOwned = `${item?.quantity ?? 0} ${item?.ticker ?? '-'} Token`;
        const investedStr = useUSDT
          ? `${formatUSDT(invested)} USDT`
          : `₹${formatFullNumber(safeNumber(invested))}`;
        const currentValueStr = useUSDT
          ? `${formatUSDT(currentValue)} USDT`
          : `₹${formatFullNumber(safeNumber(currentValue))}`;

        csvRows.push(
          [
            `"${item.propertyName || '-'}"`,
            `"${tokensOwned}"`,
            `"${investedStr}"`,
            `"${currentValueStr}"`,
            `"${totalGainLoss}"`,
          ].join(',')
        );
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `portfolio_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const handleViewNFT = (_item?: any) => {
    const closeNFTCertificateModal = () => {
      NFTCertificateModal.remove();
    };

    NFTCertificateModal.show({
      closeNFTCertificateModal,
      item: _item,
    });
  };

  return (
    <section className="investment">
      <CommonHeading heading="Portfolio" />
      <div className="investment_cards">
        <Row className="mb-4 mb-md-0">
          {investCard?.map((item, index) => (
            <Col key={index} xl={4} lg={4} xs={6}>
              <StatsCard
                icon={item.icon}
                value={item.value}
                subtitle={item.subtitle}
                className={item.className}
              />
            </Col>
          ))}
        </Row>
      </div>

      <div className="investment_wrap">
        <CommonFilter
          SearchField
          searchplaceholder="Search here"
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
          onFilterChange={handleFilterChange}
          initialValues={{ search: searchQuery }}
          onCsvClick={handleExportCSV}
          csvDisabled={!data?.length || exportStatus === 'exporting'}
        />

        <CommonTable
          className="investment_table"
          fields={fields}
          lastColumnWidth="140px"
        >
          {data?.length > 0
            ? data?.map((item: any, index: number) => {
                const inrInvested = item.invested || 0;
                const inrCurrentValue = item.currentValue || 0.0;
                
                const invested = cryptoEnable && usdtPrice && usdtPrice > 0
                  ? inrInvested 
                  : inrInvested;
                
                const currentValue = cryptoEnable && usdtPrice && usdtPrice > 0
                  ? inrCurrentValue / usdtPrice
                  : inrCurrentValue;
                
                const gain = currentValue - invested;
                const gainPercent = invested
                  ? ((currentValue - invested) / invested) * 100
                  : 0;

                return (
                  <tr key={index}>
                    <td>
                      <div className="offering_txt">
                        <div className="offering_txt_inner">
                          <h5>{item?.propertyName}</h5>
                          <span>{formatDate(item.date) || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {item?.quantity || '-'} {item?.ticker || ''} Token
                    </td>

                    <td>
                      {formatCurrencyWithCrypto(invested, usdtPrice, cryptoEnable, cryptoEnable ? 'USDT' : 'INR')}
                    </td>
                    <td>
                      {formatCurrencyWithCrypto(currentValue, usdtPrice, cryptoEnable, cryptoEnable ? 'USDT' : 'INR')}
                    </td>
                    <td>
                      {formatCurrencyWithCrypto(gain, usdtPrice, cryptoEnable, cryptoEnable ? 'USDT' : 'INR')}{' '}
                      <span
                        className={`${
                          gainPercent < 0
                            ? 'red'
                            : gainPercent > 0
                              ? 'green'
                              : 'neutral'
                        }`}
                      >
                        ({gainPercent > 0 ? '+' : gainPercent < 0 ? '-' : ''}
                        {Math.abs(gainPercent)?.toFixed(2)}% )
                      </span>
                    </td>
                    {/* <td>{item.rental || '-'}</td> */}

                    <td>
                      <CommonButton
                        title="View NFT"
                        className="btn-secondry btn-md"
                        onClick={() => handleViewNFT(item)}
                      />
                    </td>
                    {/* <td>
                      <span
                        className={`act-btn ${
                          item.Status === 'Active'
                            ? 'green'
                            : item.Status === 'Inactive'
                              ? 'red'
                              : ''
                        }`}
                      >
                        {item.Status || '-'}
                      </span>
                    </td> */}
                  </tr>
                );
              })
            : null}
        </CommonTable>

        {totalCount > limit && (
          <CustomPagination
            pageCount={totalCount}
            currentPage={page}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </section>
  );
};

export default MyInvestment;
