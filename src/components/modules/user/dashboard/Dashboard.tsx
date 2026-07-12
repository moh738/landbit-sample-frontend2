import { Col, Row } from 'react-bootstrap';
import TrendingInvestments from './trendingInvestments/trendingInvestments';
import PortfolioGraph from './portfolioGraph/PortfolioGraph';
import RWAholdings from './rwaHoldings/RWAholdings';
import {
  DiamondIcon,
  // RentalIcon,
  ReturnIcon,
  TotalInvestmentsIcon,
} from '../../../../assets/icons/SvgIcon';
import StatsCard from './statsCard/StatsCard';
import './Dashboard.scss';
import { useDashboardData } from '../../../../hooks/useDasboardData';
import { useEffect, useRef, useState } from 'react';
import { formatCompactNumber, safeNumber, formatUSDTWithCommas, formatUSDTCompact } from '../../../../helpers/user/maskEmail';
import CustomTooltip from '../../../ui/customTooltip/CustomTooltip';
import { useSelector } from 'react-redux';
import { useUsdtPrice } from '../../../../hooks/useUsdtPrice';
const Dashboard = () => {
  const { fetchDashboardDetails } = useDashboardData();
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const { usdtPrice } = useUsdtPrice();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [holdingData, setHoldingData] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index: any) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const hasFetched = useRef(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const res = await fetchDashboardDetails();
        setDashboardData(res?.data?.stats);
        setHoldingData(res?.data?.holdings || []);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      }
    };

    if (!hasFetched.current) {
      hasFetched.current = true;
      loadDashboardData();
    }
  }, []);


  const inrCurrentValue = Number(dashboardData?.currentValue || 0);
  
  const currentValue = cryptoEnable && usdtPrice && usdtPrice > 0
    ? inrCurrentValue / usdtPrice
    : inrCurrentValue;
  const totalInvested = cryptoEnable
    ? Number(dashboardData?.usdtTotalInvested || dashboardData?.totalInvested || 0)
    : Number(dashboardData?.totalInvested || 0);

  const totalReturn = currentValue - totalInvested;
  const totalReturnSafe = safeNumber(totalReturn);
  

  const percentageChange =
    totalInvested && totalInvested !== 0
      ? ((totalReturn / totalInvested) * 100).toFixed(2)
      : '0';


  const formatFullNumber = (num: any) => {
    if (num === null || num === undefined) return '0.00';
    const numValue = Number(num);
    if (isNaN(numValue)) return '0.00';

    const str = numValue.toString();
    const [integerPartRaw, decimalPartRaw = ''] = str.split('.');

    const formattedInteger = Number(integerPartRaw || '0').toLocaleString('en-IN');
    const paddedDecimals = (decimalPartRaw + '00').slice(0, 2);

    return `${formattedInteger}.${paddedDecimals}`;
  };

  // Format value based on cryptoEnable - using centralized crypto format functions
  // When crypto is enabled, use USDT values directly from API (no conversion)
  const formatValue = (value: number, isExpanded: boolean) => {
    if (cryptoEnable) {
      // Use centralized formatting functions for USDT
      if (isExpanded) {
        const formatted = formatUSDTWithCommas(value);
        return `${formatted} USDT`;
      } else {
        const formatted = formatUSDTCompact(value);
        return `${formatted} USDT`;
      }
    } else {
      // INR case - same as before
      if (isExpanded) {
        return `₹${formatFullNumber(safeNumber(value))}`;
      }
      return `₹${formatCompactNumber(safeNumber(value))}`;
    }
  };

  // Format full value for tooltip - using centralized crypto format functions
  const formatFullValue = (value: number) => {
    if (cryptoEnable) {
      const formatted = formatUSDTWithCommas(value);
      return `${formatted} USDT`;
    } else {
      return `₹${formatFullNumber(safeNumber(value))}`;
    }
  };



  const data = [
    {
      icon: <DiamondIcon />,
      value: (
        <>
          {formatValue(safeNumber(currentValue), expandedIndex === 0)}
          {CustomTooltip(formatFullValue(safeNumber(currentValue)))}
        </>
      ),
      subtitle: 'Current Value',
      change: `${Number(percentageChange) > 0 ? '+' : ''}${percentageChange}%`,
      valuecolor:
        typeof totalReturn === 'number' && !isNaN(totalReturn)
          ? totalReturn > 0
            ? 'success'
            : totalReturn < 0
              ? 'danger'
              : 'neutralclr'
          : 'neutralclr',
      onClick: () => toggleExpand(0),
    },

    {
      icon: <TotalInvestmentsIcon />,
      value: (
        <>
          {formatValue(safeNumber(totalInvested), expandedIndex === 1)}
          {CustomTooltip(formatFullValue(safeNumber(totalInvested)))}
        </>
      ),
      subtitle: 'Total Invested',
      className: 'lightblueclr',
      onClick: () => toggleExpand(1),
    },

    {
      icon: <ReturnIcon />,
      value: (
        <>
          {totalReturn === 0 || totalReturn === undefined || isNaN(totalReturn)
            ? cryptoEnable
              ? `${formatUSDTCompact(0)} USDT`
              : '₹0'
            : (() => {
                const absValue = Math.abs(totalReturnSafe);
                const formattedValue = formatValue(absValue, expandedIndex === 2);
                const sign = totalReturnSafe > 0 ? '+' : '-';
                return `${sign}${formattedValue}`;
              })()}

          {CustomTooltip(
            totalReturnSafe === 0
              ? cryptoEnable
                ? `${formatUSDTWithCommas(0)} USDT`
                : '₹0.00'
              : (() => {
                  const absValue = Math.abs(totalReturnSafe);
                  const formattedValue = formatFullValue(absValue);
                  const sign = totalReturnSafe > 0 ? '+' : '-';
                  return `${sign}${formattedValue}`;
                })()
          )}
        </>
      ),
      subtitle: 'Total Return',
      className:
        totalReturn === 0 || totalReturn === undefined || isNaN(totalReturn)
          ? 'lightpurpleclr'
          : totalReturn > 0
            ? 'neutralclr'
            : 'errorclr',
      onClick: () => toggleExpand(2),
    },
  ];

  return (
    <section className="dashboard">
      <div className="dashboard_valuecard">
        <Row className="mb-4 mb-md-0">
          {data?.map((item, index) => (
            <Col key={index} xxl={4} lg={4} xs={6}>
              <StatsCard
                icon={item?.icon}
                value={item?.value}
                subtitle={item?.subtitle}
                change={item?.change}
                className={item?.className}
                valuecolor={item?.valuecolor}
              />
            </Col>
          ))}
        </Row>
      </div>
      <Row className="dashboard_middle_row mb-4 mb-lg-0">
        <Col lg={7}>
          <PortfolioGraph />
        </Col>
        <Col lg={5}>
          <RWAholdings holdingData={holdingData} />
        </Col>
      </Row>
      <TrendingInvestments />
    </section>
  );
};
export default Dashboard;
