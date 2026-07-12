import { ValueArrowIcon } from '../../../../../assets/icons/SvgIcon';
import './StatsCard.scss';

const StatsCard = ({
  className,
  icon,
  value,
  subtitle,
  change,
  valuecolor,
  onClick,
}: any) => {
  return (
    <div className="dashboard_statscard">
      <div className="dashboard_statscard_wrap">
        <div className={`dashboard_statscard_wrap_icon ${className || ''}`}>
          {icon}
        </div>
        <div className="dashboard_statscard_wrap_content">
          <p>{subtitle}</p>
          <h3
            onClick={onClick} 
            style={{ cursor: 'pointer' }} 
          >
            {value}
          </h3>
        </div>
      </div>
      {change && (
        <div className={`dashboard_statscard_value ${valuecolor || ''}`}>
          <ValueArrowIcon />
          <p>{change}</p>
        </div>
      )}
    </div>
  );
};
export default StatsCard;
