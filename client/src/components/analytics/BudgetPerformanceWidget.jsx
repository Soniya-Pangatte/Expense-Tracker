import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { useCurrency } from '../../context/CurrencyContext';

export default function BudgetPerformanceWidget({
  periodBudgetAllocated = 0,
  totalExpenses = 0,
  periodRemainingBudget = 0,
  periodBudgetUtilization = 0,
  isPeriodOverBudget = false,
  categoryBudgetPerformance = [],
}) {
  const { formatRawCurrency } = useCurrency();

  const overspentCats = categoryBudgetPerformance.filter((c) => c.isOver);
  const warningCats = categoryBudgetPerformance.filter((c) => c.isWarning);

  return (
    <Card
      title="Budget Performance & Compliance"
      subtitle="Evaluation of actual expenses against Phase 2 budget limits"
      action={
        <Link
          to="/budgets"
          className="text-xs font-semibold text-[#447F98] dark:text-[#83BDCF] hover:underline flex items-center gap-0.5"
        >
          <span>Manage Budgets</span>
          <ArrowUpRight size={13} />
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Overall Period Budget Pacing */}
        {periodBudgetAllocated > 0 ? (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#152B35]/70 border border-[#C4DCE3]/50 dark:border-[#2C4E5E]/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                Total Budget Utilization
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPeriodOverBudget
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : periodBudgetUtilization >= 75
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {periodBudgetUtilization}% Utilized
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-[#203D49] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isPeriodOverBudget
                    ? 'bg-rose-500'
                    : periodBudgetUtilization >= 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, periodBudgetUtilization)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#526C78] dark:text-[#83BDCF] pt-1">
              <span>Spent: <strong className="text-[#243D49] dark:text-[#D6EBF3]">{formatRawCurrency(totalExpenses)}</strong></span>
              <span>Allocated: <strong className="text-[#243D49] dark:text-[#D6EBF3]">{formatRawCurrency(periodBudgetAllocated)}</strong></span>
              <span>Remaining: <strong className="text-emerald-600 dark:text-emerald-400">{formatRawCurrency(periodRemainingBudget)}</strong></span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-[#526C78] dark:text-[#83BDCF] flex items-center justify-between">
            <span>No monthly budget target configured for this period.</span>
            <Link to="/budgets" className="text-[#447F98] dark:text-[#83BDCF] font-bold hover:underline">
              Set Target
            </Link>
          </div>
        )}

        {/* Category Budget Limits Table */}
        <div>
          <h4 className="text-xs font-bold text-[#243D49] dark:text-[#D6EBF3] mb-2 flex items-center gap-1.5">
            <Sliders size={13} className="text-[#447F98]" />
            <span>Category Spending Limits Status</span>
          </h4>

          {categoryBudgetPerformance.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#526C78] dark:text-[#83BDCF]">
              No category limits configured yet. Configure category caps in the Budgets module to track variance.
            </div>
          ) : (
            <div className="border border-[#C4DCE3]/50 dark:border-[#2C4E5E]/40 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-[#152B35] text-[#526C78] dark:text-[#83BDCF] border-b border-[#C4DCE3]/40 dark:border-[#2C4E5E]/40">
                  <tr>
                    <th className="p-2.5 font-semibold">Category</th>
                    <th className="p-2.5 font-semibold text-right">Spent</th>
                    <th className="p-2.5 font-semibold text-right">Limit</th>
                    <th className="p-2.5 font-semibold text-right">Remaining</th>
                    <th className="p-2.5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C4DCE3]/30 dark:divide-[#2C4E5E]/30 text-[#243D49] dark:text-[#D6EBF3]">
                  {categoryBudgetPerformance.map((c) => (
                    <tr key={c.id || c.categoryName}>
                      <td className="p-2.5 font-semibold">{c.categoryName}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-500">
                        {formatRawCurrency(c.spent)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-gray-500 dark:text-gray-400">
                        {formatRawCurrency(c.limit)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRawCurrency(c.remaining)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'Exceeded'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : c.status === 'Warning'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {c.status} ({c.utilization}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

