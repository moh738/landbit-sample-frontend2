import CommonFilter from '../../../common/commonFilter/CommonFilter';
import CommonTable from '../../../ui/commonTable/CommonTable';
import { NoRecordIcon } from '../../../../assets/icons/SvgIcon';
import dayjs from 'dayjs';
import { formatReferralPoints } from '../../../../helpers/user/maskEmail';

interface ReferralHistoryTableProps {
  referralHistoryList: any;
  onFilterChange?: (filters: { search?: string; startDate?: any; endDate?: any; }) => void;
  onExportCSVClick?: () => void;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}
const today = new Date();
const minDate = new Date(2025, 9, 1);

const ReferralHistoryTable = ({ referralHistoryList, onFilterChange, onExportCSVClick, searchQuery, startDate, endDate }: ReferralHistoryTableProps) => {

  const initialValues = {
    search: searchQuery || '',
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
  };

  const fields = [
    'Property/Equity Name',
    'Name',
    'Email',
    'Transaction Type',
    'Invested Amount',
    'Commission Earned',
    'Date',
  ];

  return (
    <div className="referralhistory_table">
      <CommonFilter
        SearchField
        searchplaceholder="Search Transactions"
        startDate
        endDate
        btntitle="Export CSV"
        btnClick={() => onExportCSVClick?.()}
        btnDisabled={!referralHistoryList?.rows?.length}
        className="filters_space"
        clearFiltersBtnTitle="Clear Filters"
        onClearFiltersClick={() => onFilterChange?.({ search: '', startDate: null, endDate: null })}
        clearFiltersBtnDisabled={!searchQuery && !startDate && !endDate}
        onFilterChange={onFilterChange}
        initialValues={initialValues}
        startDateMin={minDate}
        startDateMax={today}
        endDateMin={minDate}
        endDateMax={today}
      />
      <CommonTable className="buyback_table" fields={fields} lastColumnWidth="140px">
        {referralHistoryList?.rows?.length > 0 ? referralHistoryList?.rows?.map((item: any, index: number) => (
          <tr key={index}>
            <td>
              <div className="offering_txt">
                <div className="offering_txt_inner">
                  <h5>{item?.propertyName}</h5>
                </div>
              </div>
            </td>
            <td>{item?.fullName}</td>
            <td>{item?.email}</td>
            <td>{item?.trxType}</td>
            <td>{item?.txnAmount}</td>
            <td>{formatReferralPoints(item?.referralAmount)}</td>
            <td>{dayjs(item?.date).format("MM-DD-YYYY")}</td>
          </tr>
        )) : (
          <tr>
            <td colSpan={fields?.length} className="no_record_box">
              <NoRecordIcon />
              <p>No Record Found</p>
            </td>
          </tr>
        )}
      </CommonTable>
    </div>
  );
};

export default ReferralHistoryTable;
