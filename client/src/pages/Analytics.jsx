import React, { useState, useMemo } from 'react';
import {
  Download,
  Calendar,
  FileSpreadsheet,
  Printer,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PieChart,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  DATE_PRESETS,
  getDateRangeBoundaries,
  getPreviousPeriodBoundaries,
  formatReadableDate,
  calculateFinancialAnalytics,
  exportToCSV,
  exportToExcel,
  openPrintablePDFReport,
} from '../services/analyticsService';
import IncomeExpenseAnalysisChart from '../components/analytics/IncomeExpenseAnalysisChart';
import CategoryAnalysisSection from '../components/analytics/CategoryAnalysisSection';
import SavingsAnalysisWidget from '../components/analytics/SavingsAnalysisWidget';
import BudgetPerformanceWidget from '../components/analytics/BudgetPerformanceWidget';
import FinancialInsightsBanner from '../components/analytics/FinancialInsightsBanner';
import TransactionDrillDownModal from '../components/analytics/TransactionDrillDownModal';

export default function Analytics() {
  const {
    transactions,
    categories,
    budgets,
    monthlyBudgetsList,
  } = useTransactions();
  const { currency, convertAmount, formatAmount, formatRawCurrency } = useCurrency();

  // Date Range Filter States
  const [activePreset, setActivePreset] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Drill-down Modal State
  const [drillDownCategory, setDrillDownCategory] = useState(null); // null = all, or category name
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  // 1. Resolve Active Date Boundaries & Previous Period Boundaries
  const dateRange = useMemo(() => {
    return getDateRangeBoundaries(activePreset, customStart, customEnd);
  }, [activePreset, customStart, customEnd]);

  const prevDateRange = useMemo(() => {
    return getPreviousPeriodBoundaries(dateRange.startDate, dateRange.endDate, activePreset);
  }, [dateRange.startDate, dateRange.endDate, activePreset]);

  // 2. Compute Comprehensive Financial Analytics
  const analytics = useMemo(() => {
    return calculateFinancialAnalytics({
      transactions,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      prevStartDate: prevDateRange.startDate,
      prevEndDate: prevDateRange.endDate,
      currency,
      convertAmount,
      categories,
      budgets,
      monthlyBudgetsList,
    });
  }, [
    transactions,
    dateRange.startDate,
    dateRange.endDate,
    prevDateRange.startDate,
    prevDateRange.endDate,
    currency,
    convertAmount,
    categories,
    budgets,
    monthlyBudgetsList,
  ]);

  // Handle Category Click for Drill-Down
  const handleOpenDrillDown = (catName = null) => {
    setDrillDownCategory(catName);
    setIsDrillDownOpen(true);
  };

  // Export Handlers
  const handleExportCSV = () => {
    exportToCSV({
      transactions: analytics.currentTransactions,
      dateRangeLabel: dateRange.label,
      currency,
      convertAmount,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      analytics,
      transactions: analytics.currentTransactions,
      dateRangeLabel: dateRange.label,
      currency,
      formatAmount,
    });
  };

  const handleExportPDF = () => {
    openPrintablePDFReport({
      analytics,
      transactions: analytics.currentTransactions,
      dateRangeLabel: dateRange.label,
      currency,
      formatAmount,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Export Center */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
            <PieChart size={12} />
            <span>Advanced Financial Intelligence (Phase 5)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Financial Analytics & Reports
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Comprehensive cashflow insights, category distribution, budget adherence, and multi-format reports in {currency}.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs flex items-center gap-1.5"
            title="Download CSV raw transaction ledger"
          >
            <Download size={14} className="text-[#447F98]" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs flex items-center gap-1.5"
            title="Download formatted Excel workbook (.xls)"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPDF}
            className="text-xs flex items-center gap-1.5"
            title="Open printable executive PDF statement"
          >
            <Printer size={14} />
            <span>Print / PDF Report</span>
          </Button>
        </div>
      </div>

      {/* Date Range Preset Selector Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activePreset === p.id
                    ? 'bg-[#447F98] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-[#152B35] text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Active Date Label & Custom Pickers */}
          <div className="flex flex-wrap items-center gap-3">
            {activePreset === 'custom' ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart || dateRange.startDate}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-[#C4DCE3] dark:border-[#2C4E5E] bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={customEnd || dateRange.endDate}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-[#C4DCE3] dark:border-[#2C4E5E] bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3]"
                />
              </div>
            ) : (
              <div className="text-xs text-[#526C78] dark:text-[#83BDCF] flex items-center gap-2">
                <Calendar size={13} className="text-[#447F98]" />
                <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                  {formatReadableDate(dateRange.startDate)} – {formatReadableDate(dateRange.endDate)}
                </span>
                <span className="text-[11px] opacity-75">
                  ({prevDateRange.label}: {formatReadableDate(prevDateRange.startDate)} – {formatReadableDate(prevDateRange.endDate)})
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Top 5 KPI Summary Analytical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Income */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
              Total Income
            </span>
            {analytics.prevTotalIncome > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  analytics.incomePercentChange >= 0
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {analytics.incomePercentChange >= 0 ? '+' : ''}
                {analytics.incomePercentChange}%
              </span>
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {formatRawCurrency(analytics.totalIncome)}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Total inflows in period
          </p>
        </Card>

        {/* Total Expenses */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
              Total Expenses
            </span>
            {analytics.prevTotalExpenses > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  analytics.expensePercentChange <= 0
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {analytics.expensePercentChange >= 0 ? '+' : ''}
                {analytics.expensePercentChange}%
              </span>
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-rose-500 mt-2">
            {formatRawCurrency(analytics.totalExpenses)}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Total outflows in period
          </p>
        </Card>

        {/* Net Savings */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
              Net Savings
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                analytics.netSavings >= 0
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              {analytics.netSavings >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <p
            className={`text-xl sm:text-2xl font-bold font-mono mt-2 ${
              analytics.netSavings >= 0 ? 'text-[#00695C] dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatRawCurrency(analytics.netSavings)}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Income minus expenses
          </p>
        </Card>

        {/* Savings Rate */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
              Savings Rate
            </span>
            <span className="text-[10px] font-semibold text-gray-400">Target 20%</span>
          </div>
          <p
            className={`text-xl sm:text-2xl font-bold mt-2 ${
              analytics.savingsRate >= 20
                ? 'text-emerald-500'
                : analytics.savingsRate > 0
                ? 'text-[#447F98] dark:text-[#629BB5]'
                : 'text-rose-500'
            }`}
          >
            {analytics.totalIncome > 0 ? `${analytics.savingsRate}%` : 'N/A'}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            {analytics.totalIncome > 0 ? 'Percentage of income' : 'No income recorded'}
          </p>
        </Card>

        {/* Avg Monthly Expenses */}
        <Card className="!p-4 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
              Avg. Monthly Spend
            </span>
            <span className="text-[10px] font-semibold text-gray-400">
              {analytics.monthCount} {analytics.monthCount === 1 ? 'Month' : 'Months'}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#243D49] dark:text-[#D6EBF3] mt-2">
            {formatRawCurrency(analytics.avgMonthlyExpenses)}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Across active calendar months
          </p>
        </Card>
      </div>

      {/* Financial Insights Banner */}
      <FinancialInsightsBanner insights={analytics.insights} />

      {/* Row 1: Income vs Expense Visualization & Savings Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeExpenseAnalysisChart monthlyTimeline={analytics.monthlyTimeline} />
        </div>
        <div className="lg:col-span-1">
          <SavingsAnalysisWidget
            totalIncome={analytics.totalIncome}
            totalExpenses={analytics.totalExpenses}
            netSavings={analytics.netSavings}
            savingsRate={analytics.savingsRate}
            prevNetSavings={analytics.prevNetSavings}
            savingsPercentChange={analytics.savingsPercentChange}
            prevLabel={prevDateRange.label}
          />
        </div>
      </div>

      {/* Row 2: Category Spending Analysis */}
      <CategoryAnalysisSection
        categoryBreakdown={analytics.categoryBreakdown}
        highestCategory={analytics.highestCategory}
        lowestCategory={analytics.lowestCategory}
        totalExpenses={analytics.totalExpenses}
        onCategorySelect={handleOpenDrillDown}
      />

      {/* Row 3: Budget Performance & Compliance */}
      <BudgetPerformanceWidget
        periodBudgetAllocated={analytics.periodBudgetAllocated}
        totalExpenses={analytics.totalExpenses}
        periodRemainingBudget={analytics.periodRemainingBudget}
        periodBudgetUtilization={analytics.periodBudgetUtilization}
        isPeriodOverBudget={analytics.isPeriodOverBudget}
        categoryBudgetPerformance={analytics.categoryBudgetPerformance}
      />

      {/* Transaction Drill-Down Modal */}
      <TransactionDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        categoryName={drillDownCategory}
        transactions={analytics.currentTransactions}
        dateRangeLabel={dateRange.label}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
      />
    </div>
  );
}
