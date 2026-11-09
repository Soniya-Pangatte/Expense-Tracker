import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../common/Card';
import { useCurrency } from '../../context/CurrencyContext';

export default function BudgetProgressWidget({
  budgetProgress = [],
  overallBudgetPercent = 0,
  totalLimit = 0,
  hasMonthlyBudget = false,
}) {
  const { formatRawCurrency } = useCurrency();

  return (
    <Card
      title="Budget Utilization"
      subtitle="Monthly limits & pacing"
      action={
        <Link
          to="/budgets"
          className="text-xs font-semibold text-[#243D49] dark:text-[#83BDCF] hover:underline flex items-center gap-1"
        >
          Manage <ArrowUpRight size={14} />
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Overall Limit Card */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-[#243D49] dark:text-[#EAF4F7]">Overall Monthly Cap</span>
            <span className="font-bold text-[#447F98] dark:text-[#83BDCF]">
              {hasMonthlyBudget ? `${overallBudgetPercent}%` : 'Not set'}
            </span>
          </div>
          <div className="w-full bg-[#B9D9E1] dark:bg-[#365765] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallBudgetPercent > 90 ? 'bg-[#C87575]' : 'bg-[#447F98]'
              }`}
              style={{ width: `${hasMonthlyBudget ? Math.min(overallBudgetPercent, 100) : 0}%` }}
            />
          </div>
          {hasMonthlyBudget && totalLimit > 0 && (
            <p className="text-[11px] text-[#526C78] dark:text-[#C0D5DC] mt-1.5">
              Cap: {formatRawCurrency(totalLimit)}
            </p>
          )}
        </div>

        {/* Category Budget Bars */}
        <div className="space-y-3 pt-1">
          {budgetProgress.length === 0 ? (
            <p className="text-xs text-center py-2 text-[#526C78] dark:text-[#C0D5DC]">
              No category budgets configured yet.
            </p>
          ) : (
            budgetProgress.slice(0, 4).map((b) => {
              const isDanger = b.percent >= 90;
              const isWarning = b.percent >= 75 && b.percent < 90;

              return (
                <div key={b.id || b.categoryName} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-[#243D49] dark:text-[#EAF4F7]">
                      <span>{b.categoryName}</span>
                      {isDanger && <AlertCircle size={13} className="text-[#C87575]" />}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-[#243D49] dark:text-[#EAF4F7]">
                        {formatRawCurrency(b.spent)}
                      </span>
                      <span className="text-[#526C78] dark:text-[#C0D5DC]">
                        {' '}/ {formatRawCurrency(b.limit)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#B9D9E1] dark:bg-[#365765] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDanger
                          ? 'bg-[#C87575]'
                          : isWarning
                          ? 'bg-[#C69A55]'
                          : 'bg-[#447F98]'
                      }`}
                      style={{ width: `${Math.min(b.percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
