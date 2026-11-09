import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../common/Card';
import { useCurrency } from '../../context/CurrencyContext';

export default function CategoryBreakdownChart({ data = [] }) {
  const { formatRawCurrency } = useCurrency();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#203D49] p-2.5 border border-[#C4DCE3] dark:border-[#365765] rounded-xl shadow-md text-xs">
          <p className="font-semibold text-[#243D49] dark:text-[#D6EBF3] mb-0.5">{item.name}</p>
          <p className="text-[#526C78] dark:text-[#83BDCF]">
            {formatRawCurrency(item.value)} ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card
      title="Expense Distribution"
      subtitle="Categorical breakdown of November expenses"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Donut Chart */}
        <div className="w-full sm:w-1/2 h-56 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || '#C4DCE3'}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-medium text-[#526C78] dark:text-[#83BDCF]">Total</span>
            <span className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3] px-1 truncate max-w-[100px] text-center">
              {formatRawCurrency(total)}
            </span>
          </div>
        </div>

        {/* Legend / Category List */}
        <div className="w-full sm:w-1/2 space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {data.slice(0, 5).map((category, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate text-[#243D49] dark:text-[#D6EBF3] font-medium">
                  {category.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[#526C78] dark:text-[#83BDCF] font-medium">
                  {category.percentage}%
                </span>
                <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                  {formatRawCurrency(category.value)}
                </span>
              </div>
            </div>
          ))}
          {data.length > 5 && (
            <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF] pt-1">
              +{data.length - 5} other categories
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
