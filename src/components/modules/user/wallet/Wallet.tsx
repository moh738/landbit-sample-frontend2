import WalletCards from './walletCards/WalletCards';
import CommonHeading from '../../../common/commonHeading/CommonHeading';
import TabsComponent from '../../../ui/tabsComponent/TabsComponent';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CommonFilter from '../../../common/commonFilter/CommonFilter';
import CommonTable from '../../../ui/commonTable/CommonTable';
import CommonButton from '../../../ui/commonButton/CommonButton';
import { Transaction } from '../../../../interfaces/wallet/wallet';
import { useFetchTransactionHistory } from '../../../../hooks/useFetchTransactionHistory';
import { limit } from '../../../../constants/modules/onBoarding/marketPlaceConstants';
import {
  formatDateTime,
  formatTxId,
  formatWithCommas,
  formatUSDTWithCommas,
} from '../../../../helpers/user/maskEmail';
import { ExternalLinkIcon, CopyIcon } from '../../../../assets/icons/SvgIcon';
import CustomPagination from '../../../common/customPagination/CustomPagination';
import { setShouldRefreshTransactions } from '../../../../redux/Slices/wallet.slice';
import './Wallet.scss';
import { EXPLORER_URL } from '../../../../utils/config';
import useCopyClipboard from '../../../../hooks/useCopyToClipboard';
import { useExportPolling } from '../../../../hooks/useExportPolling';
import { AdminExportStatus } from '../../../../interfaces/responses/types';
// import { useUserSettings } from '../../../../hooks/useUserSetting';

