import dayjs from 'dayjs';
import { NoRecordIcon } from '../../../../assets/icons/SvgIcon';
import CommonFilter from '../../../common/commonFilter/CommonFilter';
import CommonTable from '../../../ui/commonTable/CommonTable';
import { formatReferralPoints } from '../../../../helpers/user/maskEmail';

interface ReferralCommissionTableProps {
  referralCommissionList: any;
  onFilterChange?: (filters: { search?: string; startDate?: any; endDate?: any; }) => void;
  onExportCSVClick?: () => void;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}
const today = new Date();
const minDate = new Date(2025, 9, 1);

const ReferralCommissionTable = ({ referralCommissionList, onFilterChange, onExportCSVClick, searchQuery, startDate, endDate }: ReferralCommissionTableProps) => {

  const initialValues = {
    search: searchQuery || '',
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
  };

  const fields = ['Name', 'Email', 'Joining Date', 'Total Commission Earned'];
 
  return (
    <div className="referralcomm_table">
      <CommonFilter
        SearchField
        searchplaceholder="Search Transactions"
        startDate
        endDate
        btntitle="Export CSV"
        btnClick={() => onExportCSVClick?.()}
        btnDisabled={!referralCommissionList?.rows?.length}
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
        {referralCommissionList?.rows?.length > 0 ? referralCommissionList?.rows?.map((item: any, index: number) => (
          <tr key={index}>
            <td>{item?.fullName}</td>
            <td>{item?.email}</td>
            <td>{dayjs(item?.createdAt).format("MM-DD-YYYY")}</td>
            <td>{formatReferralPoints(item?.referralAmount)}</td>
          </tr>
        )) : (
          <tr>
            <td colSpan={fields.length} className="no_record_box">
              <NoRecordIcon />
              <p>No Record Found</p>
            </td>
          </tr>
        )}
      </CommonTable>
    </div>
  );
};

export default ReferralCommissionTable;
