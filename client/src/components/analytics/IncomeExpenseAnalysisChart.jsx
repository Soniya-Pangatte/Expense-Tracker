import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../common/Card';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function IncomeExpenseAnalysisChart({ monthlyTimeline = [] }) {
  const { isDark } = useTheme();
  const { formatRawCurrency, getCurrencySymbol } = useCurrency();
  const [chartMode, setChartMode] = useState('bar'); // 'bar' | 'savings' | 'area'
  const symbol = getCurrencySymbol();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1B3440] p-3 border border-[#C4DCE3] dark:border-[#2C4E5E] rounded-xl shadow-lg text-xs space-y-1.5 min-w-[150px]">
          <p className="font-bold text-[#243D49] dark:text-[#D6EBF3] pb-1 border-b border-[#C4DCE3]/60 dark:border-[#2C4E5E]/60">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={`tt-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[#526C78] dark:text-[#83BDCF]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3] font-mono">
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
      title="Income vs Expenses Analysis"
      subtitle="Monthly cashflow evolution and net savings performance"
      action={
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#152B35] rounded-xl text-xs">
          <button
            onClick={() => setChartMode('bar')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              chartMode === 'bar'
                ? 'bg-white dark:bg-[#203D49] text-[#243D49] dark:text-[#D6EBF3] shadow-xs font-semibold'
                : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49]'
            }`}
          >
            Income vs Expense
          </button>
          <button
            onClick={() => setChartMode('savings')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              chartMode === 'savings'
                ? 'bg-white dark:bg-[#203D49] text-[#243D49] dark:text-[#D6EBF3] shadow-xs font-semibold'
                : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49]'
            }`}
          >
            Net Savings
          </button>
          <button
            onClick={() => setChartMode('area')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              chartMode === 'area'
                ? 'bg-white dark:bg-[#203D49] text-[#243D49] dark:text-[#D6EBF3] shadow-xs font-semibold'
                : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49]'
            }`}
          >
            Cashflow Trend
          </button>
        </div>
      }
    >
      <div className="h-72 w-full pt-3">
        {monthlyTimeline.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#526C78] dark:text-[#83BDCF]">
            No transaction records found in the selected date range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'bar' ? (
              <BarChart
                data={monthlyTimeline}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#2C4E5E' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#83BDCF' : '#526C78', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#83BDCF' : '#526C78', fontSize: 11 }}
                  tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => (
                    <span className="text-xs text-[#243D49] dark:text-[#D6EBF3]">{value}</span>
                  )}
                />
                <Bar dataKey="income" name="Income" fill="#329B78" radius={[4, 4, 0, 0]} maxBarSize={38} />
                <Bar dataKey="expense" name="Expenses" fill="#C87575" radius={[4, 4, 0, 0]} maxBarSize={38} />
              </BarChart>
            ) : chartMode === 'savings' ? (
              <BarChart
                data={monthlyTimeline}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#2C4E5E' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#83BDCF' : '#526C78', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#83BDCF' : '#526C78', fontSize: 11 }}
                  tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => (
                    <span className="text-xs text-[#243D49] dark:text-[#D6EBF3]">{value}</span>
                  )}
                />
                <Bar
                  dataKey="savings"
                  name="Net Savings"
                  fill="#447F98"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            ) : (
              <AreaChart
                data={monthlyTimeline}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="anIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#329B78" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#329B78" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="anExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C87575" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#C87575" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#2C4E5E' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#83BDCF' : '#526C78', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#83BDCF' : '#526C78', fontSize: 11 }}
                  tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => (
                    <span className="text-xs text-[#243D49] dark:text-[#D6EBF3]">{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#329B78"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#anIncomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expenses"
                  stroke="#C87575"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#anExpenseGrad)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

