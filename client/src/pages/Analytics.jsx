import React from 'react';
import {
  Download,
  BarChart2,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Repeat,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart';
import CategoryBreakdownChart from '../components/dashboard/CategoryBreakdownChart';
import BudgetVsActualChart from '../components/dashboard/BudgetVsActualChart';

export default function Analytics() {
  const { stats, transactions, selectedBudgetMonth } = useTransactions();
  const { currency, formatRawCurrency } = useCurrency();

  const handleExportCSV = () => {
    const headers = ['ID,Description,Amount,Currency,Type,Category,Date,PaymentMethod,Merchant,Source'];
    const rows = transactions.map((t) =>
      `"${t.id}","${t.description}",${t.amount},"${t.currency || currency}","${t.type}","${t.categoryName || t.category_name || 'General'}","${t.date}","${t.paymentMethod || t.payment_method || 'Other'}","${t.merchant || ''}","${t.source || 'manual'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SpendWise_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const avgDailySpend = stats.spendingTrends.length > 0
    ? stats.totalExpenses / stats.spendingTrends.length
    : stats.totalExpenses / 7;

  // Overspending and Warning categories
  const overspentCategories = stats.budgetProgress.filter((b) => b.isOverBudget);
  const warningCategories = stats.budgetProgress.filter((b) => b.isWarning);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Financial Analytics & Reports
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Deep dive into spending habits, budget vs actual variance, and exportable financial reports in {currency}.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
          Export CSV Ledger
        </Button>
      </div>

      {/* Top 4 Analytical KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
              Budget Utilization
            </p>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                stats.budgetStatus === 'Exceeded'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : stats.budgetStatus === 'Warning'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {stats.hasMonthlyBudget ? `${stats.budgetUtilization}%` : 'Not set'}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] mt-2">
            {stats.hasMonthlyBudget ? formatRawCurrency(stats.selectedMonthExpenses) : formatRawCurrency(stats.totalExpenses)}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            {stats.hasMonthlyBudget
              ? `of ${formatRawCurrency(stats.monthlyBudget)} budget cap`
              : 'Total expenses recorded'}
          </p>
        </Card>

        <Card className="!p-4">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
            Avg. Daily Spend
          </p>
          <p className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] mt-2">
            {formatRawCurrency(avgDailySpend)}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Across active transaction days
          </p>
        </Card>

        <Card className="!p-4">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
            Fixed Commitments
          </p>
          <p className="text-xl sm:text-2xl font-bold text-[#447F98] dark:text-[#83BDCF] mt-2">
            {formatRawCurrency(stats.activeRecurringCommitment)}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            {stats.activeRecurringCount} active recurring bills / month
          </p>
        </Card>

        <Card className="!p-4">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
            Net Savings Rate
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.savingsRate}%
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            {stats.totalIncome > 0 ? `${formatRawCurrency(stats.availableBalance)} saved` : 'Track income to measure'}
          </p>
        </Card>
      </div>

      {/* Row 1 Charts: Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingTrendChart data={stats.spendingTrends} />
        </div>
        <div className="lg:col-span-1">
          <CategoryBreakdownChart data={stats.categoryBreakdown} />
        </div>
      </div>

      {/* Row 2: Budget vs Actual Spending Comparison & Variance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BudgetVsActualChart data={stats.budgetProgress} />
        </div>

        <div className="lg:col-span-1">
          <Card
            title="Budget Pacing & Variance"
            subtitle="Categories requiring immediate attention"
            action={
              <Link
                to="/budgets"
                className="text-xs font-semibold text-[#447F98] dark:text-[#83BDCF] hover:underline flex items-center gap-0.5"
              >
                Manage <ArrowUpRight size={13} />
              </Link>
            }
          >
            <div className="space-y-3 pt-1">
              {stats.budgetProgress.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#526C78] dark:text-[#83BDCF]">
                  No category limits configured.
                </div>
              ) : overspentCategories.length === 0 && warningCategories.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200 text-center space-y-1">
                  <CheckCircle2 size={20} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                  <p className="font-bold">All Categories On Track</p>
                  <p className="text-[11px] opacity-90">
                    No categories have exceeded or approached 75% of their spending allowance.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Overspent categories */}
                  {overspentCategories.map((c) => (
                    <div
                      key={c.id || c.categoryName}
                      className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-rose-700 dark:text-rose-300">
                          {c.categoryName}
                        </span>
                        <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">
                          Spent {formatRawCurrency(c.spent)} of {formatRawCurrency(c.limit)}
                        </p>
                      </div>
                      <span className="font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-rose-600 text-white">
                        +{formatRawCurrency(c.spent - c.limit)}
                      </span>
                    </div>
                  ))}

                  {/* Warning categories */}
                  {warningCategories.map((c) => (
                    <div
                      key={c.id || c.categoryName}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          {c.categoryName}
                        </span>
                        <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">
                          {c.percent}% used • {formatRawCurrency(c.remaining)} remaining
                        </p>
                      </div>
                      <span className="font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-white">
                        {c.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Quick Metric */}
              <div className="pt-2 border-t border-[#C4DCE3]/60 dark:border-[#365765]/60 flex items-center justify-between text-xs text-[#526C78] dark:text-[#83BDCF]">
                <span>Total Monitored Limits</span>
                <span className="font-bold text-[#243D49] dark:text-[#D6EBF3]">
                  {formatRawCurrency(stats.budgetProgress.reduce((sum, b) => sum + (b.limit || 0), 0))}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
