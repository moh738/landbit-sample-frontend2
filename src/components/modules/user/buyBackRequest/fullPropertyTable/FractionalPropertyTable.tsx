import CommonButton from '../../../../ui/commonButton/CommonButton';
import property_icon from '../../../../../assets/images/icons/property_icon.svg';
import CommonTable from '../../../../ui/commonTable/CommonTable';
import CommonFilter from '../../../../common/commonFilter/CommonFilter';
import './FullPropertyTable.scss';

const FractionalPropertyTable = () => {
  const fields = [
    'Property Name',
    'Property Type',
    'Record Date',
    'Total Token Request',
    'Buyback Price(₹)',
    'Currency',
    'Status',
    'Action',
  ];
  const data = [
    {
      icon: property_icon,
      detail: 'Premium Complex',
      type: 'Full Ownership',
      date: '15/01/2025 | 11:11',
      token: '10,000',
      price: '₹10,000',
      currency: 'INR',
      Status: 'Pending',
    },
    {
      icon: property_icon,
      detail: 'Premium Complex',
      type: 'Full Ownership',
      date: '15/01/2025 | 11:11',
      token: '10,000',
      price: '₹10,000',
      currency: 'INR',
      Status: 'Approved',
    },
    {
      icon: property_icon,
      detail: 'Premium Complex',
      type: 'Full Ownership',
      date: '15/01/2025 | 11:11',
      token: '10,000',
      price: '₹10,000',
      currency: 'INR',
      Status: 'Pending',
    },
    {
      icon: property_icon,
      detail: 'Premium Complex',
      type: 'Full Ownership',
      date: '15/01/2025 | 11:11',
      token: '10,000',
      price: '₹10,000',
      currency: 'INR',
      Status: 'Rejected',
    },
  ];

  const statusfield = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'InActive' },
  ];

  return (
    <div className="fullproperty_table">
      <CommonFilter
        SearchField
        searchplaceholder="Search Transactions"
        statusfield={statusfield}
        // startdate
        // endDate
        className="filters_space"
      />
      <CommonTable className="buyback_table" fields={fields} lastColumnWidth="140px">
        {data?.map((item: any, index: number) => (
          <tr key={index}>
            <td>
              <div className="offering_txt">
                <span className="ofertoken_img square">
                  <img src={item.icon} alt="ellipse_img" />
                </span>
                <div className="offering_txt_inner">
                  <h5>{item.detail}</h5>
                </div>
              </div>
            </td>
            <td>{item.type}</td>
            <td>{item.date}</td>
            <td>{item.token}</td>
            <td>{item.price}</td>
            <td>{item.currency}</td>
            <td>
              <span
                className={`act-btn ${
                  item.Status === 'Approved'
                    ? 'green'
                    : item.Status === 'Pending'
                      ? 'orange'
                      : item.Status === 'Rejected'
                        ? 'red'
                        : ''
                }`}
              >
                {item.Status}
              </span>
            </td>
            <td>
              {item.Status === 'Pending' && (
                <div className="btn_grp">
                  <CommonButton
                    title="Accept"
                    className="green_btn"
                    disabled={item.disabled}
                  />
                  <CommonButton
                    title="Reject"
                    className="red_btn"
                    disabled={item.disabled}
                  />
                </div>
              )}
            </td>
          </tr>
        ))}
      </CommonTable>
    </div>
  );
};

export default FractionalPropertyTable;
