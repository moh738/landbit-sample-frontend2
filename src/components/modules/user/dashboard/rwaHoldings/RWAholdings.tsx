import RWAholdingsChart from './RWAholdingsChart';
import './RWAholdings.scss';
import { RWAholdingsProps } from '../../../../../interfaces/holiding/holiding';
const RWAholdings = ({ holdingData }: RWAholdingsProps) => {
  return (
    <div className="top_holdings">
      <div className="top_holdings_head">
        <h4>Top 5 Appreciation Holding Value</h4>
      </div>
      <RWAholdingsChart holdingData={holdingData} />
    </div>
  );
};
export default RWAholdings;