const wallet = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<any>('Deposit');
  // const [feesPerecntage, setfeesPerecntage] = useState<any>();
  // const [depositfees, setDepositFees] = useState<number>();
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const [copyToClipboard] = useCopyClipboard();

  // Get payment status and refresh flag from Redux
  const { paymentStatus, shouldRefreshTransactions } = useSelector(
    (state: RootState) => state.wallet
  );
  const tabItems = [
    { key: 'Deposit', label: 'Credit' },
    { key: 'Withdrawal', label: 'Debit' },
  ];

  const budgetfield = [
    { value: 'All', label: 'All' },
    { value: 'Complete', label: 'Completed' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  // const currencyField = useMemo(() => {
  //   return cryptoEnable
  //     ? [{ value: 'usdt', label: 'USDT' }]
  //     : [{ value: 'inr', label: 'INR' }];
  // }, [cryptoEnable]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedUsernames, setExpandedUsernames] = useState<{
    [key: string]: boolean;
  }>({});
  // const { fetchUserSettings } = useUserSettings();
  const [filterValues, setFilterValues] = useState<any>({
    status: budgetfield[0],
    // currency: currencyField[0],
  });

  // Update filter values when cryptoEnable changes
  useEffect(() => {
    setFilterValues((prev: any) => ({
      status: prev?.status || budgetfield[0],
      // currency: currencyField[0],
    }));
  }, [cryptoEnable]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'completed' | 'failed'>('idle');

  const { pollExportUntilReady } = useExportPolling();
  const fields = useMemo(() => {
    const baseFieldsDeposit = [
      'Amount',
      'Fees',
      ...(cryptoEnable ? [] : ['Username']),
      'Transaction ID',
      'Type',
      'Opening Balance',
      'Closing Balance',
      'Date and Time',
      'Status',
    ];
    const baseFieldsWithdrawal = [
      'Amount',
      'Fees',
      ...(cryptoEnable ? [] : ['Username']),
      'Transaction ID',
      'Type',
      'Opening Balance',
      'Closing Balance',
      'Date and Time',
      'Status',
    ];
    return activeTab === 'Deposit' ? baseFieldsDeposit : baseFieldsWithdrawal;
  }, [activeTab, cryptoEnable]);

  const handleFilterChange = (values: any) => {
    setPage(1);
    setFilterValues(values);
  };

  const { fetchTransactionHistory } = useFetchTransactionHistory();
  const fetchTransactions = useCallback(
    async (customPage = page, customFilters = filterValues) => {
      try {
        const params: any = {
          trxType: activeTab,
          page: customPage,
          limit,
        };
        if (customFilters?.status?.value)
          params.status = customFilters?.status?.value || budgetfield[0];
        const res = await fetchTransactionHistory(params);
        if (res?.success && res?.data) {
          // Filter transactions based on cryptoEnable
          let filteredTransactions = res.data;
          if (activeTab === 'Deposit') {
            if (cryptoEnable) {
              // Show only crypto/USDT and Dividend transactions
              filteredTransactions = res.data.filter(
                (item: any) =>
                  item?.paymentGateway === 'Crypto' ||
                  item?.paymentThrough === 'USDT' ||
                  item?.trxType === 'Dividend'
              );
            } else {
              // Show bank, UPI, Property, and Dividend transactions (Property will show in INR)
              filteredTransactions = res.data.filter(
                (item: any) =>
                  (item?.paymentGateway === 'Manual' &&
                    (item?.paymentThrough === 'Bank' ||
                      item?.paymentThrough === 'UPI')) ||
                  item?.trxType === 'Buy Order' ||
                  item?.trxType === 'Sell Order' ||
                  item?.trxType === 'Dividend'
              );
            }
          } else if (activeTab === 'Withdrawal') {
            if (cryptoEnable) {
              // Show only USDT transactions (including Property Bought with USDT)
              filteredTransactions = res.data.filter(
                (item: any) =>
                  item?.paymentGateway === 'Crypto' ||
                  item?.paymentThrough === 'USDT'
              );
            } else {
              // Show bank, UPI, and Property transactions (Property will show in INR)
              filteredTransactions = res.data.filter(
                (item: any) =>
                  (item?.paymentGateway === 'Manual' &&
                    (item?.paymentThrough === 'Bank' ||
                      item?.paymentThrough === 'UPI')) ||
                  item?.trxType === 'Buy Order' ||
                  item?.trxType === 'Sell Order'
              );
            }
          }
          setTransactions(filteredTransactions);
          setTotalCount(filteredTransactions.length);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        setTransactions([]);
      }
    },
    [activeTab, fetchTransactionHistory, filterValues, page, cryptoEnable]
  );

  useEffect(() => {
    fetchTransactions();
  }, [activeTab, refreshFlag, filterValues, fetchTransactions]);

  // Refresh transactions when payment status is updated via socket
  useEffect(() => {
    if (shouldRefreshTransactions && paymentStatus) {
      // Refresh transactions when payment status changes
      setRefreshFlag((prev) => !prev);
      // Reset the refresh flag
      dispatch(setShouldRefreshTransactions(false));
    }
  }, [shouldRefreshTransactions, paymentStatus, dispatch]);

  const handlePageChange = (selected: { selected: number }) => {
    const newPage = selected?.selected + 1;
    setPage(newPage);
  };

  const toggleUsername = (key: string) => {
    setExpandedUsernames((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDownloadCSV = async () => {
    try {
      const params: any = {
        trxType: activeTab,
        page: 1,
        limit: 10000,
        download: true,
      };
      if (filterValues?.status?.value) params.status = filterValues?.status?.value;

      const res = await fetchTransactionHistory(params);

      // New flow: first API with download=true returns exportId (202), then poll and download from second API
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
      if (!res?.success || !res?.data?.length) {
        console.warn('No transactions to export');
        return;
      }

      const dataToExport = res.data;

      // Same column headers as Recent Transactions table
      const headers = [
        'Amount',
        'Fees',
        ...(cryptoEnable ? [] : ['Username']),
        'Transaction ID',
        'Type',
        'Opening Balance',
        'Closing Balance',
        'Date and Time',
        'Status',
      ];

      const formatAmountCell = (value: any, item: any) => {
        if (value == null || value === '') return '0';
        const isPropertyTransaction =
          item?.trxType === 'Buy Order' || item?.trxType === 'Sell Order';
        const isCrypto =
          item?.paymentGateway === 'Crypto' || item?.paymentThrough === 'USDT';
        if (isPropertyTransaction && isCrypto) {
          return cryptoEnable
            ? `${formatUSDTWithCommas(value)} USDT`
            : `₹${formatWithCommas(value)}`;
        }
        if (isCrypto) {
          return cryptoEnable
            ? `${formatUSDTWithCommas(value)} USDT`
            : `₹${formatWithCommas(value)}`;
        }
        return `₹${formatWithCommas(value)}`;
      };

      const rows = dataToExport.map((item: any) => {
        const transactionId =
          activeTab === 'Deposit' && cryptoEnable
            ? item?.trxUrl
            : item?.trxUrl || item?.userTrxId;
        const txIdStr = formatTxId(transactionId) || '-';
        const typeStr =
          item?.trxType === 'Withdrawal'
            ? 'Withdraw'
            : item?.trxType === 'Deposit'
              ? 'Deposit'
              : item?.trxType === 'Dividend'
                ? 'Dividend'
                : item?.trxType === 'Buy Order'
                  ? 'Property Bought'
                  : 'Property sell';
        const openingStr =
          item?.openingBalance != null && item?.openingBalance !== ''
            ? formatAmountCell(item.openingBalance, item)
            : '0';
        const closingStr =
          item?.closingBalance != null && item?.closingBalance !== ''
            ? formatAmountCell(item.closingBalance, item)
            : '0';
        const statusStr =
          item?.status === 'Complete' ? 'Completed' : item?.status || '';

        const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

        return [
          escape(formatAmountCell(item?.amount, item)),
          escape(formatAmountCell(item?.feeAmount, item)),
          ...(cryptoEnable ? [] : [escape(item?.nickName || '-')]),
          escape(txIdStr),
          escape(typeStr),
          escape(openingStr),
          escape(closingStr),
          escape(formatDateTime(item?.createdAt) || '-'),
          escape(statusStr),
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((r: any) => r.join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleTransactionSuccess = () => {
    setRefreshFlag((prev) => !prev);
  };

  // useEffect(() => {
  //   const getUserWalletSettings = async () => {
  //     try {
  //       const res = await fetchUserSettings();
  //       setfeesPerecntage(res?.data?.withdrawalFee);
  //        setDepositFees(res?.data?.depositFee);
  //     } catch (err) {
  //       console.error('Failed to fetch admin wallet:', err);
  //     }
  //   };
  //   getUserWalletSettings();
  // }, [fetchUserSettings]);

  const getExplorerUrl = (txId: string): string => {
    if (!txId || typeof txId !== 'string') return '';

    const cleanTxId = txId?.trim();
    return cleanTxId ? `${EXPLORER_URL}${cleanTxId}` : '';
  };

  return (
    <section className="wallet">
      <CommonHeading heading="My Wallet" />
      <WalletCards onTransactionSuccess={handleTransactionSuccess} />
      <div className="wallet_table_wrap">
        <CommonHeading heading="Recent Transactions" />
        <div className="wallet_table_wrap_filter">
          <TabsComponent
            activeTab={activeTab}
            onSelect={(key) => setActiveTab(key as 'Deposit' | 'Withdrawal')}
            tabItems={tabItems}
            className="wallet_tabs"
          />
          {!cryptoEnable && (
            <CommonFilter
              className="wallet_filter"
              statusfield={budgetfield}
              // currencytype={currencyField}
              onCsvClick={handleDownloadCSV}
              csvBtnTitle={exportStatus === 'exporting' ? 'Exporting...' : 'Export CSV'}
              csvDisabled={!transactions?.length || exportStatus === 'exporting'}
              onFilterChange={handleFilterChange}
              initialValues={filterValues}
              btntitle="Reset Filter"
              btnClick={() => {
                const resetFilters = {
                  status: budgetfield[0],
                  // currency: currencyField[0],
                };
                setFilterValues(resetFilters);
                setPage(1);
              }}
              btnDisabled={filterValues?.status?.value === budgetfield[0]?.value}
            />
          )}
          {cryptoEnable && (
            <div className="filter_btns">
              <CommonButton
                onClick={handleDownloadCSV}
                type="button"
                className="filterblue_btn export_csv_btn"
                disabled={!transactions?.length || exportStatus === 'exporting'}
              >
                <span className="export_csv_text">
                  {exportStatus === 'exporting' ? (
                    'Exporting...'
                  ) : (
                    <>
                      <span className="export_line">Export</span>
                      <span className="csv_line">CSV</span>
                    </>
                  )}
                </span>
              </CommonButton>
            </div>
          )}
        </div>
        <div className="tab_content">
          <div className="wallet_table">
            <CommonTable
              className="wallet_table"
              fields={fields}
              lastColumnWidth="140px"
            >
              {transactions?.length > 0
                ? transactions?.map(
                    (
                      item: any,
                      index: number // const isWithdrawal = activeTab === 'Withdrawal';
                    ) => (
                      // console.log('isWithdrawal=========>', isWithdrawal);
                      // const fee = isWithdrawal
                      // ? (item?.amount * feesPerecntage) / (100 - feesPerecntage)
                      // : item?.feeAmount;

                      <tr key={index}>
                        <td>
                          {(() => {
                            const isPropertyTransaction =
                              item?.trxType === 'Buy Order' ||
                              item?.trxType === 'Sell Order';
                            const isCrypto =
                              item?.paymentGateway === 'Crypto' ||
                              item?.paymentThrough === 'USDT';

                            // For Property transactions with USDT: show USDT if cryptoEnable is true, INR if false
                            if (isPropertyTransaction && isCrypto) {
                              return cryptoEnable
                                ? `${formatUSDTWithCommas(item?.amount)} USDT`
                                : `₹${formatWithCommas(item?.amount)}`;
                            }

                            // For regular USDT transactions: show USDT only if cryptoEnable is true
                            if (isCrypto) {
                              return cryptoEnable
                                ? `${formatUSDTWithCommas(item?.amount)} USDT`
                                : `₹${formatWithCommas(item?.amount)}`;
                            }

                            // For non-crypto transactions: always show INR
                            return `₹${formatWithCommas(item?.amount)}`;
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const isPropertyTransaction =
                              item?.trxType === 'Buy Order' ||
                              item?.trxType === 'Sell Order';
                            const isCrypto =
                              item?.paymentGateway === 'Crypto' ||
                              item?.paymentThrough === 'USDT';

                            // For Property transactions with USDT: show USDT if cryptoEnable is true, INR if false
                            if (isPropertyTransaction && isCrypto) {
                              return cryptoEnable
                                ? `${formatUSDTWithCommas(item?.feeAmount)} USDT`
                                : `₹${formatWithCommas(item?.feeAmount)}`;
                            }

                            // For regular USDT transactions: show USDT only if cryptoEnable is true
                            if (isCrypto) {
                              return cryptoEnable
                                ? `${formatUSDTWithCommas(item?.feeAmount)} USDT`
                                : `₹${formatWithCommas(item?.feeAmount)}`;
                            }

                            // For non-crypto transactions: always show INR
                            return `₹${formatWithCommas(item?.feeAmount)}`;
                          })()}
                        </td>
                        {!cryptoEnable && (
                          <td className="wallet_username_cell">
                            {(() => {
                              const username = item?.nickName || '-';
                              const maxLength = 20;

                              if (username === '-' || username.length <= maxLength) {
                                return username;
                              }

                              const rowKey =
                                item?.userTrxId ||
                                item?.trxUrl ||
                                `${username}-${index}`;
                              const isExpanded = !!expandedUsernames[rowKey];
                              const displayText = isExpanded
                                ? username
                                : `${username.slice(0, maxLength)}...`;

                              return (
                                <span
                                  className={`wallet_username_wrapper ${isExpanded ? 'wallet_username_wrapper--expanded' : ''}`}
                                >
                                  <span className="wallet_username_text">
                                    {displayText}
                                  </span>
                                  <button
                                    type="button"
                                    className="wallet_username_toggle"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleUsername(rowKey);
                                    }}
                                  >
                                    {isExpanded ? 'View less' : 'View more'}
                                  </button>
                                </span>
                              );
                            })()}
                          </td>
                        )}
                        <td>
                          {(() => {
                            // For credit (Deposit) transactions
                            if (activeTab === 'Deposit') {
                              if (cryptoEnable) {
                                // Show trxUrl with redirect icon for crypto transactions
                                const transactionId = item?.trxUrl;
                                const showExplorerLink =
                                  transactionId && transactionId.trim();

                                return (
                                  <div className="tx_id_wrapper">
                                    <span>{formatTxId(transactionId) || '-'}</span>
                                    {showExplorerLink && (
                                      <a
                                        href={getExplorerUrl(transactionId)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="tx_external_link"
                                        title="View on explorer"
                                      >
                                        <ExternalLinkIcon />
                                      </a>
                                    )}
                                  </div>
                                );
                              } else {
                                // Show userTrxId without redirect icon for bank/UPI transactions
                                const transactionId = item?.userTrxId;
                                return (
                                  <div className="tx_id_wrapper">
                                    <span>{formatTxId(transactionId) || '-'}</span>
                                  </div>
                                );
                              }
                            } else {
                              const isWithdrawType = item?.trxType === 'Withdrawal';
                              const transactionStatus = item?.status;
                              const isPending = transactionStatus === 'Pending';
                              const isComplete = transactionStatus === 'Complete';

                              if (cryptoEnable) {
                                const transactionId =
                                  item?.trxUrl || item?.userTrxId;
                                const hasTransactionId =
                                  transactionId && transactionId.trim();

                                return (
                                  <div className="tx_id_wrapper">
                                    <span>{formatTxId(transactionId) || '-'}</span>
                                    {isWithdrawType && hasTransactionId && (
                                      <>
                                        {isPending && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              copyToClipboard(transactionId)
                                            }
                                            className="tx_copy_link"
                                            title="Copy transaction ID"
                                          >
                                            <CopyIcon />
                                          </button>
                                        )}
                                        {isComplete && (
                                          <a
                                            href={getExplorerUrl(transactionId)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="tx_external_link"
                                            title="View on explorer"
                                          >
                                            <ExternalLinkIcon />
                                          </a>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              } else {
                                // Show userTrxId for bank/UPI transactions
                                const transactionId = item?.userTrxId;
                                const hasTransactionId =
                                  transactionId && transactionId.trim();
                                // For non-crypto, only show copy icon for pending, no redirect for completed
                                const isCryptoTransaction =
                                  item?.trxUrl && item?.trxUrl.trim();

                                return (
                                  <div className="tx_id_wrapper">
                                    <span>{formatTxId(transactionId) || '-'}</span>
                                    {isWithdrawType && hasTransactionId && (
                                      <>
                                        {isPending && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              copyToClipboard(transactionId)
                                            }
                                            className="tx_copy_link"
                                            title="Copy transaction ID"
                                          >
                                            <CopyIcon />
                                          </button>
                                        )}
                                        {isComplete && isCryptoTransaction && (
                                          <a
                                            href={getExplorerUrl(
                                              item?.trxUrl || transactionId
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="tx_external_link"
                                            title="View on explorer"
                                          >
                                            <ExternalLinkIcon />
                                          </a>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              }
                            }
                          })()}
                        </td>
                        <td>
                          {item?.trxType === 'Withdrawal'
                            ? 'Withdraw'
                            : item?.trxType === 'Deposit'
                              ? 'Deposit'
                              : item?.trxType === 'Dividend'
                                ? 'Dividend'
                                : item?.trxType === 'Buy Order'
                                  ? 'Property Bought'
                                  : 'Property sell'}
                        </td>
                        <td>
                          {(() => {
                            if (!item?.openingBalance) return '0';

                            const isPropertyTransaction =
                              item?.trxType === 'Buy Order' ||
                              item?.trxType === 'Sell Order';
                            const isCrypto =
                              item?.paymentGateway === 'Crypto' ||
                              item?.paymentThrough === 'USDT';

                            // For Property transactions with USDT: show USDT if cryptoEnable is true, INR if false
                            if (isPropertyTransaction && isCrypto) {
                              return cryptoEnable
                                ? `${formatUSDTWithCommas(item?.openingBalance)} USDT`
                                : `₹${formatWithCommas(item?.openingBalance)}`;
                            }

                            // For regular USDT transactions: show USDT only if cryptoEnable is true
                            if (isCrypto) {
                              return cryptoEnable
                                ? `${formatUSDTWithCommas(item?.openingBalance)} USDT`
                                : `₹${formatWithCommas(item?.openingBalance)}`;
                            }

                            // For non-crypto transactions: always show INR
                            return `₹${formatWithCommas(item?.openingBalance)}`;
                          })()}
                        </td>
                        <td>
                          {(() => {
                            if (!item?.closingBalance) return '0';

                            const isPropertyTransaction =
                              item?.trxType === 'Buy Order' ||
                              item?.trxType === 'Sell Order';
                            const isCrypto =
                              item?.paymentGateway === 'Crypto' ||
                              item?.paymentThrough === 'USDT';

                            // For Property transactions with USDT: show USDT if cryptoEnable is true, INR if false
                            if (isPropertyTransaction && isCrypto) {
                              return cryptoEnable
                                ? `${formatUSDTWithCommas(item?.closingBalance)} USDT`
                                : `₹${formatWithCommas(item?.closingBalance)}`;
                            }

                            // For regular USDT transactions: show USDT only if cryptoEnable is true
                            if (isCrypto) {
                              return cryptoEnable
                                ? `${formatUSDTWithCommas(item?.closingBalance)} USDT`
                                : `₹${formatWithCommas(item?.closingBalance)}`;
                            }

                            // For non-crypto transactions: always show INR
                            return `₹${formatWithCommas(item?.closingBalance)}`;
                          })()}
                        </td>
                        <td>{formatDateTime(item?.createdAt)}</td>
                        <td>
                          <span
                            className={`act-btn ${
                              item?.status === 'Complete'
                                ? 'green'
                                : item?.status === 'Pending'
                                  ? 'yellow'
                                  : 'red'
                            }`}
                          >
                            {item?.status === 'Complete'
                              ? 'Completed'
                              : item?.status}
                          </span>
                        </td>
                      </tr>
                    )
                  )
                : null}
            </CommonTable>
            {totalCount > limit && (
              <CustomPagination
                handlePageChange={handlePageChange}
                pageCount={Math?.ceil(totalCount / limit)}
                forcePage={page - 1}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default wallet;
