// import CommonTable from '../../../../ui/commonTable/CommonTable';
// import CommonFilter from '../../../../common/commonFilter/CommonFilter';
// import { useCallback, useEffect, useState } from 'react';
// import { useFetchTransactionHistory } from '../../../../../hooks/useFetchTransactionHistory';
// import {
//   formatCurrency,
//   formatDateTime,
//   formatTxId,
// } from '../../../../../helpers/user/maskEmail';
// import {
//   Transaction,
//   WalletTableProps,
// } from '../../../../../interfaces/wallet/wallet';
// import CustomPagination from '../../../../common/customPagination/CustomPagination';
// import { limit } from '../../../../../constants/modules/onBoarding/marketPlaceConstants';

// const WalletTable = ({ activeTab }: WalletTableProps) => {
//   const budgetfield = [
//     { value: 'All', label: 'All' },
//     { value: 'Completed', label: 'Completed' },
//     { value: 'Pending', label: 'Pending' },
//     { value: 'Failed', label: 'Failed' },
//   ];
//   const currencyfield = [
//     { value: 'inr', label: 'INR' },
//     // { value: 'usdc', label: 'USDC' },
//     // { value: 'usdt', label: 'USDT' },
//   ];

//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [filterValues, setFilterValues] = useState<any>({
//     status: budgetfield[0],
//     currency: currencyfield[0],
//   });
//   const [totalCount, setTotalCount] = useState<number>(0);
//   const [page, setPage] = useState<number>(1);
//   // const [searchTerm, setSearchTerm] = useState<any>('');
//   const fields = [
//     'Amount',
//     'Nick Name',
//     'Transaction ID',
//     'createdAt',
//     // 'Proof',
//     'Status',
//   ];

//   const handleFilterChange = (values: any) => {
//     setPage(1);
//     setFilterValues(values);
//   };

//   const { fetchTransactionHistory } = useFetchTransactionHistory();
//   const fetchTransactions = useCallback(
//     async (customPage = page, customFilters = filterValues) => {
//       try {
//         const params: any = {
//           trxType: activeTab,
//           page: customPage,
//           limit,
//         };
//         if (customFilters?.status?.value)
//           params.status = customFilters?.status?.value || budgetfield[0];

//         //  if (customFilters?.currency?.value) {
//         //    params.currency = customFilters.currency.value;
//         //  }
//         const res = await fetchTransactionHistory(params);
//         console.log('Transaction history:', res);

//         if (res?.success && res?.data) {
//           setTransactions(res.data);
//           setTotalCount(res?.total);
//         } else {
//           setTransactions([]);
//         }
//       } catch (error) {
//         console.error('Error fetching transaction history:', error);
//         setTransactions([]);
//       }
//     },
//     [activeTab, fetchTransactionHistory, filterValues, page]
//   );

//   useEffect(() => {
//     fetchTransactions();
//   }, [fetchTransactions]);

//   const handlePageChange = (selected: { selected: number }) => {
//     const newPage = selected?.selected + 1;
//     setPage(newPage);
//   };

//   const handleDownloadCSV = () => {
//     if (!transactions.length) return;

//     const headers = [
//       'Amount',
//       'Nick Name',
//       'Transaction ID',
//       'Created At',
//       'Status',
//     ];
//     const rows = transactions?.map((item: any) => [
//       item?.amount,
//       item?.nickName || '',
//       item?.trxId,
//       formatDateTime(item.createdAt),
//       item?.status,
//     ]);

//     const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `transactions_${Date.now()}.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <div className="wallet_table">
//       <CommonFilter
//         statusfield={budgetfield}
//         currencytype={currencyfield}
//         onFilterChange={handleFilterChange}
//         initialValues={filterValues}
//         btntitle="Reset Filter"
//         btnClick={() => {
//           const resetFilters = {
//             status: budgetfield[0],
//             currency: currencyfield[0],
//           };
//           setFilterValues(resetFilters);
//           setPage(1);
//           // fetchProperty(1, resetFilters);
//         }}
//         btnDisabled={filterValues?.status?.value === budgetfield[0]?.value}
//         csvBtnTitle="Export CSV"
//         onCsvClick={handleDownloadCSV}
//         csvDisabled={!transactions?.length}
//       />
//       <CommonTable className="wallet_table" fields={fields} lastColumnWidth="140px">
//         {transactions?.length > 0
//           ? transactions?.map((item: any, index: number) => (
//               <tr key={index}>
//                 <td>{formatCurrency(item?.amount)}</td>
//                 <td>{item?.nickName}</td>
//                 <td>{formatTxId(item?.trxId)}</td>
//                 <td>{formatDateTime(item?.createdAt)}</td>
//                 {/* <td>
//                 <span>
//                   <EyeIcon />
//                 </span>
//               </td> */}
//                 <td>
//                   <span
//                     className={`act-btn ${
//                       item?.status === 'Completed'
//                         ? 'green'
//                         : item?.status === 'Pending'
//                           ? 'yellow'
//                           : 'red'
//                     }`}
//                   >
//                     {item?.status}
//                   </span>
//                 </td>
//               </tr>
//             ))
//           : null}
//       </CommonTable>
//       {totalCount > limit && (
//         <CustomPagination
//           handlePageChange={handlePageChange}
//           pageCount={Math.ceil(totalCount / limit)}
//           forcePage={page - 1}
//         />
//       )}
//     </div>
//   );
// };

// export default WalletTable;
