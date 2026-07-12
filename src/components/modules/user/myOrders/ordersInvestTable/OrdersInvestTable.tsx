import CommonButton from '../../../../ui/commonButton/CommonButton';
import dark_square from '../../../../../assets/images/icons/dark_square.svg';
import CommonTable from '../../../../ui/commonTable/CommonTable';
import CommonFilter from '../../../../common/commonFilter/CommonFilter';
import './OrdersInvestTable.scss';

const OrdersInvestTable = () => {
  const fields = [
    'Property/Equity Name',
    'Order ID',
    'Quantity',
    'Amount',
    'Fee',
    'Total Amount',
    'Date',
    'Payment Method',
    'Status',
    'Action',
  ];
  const data = [
    {
      icon: dark_square,
      detail: 'Singapore Business District',
      subtitle: 'New York, NY',
      orderid: 'ORD-2024-001',
      nftid: 'NFT: NFT-001-500',
      quantity: '500 tokens',
      amount: '₹2,500',
      fee: '₹250',
      totalamount: '₹2,250',
      date: '15/01/2024',
      time: '12:00:00',
      paymentmethod: 'Bank Transfer',
      Status: 'Completed',
    },
    {
      icon: dark_square,
      detail: 'Singapore Business District',
      subtitle: 'New York, NY',
      orderid: 'ORD-2024-001',
      nftid: 'NFT: NFT-001-500',
      quantity: '500 tokens',
      amount: '₹2,500',
      fee: '₹250',
      totalamount: '₹2,250',
      date: '15/01/2024',
      time: '12:00:00',
      paymentmethod: 'Bank Transfer',
      Status: 'Pending',
      disabled: true,
    },
    {
      icon: dark_square,
      detail: 'Singapore Business District',
      subtitle: 'New York, NY',
      orderid: 'ORD-2024-001',
      nftid: 'NFT: NFT-001-500',
      quantity: '500 tokens',
      amount: '₹2,500',
      fee: '₹250',
      totalamount: '₹2,250',
      date: '15/01/2024',
      time: '12:00:00',
      paymentmethod: 'Bank Transfer',
      Status: 'Rejected',
      disabled: true,
    },
    {
      icon: dark_square,
      detail: 'Singapore Business District',
      subtitle: 'New York, NY',
      orderid: 'ORD-2024-001',
      nftid: 'NFT: NFT-001-500',
      quantity: '500 tokens',
      amount: '₹2,500',
      fee: '₹250',
      totalamount: '₹2,250',
      date: '15/01/2024',
      time: '12:00:00',
      paymentmethod: 'Bank Transfer',
      Status: 'Completed',
    },
  ];

  const paymentType = [
    { value: 'inr', label: 'INR (₹)' },
    { value: 'usdt', label: 'USDT ($)' },
    // { value: 'usdc', label: 'USDC ($)' },
  ];

  return (
    <div className="ordersinvest_table">
      <CommonFilter
        SearchField
        searchplaceholder="Search Transactions"
        statusfield={paymentType}
        statusplacehoder="Payment Types"
        btntitle="Export CSV"
        className="filters_space"
      />
      <CommonTable className="invest_table" fields={fields} lastColumnWidth="140px">
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
            <td>
              <div className="order_id">
                <h5>{item.orderid}</h5>
                <span>{item.nftid}</span>
              </div>
            </td>
            <td>{item.quantity}</td>
            <td>{item.amount}</td>
            <td>{item.fee}</td>
            <td>{item.totalamount}</td>
            <td>
              <div className="order_id">
                <h5>{item.date}</h5>
                <span>{item.time}</span>
              </div>
            </td>
            <td>{item.paymentmethod}</td>
            <td>
              <span
                className={`act-btn ${
                  item.Status === 'Completed'
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
              {(item.Status === 'Completed' ||
                item.Status === 'Pending' ||
                item.Status === 'Rejected') && (
                <CommonButton
                  title="View NFT"
                  className="btn-secondry"
                  disabled={item.disabled}
                />
              )}

              {/* {item.Status === 'Draft' && (
                <CommonButton
                  className="transparent_btn"
                  svgIcon={<DraftIcon />}
                  disabled={item.disabled}
                />
              )} */}
            </td>
          </tr>
        ))}
      </CommonTable>
    </div>
  );
};

export default OrdersInvestTable;
