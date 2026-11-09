import React, { useState } from 'react';
import { PieChart, Plus, AlertTriangle, CheckCircle, TrendingUp, Edit2 } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import BudgetModal from '../components/dashboard/BudgetModal';

export default function Budgets() {
  const { stats, budgets } = useTransactions();
  const { formatRawCurrency } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Budget Management
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Set monthly spending targets, track category pacing, and prevent overspending.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={stats.hasMonthlyBudget ? Edit2 : Plus}
            onClick={() => setIsModalOpen(true)}
          >
            {stats.hasMonthlyBudget ? 'Edit Monthly Budget' : 'Set Monthly Budget'}
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-5">
          <p className="text-xs uppercase font-medium text-[#526C78] dark:text-[#83BDCF]">Monthly Budget Cap</p>
          <p className="text-2xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] mt-1">
            {stats.hasMonthlyBudget ? formatRawCurrency(stats.monthlyBudget) : 'Not configured'}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
            {stats.hasMonthlyBudget ? 'Target cap for current month' : 'Click "Set Monthly Budget" to begin'}
          </p>
        </Card>

        <Card className="!p-5">
          <p className="text-xs uppercase font-medium text-[#526C78] dark:text-[#83BDCF]">Current Month Spent</p>
          <p className={`text-2xl font-extrabold mt-1 ${stats.isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-[#243D49] dark:text-[#D6EBF3]'}`}>
            {formatRawCurrency(stats.currentMonthExpenses)}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
            {stats.hasMonthlyBudget ? `${stats.budgetUtilization}% of allocated limit` : 'Total expenses this month'}
          </p>
        </Card>

        <Card className="!p-5">
          <p className="text-xs uppercase font-medium text-[#526C78] dark:text-[#83BDCF]">Remaining Budget</p>
          <p className={`text-2xl font-extrabold mt-1 ${stats.isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {stats.hasMonthlyBudget
              ? stats.isOverBudget
                ? `Exceeded by ${formatRawCurrency(stats.currentMonthExpenses - stats.monthlyBudget)}`
                : formatRawCurrency(stats.remainingBudget)
              : 'N/A'}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
            {stats.hasMonthlyBudget ? (stats.isOverBudget ? 'Budget limit exceeded' : 'Available for remainder of month') : 'Set budget to track remaining'}
          </p>
        </Card>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.budgetProgress.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-sm text-[#526C78] dark:text-[#83BDCF]">
              No category budgets configured yet.
            </p>
          </div>
        ) : (
          stats.budgetProgress.map((budget) => {
            const isOver = budget.isOverBudget;
            const isWarning = budget.percent >= 80 && !isOver;

            return (
              <Card key={budget.id || budget.categoryName} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-[#243D49] dark:text-[#D6EBF3]">
                      {budget.categoryName}
                    </h4>
                    <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                      {formatRawCurrency(budget.spent)} spent of {formatRawCurrency(budget.limit)} limit
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        isOver
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-[#B9D9E1]/20 text-[#243D49] dark:text-[#83BDCF]'
                      }`}
                    >
                      {isOver && <AlertTriangle size={12} />}
                      {budget.percent}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#B9D9E1] dark:bg-[#365765] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-[#447F98]'
                    }`}
                    style={{ width: `${Math.min(budget.percent, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#526C78] dark:text-[#83BDCF]">
                  <span>Remaining: {formatRawCurrency(budget.remaining)}</span>
                  <span>{isOver ? 'Exceeded' : 'On Track'}</span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
