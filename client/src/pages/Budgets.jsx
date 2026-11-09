import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  ShieldAlert,
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import BudgetModal from '../components/dashboard/BudgetModal';
import CategoryBudgetModal from '../components/dashboard/CategoryBudgetModal';
import DeleteBudgetLimitModal from '../components/dashboard/DeleteBudgetLimitModal';

export default function Budgets() {
  const {
    stats,
    budgets,
    selectedBudgetMonth,
    setSelectedBudgetMonth,
    deleteCategoryBudget,
  } = useTransactions();
  const { formatRawCurrency } = useCurrency();

  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deletingBudget, setDeletingBudget] = useState(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedBudgetMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const prevKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedBudgetMonth(prevKey);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedBudgetMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const nextKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedBudgetMonth(nextKey);
  };

  const [yearStr, monthStr] = (selectedBudgetMonth || '2026-11').split('-');
  const displayMonthDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const displayMonthName = isNaN(displayMonthDate)
    ? selectedBudgetMonth
    : displayMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const totalCategoryLimits = stats.budgetProgress.reduce((sum, b) => sum + (b.limit || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Month Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Budget Management
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Set monthly spending targets, track category pacing, and prevent overspending.
          </p>
        </div>

        {/* Month Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Switcher Pill */}
          <div className="flex items-center bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-xl px-2 py-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-2 text-xs font-bold text-[#243D49] dark:text-[#D6EBF3] flex items-center gap-1.5 min-w-[120px] justify-center">
              <Calendar size={13} className="text-[#447F98]" />
              <span>{displayMonthName}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditingBudget(null);
              setIsCategoryModalOpen(true);
            }}
          >
            Add Category Limit
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={stats.hasMonthlyBudget ? Edit2 : Plus}
            onClick={() => setIsMonthlyModalOpen(true)}
          >
            {stats.hasMonthlyBudget ? 'Edit Monthly Budget' : 'Set Monthly Budget'}
          </Button>
        </div>
      </div>

      {/* Proactive Budget Alert Banner */}
      {stats.budgetAlerts && stats.budgetAlerts.length > 0 && (
        <div className="space-y-2">
          {stats.budgetAlerts.slice(0, 3).map((alert) => {
            const isDanger = alert.type === 'danger';
            return (
              <div
                key={alert.id}
                className={`p-3.5 sm:p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in duration-300 ${
                  isDanger
                    ? 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-200'
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isDanger
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isDanger ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold">{alert.title}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isDanger
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {alert.percent ? `${alert.percent}%` : alert.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Overview Stat Cards for Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-semibold text-[#526C78] dark:text-[#83BDCF]">
              Monthly Budget Cap
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B9D9E1]/30 text-[#447F98] dark:text-[#83BDCF]">
              {displayMonthName.split(' ')[0]}
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] mt-2">
            {stats.hasMonthlyBudget ? formatRawCurrency(stats.monthlyBudget) : 'Not configured'}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
            {stats.hasMonthlyBudget
              ? `Total target cap for ${displayMonthName}`
              : 'Click "Set Monthly Budget" to begin'}
          </p>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-semibold text-[#526C78] dark:text-[#83BDCF]">
              {displayMonthName.split(' ')[0]} Expenses
            </p>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                stats.budgetStatus === 'Exceeded'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : stats.budgetStatus === 'Warning'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {stats.budgetStatus}
            </span>
          </div>
          <p
            className={`text-2xl font-extrabold mt-2 ${
              stats.isOverBudget
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-[#243D49] dark:text-[#D6EBF3]'
            }`}
          >
            {formatRawCurrency(stats.selectedMonthExpenses)}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
            {stats.hasMonthlyBudget
              ? `${stats.budgetUtilization}% of allocated budget used`
              : 'Real expenses recorded in this period'}
          </p>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-semibold text-[#526C78] dark:text-[#83BDCF]">
              Remaining Allowance
            </p>
            {stats.hasMonthlyBudget && (
              <span className="text-[10px] font-medium text-[#526C78] dark:text-[#83BDCF]">
                {stats.isOverBudget ? 'Over Budget' : 'On Track'}
              </span>
            )}
          </div>
          <p
            className={`text-2xl font-extrabold mt-2 ${
              stats.isOverBudget
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {stats.hasMonthlyBudget
              ? stats.isOverBudget
                ? `Exceeded by ${formatRawCurrency(stats.selectedMonthExpenses - stats.monthlyBudget)}`
                : formatRawCurrency(stats.remainingBudget)
              : 'N/A'}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
            {stats.hasMonthlyBudget
              ? stats.isOverBudget
                ? 'Monthly ceiling exceeded'
                : 'Available spending balance'
              : 'Configure budget to track balance'}
          </p>
        </Card>
      </div>

      {/* Category Budgets Header & Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#243D49] dark:text-[#D6EBF3]">
              Category Spending Limits
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
              Strictly compares real expense transactions against each category's ceiling for {displayMonthName}.
            </p>
          </div>
          <div className="text-xs text-[#526C78] dark:text-[#83BDCF] font-medium">
            <span>{stats.budgetProgress.length} category limits</span>
            {totalCategoryLimits > 0 && (
              <span> • Total limits: {formatRawCurrency(totalCategoryLimits)}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.budgetProgress.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-white dark:bg-[#203D49] rounded-2xl border border-dashed border-[#C4DCE3] dark:border-[#365765] p-8">
              <PieChart size={36} className="mx-auto text-[#447F98] mb-3 opacity-60" />
              <h4 className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3]">
                No category budgets configured yet
              </h4>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1 max-w-sm mx-auto">
                Set category limits (e.g. Groceries, Dining Out, Transport) to receive real-time pacing alerts and prevent overspending.
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setEditingBudget(null);
                    setIsCategoryModalOpen(true);
                  }}
                >
                  Add First Category Limit
                </Button>
              </div>
            </div>
          ) : (
            stats.budgetProgress.map((budget) => {
              const isOver = budget.isOverBudget;
              const isWarning = budget.isWarning;

              return (
                <Card key={budget.id || budget.categoryName} className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: budget.color || '#447F98' }}
                      />
                      <div>
                        <h4 className="font-bold text-sm text-[#243D49] dark:text-[#D6EBF3]">
                          {budget.categoryName}
                        </h4>
                        <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
                          {formatRawCurrency(budget.spent)} spent of {formatRawCurrency(budget.limit)} limit
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isOver
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : isWarning
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-[#B9D9E1]/30 text-[#243D49] dark:text-[#83BDCF]'
                        }`}
                      >
                        {isOver && <AlertTriangle size={11} />}
                        {budget.percent}%
                      </span>

                      {/* Edit & Delete actions */}
                      <button
                        onClick={() => {
                          setEditingBudget(budget);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-[#526C78] hover:text-[#447F98] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title="Edit limit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingBudget(budget)}
                        className="p-1 rounded-lg text-[#526C78] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete limit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar with threshold color encoding */}
                  <div className="w-full bg-[#B9D9E1]/50 dark:bg-[#365765] h-2.5 rounded-full overflow-hidden">
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

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between text-xs text-[#526C78] dark:text-[#83BDCF] pt-0.5 border-t border-[#C4DCE3]/40 dark:border-[#365765]/40">
                    <span>
                      {isOver
                        ? `Over by ${formatRawCurrency(budget.spent - budget.limit)}`
                        : `Remaining: ${formatRawCurrency(budget.remaining)}`}
                    </span>
                    <span
                      className={`font-semibold ${
                        isOver
                          ? 'text-rose-600 dark:text-rose-400'
                          : isWarning
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {budget.status}
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Monthly Budget Modal */}
      <BudgetModal
        isOpen={isMonthlyModalOpen}
        onClose={() => setIsMonthlyModalOpen(false)}
      />

      {/* Category Budget Modal */}
      <CategoryBudgetModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingBudget(null);
        }}
        budget={editingBudget}
      />

      {/* Delete Category Budget Confirmation Modal */}
      <DeleteBudgetLimitModal
        isOpen={Boolean(deletingBudget)}
        onClose={() => setDeletingBudget(null)}
        title="Delete Category Budget Limit"
        message="Are you sure you want to remove this category spending ceiling? Past and future transactions in this category will remain safe in your ledger."
        itemName={deletingBudget ? `${deletingBudget.categoryName} (${formatRawCurrency(deletingBudget.limit)})` : ''}
        onConfirm={async () => {
          if (deletingBudget) {
            await deleteCategoryBudget(deletingBudget.id);
          }
        }}
      />
    </div>
  );
}
