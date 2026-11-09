import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ArrowUpRight, Award, TrendingDown, Layers, ChevronRight } from 'lucide-react';
import Card from '../common/Card';
import { useCurrency } from '../../context/CurrencyContext';

export default function CategoryAnalysisSection({
  categoryBreakdown = [],
  highestCategory = null,
  lowestCategory = null,
  totalExpenses = 0,
  onCategorySelect = () => {},
}) {
  const { formatRawCurrency } = useCurrency();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#1B3440] p-2.5 border border-[#C4DCE3] dark:border-[#2C4E5E] rounded-xl shadow-lg text-xs space-y-1">
          <p className="font-bold text-[#243D49] dark:text-[#D6EBF3]">{item.name}</p>
          <p className="text-[#526C78] dark:text-[#83BDCF]">
            {formatRawCurrency(item.value)} ({item.percentage}%)
          </p>
          <p className="text-[11px] text-gray-400">
            {item.count} transactions • Avg {formatRawCurrency(item.avgPerTx)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* High / Low Category Callout Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {highestCategory && (
          <div
            onClick={() => onCategorySelect(highestCategory.name)}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between cursor-pointer hover:bg-rose-500/15 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                <Award size={20} />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400">
                  Highest Spending Category
                </span>
                <h4 className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3]">
                  {highestCategory.name}
                </h4>
                <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                  {formatRawCurrency(highestCategory.value)} ({highestCategory.percentage}% of total)
                </p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-rose-500" />
          </div>
        )}

        {lowestCategory && (
          <div
            onClick={() => onCategorySelect(lowestCategory.name)}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between cursor-pointer hover:bg-emerald-500/15 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <TrendingDown size={20} />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                  Lowest Spending Category
                </span>
                <h4 className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3]">
                  {lowestCategory.name}
                </h4>
                <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                  {formatRawCurrency(lowestCategory.value)} ({lowestCategory.percentage}% of total)
                </p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-emerald-500" />
          </div>
        )}
      </div>

      {/* Main Category Distribution Section */}
      <Card
        title="Category-Wise Expense Distribution"
        subtitle="Categorical breakdown, % contribution, and itemized transaction drill-down"
      >
        {categoryBreakdown.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#526C78] dark:text-[#83BDCF]">
            No categorical expenses recorded in this timeframe.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut Chart */}
            <div className="lg:col-span-5 h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry) => onCategorySelect(entry.name)}
                    cursor="pointer"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || '#447F98'}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-semibold text-[#526C78] dark:text-[#83BDCF]">Total Expenses</span>
                <span className="text-base font-extrabold text-[#243D49] dark:text-[#D6EBF3]">
                  {formatRawCurrency(totalExpenses)}
                </span>
              </div>
            </div>

            {/* Detailed Category Table */}
            <div className="lg:col-span-7">
              <div className="border border-[#C4DCE3]/50 dark:border-[#2C4E5E]/40 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-[#152B35] text-[#526C78] dark:text-[#83BDCF] border-b border-[#C4DCE3]/40 dark:border-[#2C4E5E]/40">
                    <tr>
                      <th className="p-2.5 font-semibold">Category</th>
                      <th className="p-2.5 font-semibold text-right">Amount</th>
                      <th className="p-2.5 font-semibold text-right">% Share</th>
                      <th className="p-2.5 font-semibold text-center">Txns</th>
                      <th className="p-2.5 font-semibold text-right">Avg / Tx</th>
                      <th className="p-2.5 w-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C4DCE3]/30 dark:divide-[#2C4E5E]/30 text-[#243D49] dark:text-[#D6EBF3]">
                    {categoryBreakdown.map((c) => (
                      <tr
                        key={c.name}
                        onClick={() => onCategorySelect(c.name)}
                        className="hover:bg-gray-50/80 dark:hover:bg-[#203D49]/60 cursor-pointer transition-colors group"
                      >
                        <td className="p-2.5 font-medium flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="truncate group-hover:text-[#447F98] dark:group-hover:text-[#629BB5] transition-colors">
                            {c.name}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {formatRawCurrency(c.value)}
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-[#152B35] overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(100, c.percentage)}%`, backgroundColor: c.color }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold">{c.percentage}%</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-center text-gray-500 dark:text-gray-400 font-mono">
                          {c.count}
                        </td>
                        <td className="p-2.5 text-right text-gray-500 dark:text-gray-400 font-mono">
                          {formatRawCurrency(c.avgPerTx)}
                        </td>
                        <td className="p-2.5 text-center text-gray-400 group-hover:text-[#447F98]">
                          <ChevronRight size={14} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

