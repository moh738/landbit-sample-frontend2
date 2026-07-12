import CommonButton from '../../../../ui/commonButton/CommonButton';
import dark_square from '../../../../../assets/images/icons/dark_square.svg';
import CommonTable from '../../../../ui/commonTable/CommonTable';
import './AdvisorRequestTable.scss';

const AdvisorRequestTable = () => {
  const fields = ['Property/Equity Name', 'Date & Time', 'Status', 'Type', 'Action'];
  const data = [
    {
      icon: dark_square,
      detail: 'Manhattan Commercial Tower',
      subtitle: 'Park Avenue, Manhattan, NY',
      date: '15/01/2025 | 11:11',
      Status: 'Advisor Assigned',
      type: 'Advisory Request',
    },
    {
      icon: dark_square,
      detail: 'Manhattan Commercial Tower',
      subtitle: 'Park Avenue, Manhattan, NY',
      date: '15/01/2025 | 11:11',
      Status: 'Pending Request',
      type: 'Site Visit Request',
      disabled: true,
    },
    {
      icon: dark_square,
      detail: 'Manhattan Commercial Tower',
      subtitle: 'Park Avenue, Manhattan, NY',
      date: '15/01/2025 | 11:11',
      Status: 'Advisor Assigned',
      type: 'Advisory Request',
    },
    {
      icon: dark_square,
      detail: 'Manhattan Commercial Tower',
      subtitle: 'Park Avenue, Manhattan, NY',
      date: '15/01/2025 | 11:11',
      Status: 'Pending Request',
      type: 'Site Visit Request',
      disabled: true,
    },
  ];

  return (
    <div className="property_table">
      <CommonTable className="advisor_table" fields={fields} lastColumnWidth="140px">
        {data?.map((item: any, index: number) => (
          <tr key={index}>
            <td>
              <div className="offering_txt">
                <span className="ofertoken_img square">
                  <img src={item.icon} alt="ellipse_img" />
                </span>
                <div className="offering_txt_inner">
                  <h5>{item.detail}</h5>
                  <span>{item.subtitle}</span>
                </div>
              </div>
            </td>
            <td>{item.date}</td>
            <td>
              <span
                className={`act-btn ${
                  item.Status === 'Advisor Assigned'
                    ? 'green'
                    : item.Status === 'Pending Request'
                      ? 'orange'
                      : ''
                }`}
              >
                {item.Status}
              </span>
            </td>
            <td>{item.type}</td>
            <td>
              <CommonButton
                title="View Advisory Detail"
                className="btn-secondry"
                disabled={item.disabled}
              />
            </td>
          </tr>
        ))}
      </CommonTable>
    </div>
  );
};

export default AdvisorRequestTable;
