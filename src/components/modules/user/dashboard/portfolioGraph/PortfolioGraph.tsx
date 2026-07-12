import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import './PortfolioGraph.scss';
import { useDashboardData } from '../../../../../hooks/useDasboardData';
import { GraphFilter } from '../../../../../interfaces/dashboard/dashboardGraph';
import { formatCompactNumber, formatUSDTCompact } from '../../../../../helpers/user/maskEmail';
import { useSelector } from 'react-redux';
import { useUsdtPrice } from '../../../../../hooks/useUsdtPrice';

const menubar: { title: string; value: GraphFilter }[] = [
  { title: '1W', value: '1 Week' },
  { title: '1M', value: '1 Month' },
  { title: '1Y', value: '1 year' },
];

const PortfolioGraph = () => {
  const [active, setActive] = useState(0);
  const { fetchGraphData, graphData, graphLoading } = useDashboardData();
  const { usdtPrice } = useUsdtPrice();

  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);

  const chartData = useMemo(() => {
    if (!graphData?.graphData?.length) return [];
    return graphData.graphData.map((item) => {
      const inrVal = item.currentValuation ?? item.amount ?? 0;
      const current =
        cryptoEnable && usdtPrice && usdtPrice > 0
          ? inrVal / usdtPrice
          : inrVal;
      return { date: item.date, current };
    });
  }, [graphData, cryptoEnable, usdtPrice]);

  useEffect(() => {
    if (isLoggedIn) fetchGraphData('1 Week');
  }, [isLoggedIn, fetchGraphData]);

  const handleFilterClick = (index: number, filter: GraphFilter) => {
    if (active === index) return;
    setActive(index);
    fetchGraphData(filter);
  };

  const latestCurrent = chartData.length
    ? chartData[chartData.length - 1].current
    : 0;

  const formatGraphValue = (value: number) =>
    cryptoEnable
      ? `${formatUSDTCompact(value)} USDT`
      : `₹${formatCompactNumber(value)}`;

  return (
    <div className="portfolio_graph">
      <div className="portfolio_graph_head">
        <div className="portfolio_graph_head_left">
          <div className="gaph_value">
            <span></span>
            <div className="graph_value_cntnt">
              <p>Current</p>
              <h3>{formatGraphValue(latestCurrent)}</h3>
            </div>
          </div>
        </div>

        <ul>
          {menubar.map((item, index) => (
            <li key={item.title} className={active === index ? 'active' : ''}>
              <button
                type="button"
                onClick={() => handleFilterClick(index, item.value)}
                disabled={graphLoading}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {graphLoading ? (
        <p className="loading_text">Loading graph data...</p>
      ) : chartData.length === 0 ? (
        <div
          style={{
            height: '309px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          No Data Found
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={309}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="0" />
            <XAxis
              dataKey="date"
              interval={
                chartData.length > 15 ? Math.floor(chartData.length / 10) : 0
              }
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis
              tickFormatter={(value) =>
                cryptoEnable ? formatUSDTCompact(value) : formatCompactNumber(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                cryptoEnable
                  ? `${formatUSDTCompact(value)} USDT`
                  : `₹${formatCompactNumber(value)}`
              }
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="#4D5EAA"
              fill="#4D5EAA"
              fillOpacity={0.35}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PortfolioGraph;
