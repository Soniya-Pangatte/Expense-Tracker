import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  Sparkles,
  PlusCircle,
  Database,
  Repeat
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import StatCard from '../components/dashboard/StatCard';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart';
import CategoryBreakdownChart from '../components/dashboard/CategoryBreakdownChart';
import BudgetProgressWidget from '../components/dashboard/BudgetProgressWidget';
import RecentTransactionsTable from '../components/dashboard/RecentTransactionsTable';
import QuickActions from '../components/dashboard/QuickActions';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function Dashboard() {
  const { transactions, stats, loadStarterSampleData } = useTransactions();
  const { user, profile } = useAuth();
  const { formatRawCurrency } = useCurrency();

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Friend';

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner / Summary Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#B9D9E1]/15 dark:bg-[#B9D9E1]/10 border border-[#C4DCE3]/30 rounded-2xl p-5 sm:p-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B9D9E1]/25 text-[#243D49] dark:text-[#83BDCF] text-xs font-semibold mb-2">
            <Sparkles size={12} />
            <span>Monthly Financial Health: {stats.savingsRate >= 20 ? 'Strong' : 'Active'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Good morning, {firstName}
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            {transactions.length > 0 ? (
              <>You've saved <span className="font-semibold text-[#447F98]">{stats.savingsRate}%</span> of your income this month.</>
            ) : (
              'Welcome to your personal SpendWise dashboard. Your ledger is clean and ready.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/recurring"
            className="bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-xl px-3.5 py-2 text-right shadow-sm hover:border-[#447F98] transition-colors group"
          >
            <p className="text-[10px] font-medium text-[#526C78] dark:text-[#83BDCF] group-hover:text-[#447F98]">
              Scheduled Bills
            </p>
            <p className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3] flex items-center gap-1">
              <Repeat size={12} className="text-[#447F98]" />
              <span>{stats.activeRecurringCount} active</span>
            </p>
          </Link>

          <div className="bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-xl px-4 py-2 text-right shadow-sm">
            <p className="text-[10px] font-medium text-[#526C78] dark:text-[#83BDCF]">Active Month</p>
            <p className="text-sm font-bold text-[#243D49] dark:text-[#D6EBF3]">November 2026</p>
          </div>
        </div>
      </div>

      {/* New User Welcome / Empty Ledger Helper */}
      {transactions.length === 0 && (
        <Card className="border-dashed border-2 border-[#C4DCE3]/50 p-6 bg-white/80 dark:bg-[#203D49]/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                Your personal ledger is ready
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1 max-w-xl">
                As a new user, your financial records are isolated and private. You can record your first manual expense, scan a receipt using OCR, or populate your account with sample demo records to explore the charts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Database}
                onClick={loadStarterSampleData}
              >
                Load Starter Data
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Action Navigation Buttons */}
      <QuickActions />

      {/* 4 Core Financial Summary Cards (Calculated dynamically in selected currency) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Income"
          value={formatRawCurrency(stats.totalIncome)}
          subtitle={transactions.length > 0 ? "active income streams" : "No income recorded"}
          trend={stats.totalIncome > 0 ? "+8.5%" : null}
          trendType="positive"
          icon={TrendingUp}
          iconBgColor="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />

        <StatCard
          title="Total Expenses"
          value={formatRawCurrency(stats.totalExpenses)}
          subtitle={transactions.length > 0 ? `across ${stats.categoryBreakdown.length} categories` : "No expenses recorded"}
          trend={stats.totalExpenses > 0 ? "-3.2%" : null}
          trendType="positive"
          icon={TrendingDown}
          iconBgColor="bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
        />

        <StatCard
          title="Available Balance"
          value={formatRawCurrency(stats.availableBalance)}
          subtitle="liquid net cashflow"
          icon={Wallet}
          iconBgColor="bg-[#B9D9E1]/20 text-[#243D49] dark:text-[#83BDCF]"
        />

        <StatCard
          title="Monthly Savings"
          value={formatRawCurrency(stats.monthlySavings)}
          subtitle={`Savings rate: ${stats.savingsRate}%`}
          trend={`${stats.savingsRate}%`}
          trendType="positive"
          icon={PiggyBank}
          iconBgColor="bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400"
        />
      </div>

      {/* Charts Section: Cashflow Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingTrendChart data={stats.spendingTrends} />
        </div>
        <div className="lg:col-span-1">
          <CategoryBreakdownChart data={stats.categoryBreakdown} />
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Budget Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactionsTable transactions={transactions} />
        </div>
        <div className="lg:col-span-1">
          <BudgetProgressWidget
            budgetProgress={stats.budgetProgress}
            overallBudgetPercent={stats.budgetUtilization}
            totalLimit={stats.monthlyBudget || 0}
            hasMonthlyBudget={stats.hasMonthlyBudget}
          />
        </div>
      </div>
    </div>
  );
}
