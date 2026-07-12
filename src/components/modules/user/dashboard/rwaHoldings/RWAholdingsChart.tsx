import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Cell,
  Tooltip,
  LabelList,
} from 'recharts';
import { RWAholdingsChartProps } from '../../../../../interfaces/holiding/holiding';
import { formatCompactNumber, formatUSDTCompact, formatUSDTWithCommas } from '../../../../../helpers/user/maskEmail';
import { useSelector } from 'react-redux';
import { useUsdtPrice } from '../../../../../hooks/useUsdtPrice';

const RWAholdingsChart = ({ holdingData }: RWAholdingsChartProps) => {
  const { cryptoEnable } = useSelector((state: RootState) => state.user.profile);
  const { usdtPrice } = useUsdtPrice();
  const colors = ['#E3EBF6', '#A1B6ED', '#8295C8', '#96D4ED', '#C0A5EE'];
  // const formatAmount = (amount: number | undefined | null): string => {
  //   if (amount == null || isNaN(amount)) return '₹0';
  //   if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  //   if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  //   if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
  //   return `₹${amount.toLocaleString()}`;
  // };
  // Helper function to format amount based on cryptoEnable
  // Receives the display amount (already converted to USDT if cryptoEnable is true, otherwise INR)
  const formatAmount = (displayValue: number): string => {
    if (cryptoEnable && usdtPrice && usdtPrice > 0) {
      // displayValue is already in USDT, just format it
      return `${formatUSDTCompact(displayValue)} USDT`;
    }
    // displayValue is in INR, format it
    return `₹${formatCompactNumber(displayValue)}`;
  };

  // Helper function to format amount for tooltip (with commas)
  // Always uses original INR value and converts if needed
  const formatAmountForTooltip = (inrValue: number): string => {
    if (cryptoEnable && usdtPrice && usdtPrice > 0) {
      const usdtValue = inrValue / usdtPrice;
      return `${formatUSDTWithCommas(usdtValue)} USDT`;
    }
    return `₹${formatCompactNumber(inrValue)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.fullName}</p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            Amount: {formatAmountForTooltip(data.originalAmount || data.amount)}
          </p>
        </div>
      );
    }
    return null;
  };

  const data =
    holdingData && holdingData.length > 0
      ? holdingData
          .filter((item) => item && item.amount != null && !isNaN(item.amount))
          .slice(0, 5)
          .map((item) => {
            const inrAmount = item?.amount || 0;
            const displayAmount = cryptoEnable && usdtPrice && usdtPrice > 0
              ? inrAmount / usdtPrice
              : inrAmount;
            return {
              name:
                item.propertyName.length > 10
                  ? `${item.propertyName.substring(0, 10)}...`
                  : item.propertyName,
              amount: displayAmount,
              originalAmount: inrAmount, // Keep original for tooltip formatting
              fullName: item?.propertyName,
            };
          })
      : [];
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: '280px',
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
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart width={50} height={4000} data={data}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" fill="#A1B6ED" radius={[50, 50, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
          <LabelList
            dataKey="amount"
            position="top"
            formatter={(value: any) => formatAmount(value)}
            style={{ fontSize: 12, fontWeight: 500, fill: '#000' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RWAholdingsChart;
