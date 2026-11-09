import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from '../common/Card';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function SpendingTrendChart({ data = [] }) {
  const { isDark } = useTheme();
  const { formatRawCurrency, getCurrencySymbol } = useCurrency();
  const symbol = getCurrencySymbol();

  // Custom clean tooltip matching SpendWise aesthetic
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#203D49] p-3 border border-[#C4DCE3] dark:border-[#365765] rounded-xl shadow-lg text-xs space-y-1.5 min-w-[140px]">
          <p className="font-semibold text-[#243D49] dark:text-[#EAF4F7] pb-1 border-b border-[#C4DCE3] dark:border-[#365765]">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[#526C78] dark:text-[#C0D5DC]">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-semibold text-[#243D49] dark:text-[#EAF4F7]">
                {formatRawCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Monthly Cashflow & Spending Trends"
      subtitle="Dynamic daily income and expense activity"
    >
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#329B78" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#329B78" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C87575" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#C87575" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#365765' : '#C4DCE3'}
            />
            <XAxis
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#C0D5DC' : '#526C78', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#C0D5DC' : '#526C78', fontSize: 11 }}
              tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#329B78"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#incomeGradient)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Expenses"
              stroke="#C87575"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#expenseGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#C4DCE3] dark:border-[#365765] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#329B78]"></span>
          <span className="text-[#526C78] dark:text-[#C0D5DC]">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#C87575]"></span>
          <span className="text-[#526C78] dark:text-[#C0D5DC]">Expenses</span>
        </div>
      </div>
    </Card>
  );
}
