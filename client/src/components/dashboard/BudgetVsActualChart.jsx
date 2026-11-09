import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import Card from '../common/Card';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function BudgetVsActualChart({ data = [] }) {
  const { isDark } = useTheme();
  const { formatRawCurrency, getCurrencySymbol } = useCurrency();
  const symbol = getCurrencySymbol();

  // If no data
  if (!data || data.length === 0) {
    return (
      <Card
        title="Category Budget vs Actual Spending"
        subtitle="Comparing allocated limits against actual spend"
      >
        <div className="h-72 w-full flex items-center justify-center text-xs text-[#526C78] dark:text-[#83BDCF]">
          No category budgets configured yet. Configure budgets to see comparative analytics.
        </div>
      </Card>
    );
  }

  const chartData = data.map((b) => ({
    name: b.categoryName?.length > 12 ? b.categoryName.slice(0, 10) + '...' : b.categoryName,
    fullName: b.categoryName,
    Budget: b.limit,
    Actual: b.spent,
    isOverBudget: b.isOverBudget,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#203D49] p-3 border border-[#C4DCE3] dark:border-[#365765] rounded-xl shadow-lg text-xs space-y-1.5 min-w-[160px]">
          <p className="font-semibold text-[#243D49] dark:text-[#EAF4F7] pb-1 border-b border-[#C4DCE3] dark:border-[#365765]">
            {item.fullName || label}
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[#526C78] dark:text-[#C0D5DC]">
              <span className="w-2 h-2 rounded-full bg-[#629BB5]" />
              Allocated Budget:
            </span>
            <span className="font-semibold text-[#243D49] dark:text-[#EAF4F7]">
              {formatRawCurrency(item.Budget)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[#526C78] dark:text-[#C0D5DC]">
              <span className={`w-2 h-2 rounded-full ${item.isOverBudget ? 'bg-rose-500' : 'bg-[#447F98]'}`} />
              Actual Spent:
            </span>
            <span className={`font-semibold ${item.isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-[#243D49] dark:text-[#EAF4F7]'}`}>
              {formatRawCurrency(item.Actual)}
            </span>
          </div>
          <div className="pt-1 border-t border-[#C4DCE3]/60 dark:border-[#365765]/60 text-[11px] text-[#526C78] dark:text-[#83BDCF] flex items-center justify-between">
            <span>Utilization:</span>
            <span className={`font-bold ${item.isOverBudget ? 'text-rose-600' : 'text-[#447F98]'}`}>
              {item.Budget > 0 ? Math.round((item.Actual / item.Budget) * 100) : 0}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Category Budget vs Actual Spending"
      subtitle="Comparing allocated limits against actual spend"
    >
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#365765' : '#C4DCE3'}
              opacity={0.6}
            />
            <XAxis
              dataKey="name"
              stroke={isDark ? '#83BDCF' : '#526C78'}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#365765' : '#C4DCE3' }}
            />
            <YAxis
              stroke={isDark ? '#83BDCF' : '#526C78'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${symbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Bar
              dataKey="Budget"
              name="Budget Limit"
              fill={isDark ? '#629BB5' : '#83BDCF'}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Actual"
              name="Actual Spent"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isOverBudget ? '#E11D48' : '#447F98'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

