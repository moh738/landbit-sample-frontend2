import { PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0069FF', '#00BA66', '#0069FF1A'];

const CalculatorPieChart = ({ data }: any) => {
  return (
    <PieChart width={258} height={258}>
      <Pie
        data={data}
        dataKey="value"
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={128}
        paddingAngle={0}
      >
        {data?.map((_entry: any, index: number) => (
          <Cell
            key={`cell-${index}`}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </Pie>
    </PieChart>
  );
};

export default CalculatorPieChart;
