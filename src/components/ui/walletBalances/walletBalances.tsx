import {
  BTCicon,
  ETHicon,
  GraphUpIcon,
  TETHicon,
  TRONicon,
} from '../../../assets/icons/SvgIcon';
import CommonButton from '../commonButton/CommonButton';
import './walletBalance.scss';

const WalletBalances = () => {
  const Data = [
    {
      name: 'Ethereum',
      symbol: <ETHicon />,
      price: 2611.35,
      change: '+6.12%',
      graphVal: '+6.12%',
      amount: 0.005702,
      total: 0.15,
    },
    {
      name: 'Bitcoin',
      symbol: <BTCicon />,
      price: 74946.77,
      change: '+8.12%',
      graphVal: '+6.12%',
      amount: 0.9904,
      total: 74227.28,
    },
    {
      name: 'Tether',
      symbol: <TETHicon />,
      price: 1,
      change: '+2.12%',
      graphVal: '+6.12%',
      amount: 100,
      total: 100.06,
    },
    {
      name: 'Tron',
      symbol: <TRONicon />,
      price: 0.06,
      change: '+2.12%',
      graphVal: '+6.12%',
      amount: 25000,
      total: 1500,
    },
  ];
  return (
    <div className="wallet_balance">
      <div className="wallet_balance_head">
        <h4>Wallet Balances</h4>
        <CommonButton
          title={'View All'}
          role="link"
          to={'#'}
          className="btn-small"
        />
      </div>
      <ul className="wallet_balance_list">
        {Data?.map((item) => (
          <li key={item?.name}>
            <div className="wallet_balance_icon">{item?.symbol}</div>
            <div className="wallet_balance_details">
              <span className="crypto_name">{item?.name}</span>
              <span className="crypto_change">{item?.change}</span>
            </div>
            <div className="wallet_balance_graphvalue">
              <GraphUpIcon /> <span>{item?.graphVal}</span>
            </div>
            <div className="wallet_balance_amount">
              <span className="amt">{item?.amount}</span>
              <span className="total">${item?.total.toFixed(2)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default WalletBalances;
