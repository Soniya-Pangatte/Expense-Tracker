import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Wallet,
  Zap,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useTransactions } from '../../context/TransactionContext';
import { fetchFinancialInsights } from '../../services/aiService';

export default function FinancialInsightsSection({ onPromptSelect }) {
  const { session, isDemoUser } = useAuth();
  const { currency, formatCurrency } = useCurrency();
  const { transactions, monthlyBudget, budgets, categories, recurringExpenses } = useTransactions();

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadInsights() {
      setLoading(true);
      try {
        const clientData = {
          transactions,
          monthlyBudget,
          budgets,
          categories,
          recurringExpenses,
        };
        const res = await fetchFinancialInsights({
          currency,
          clientData,
          session,
          isDemoUser,
        });
        if (isMounted && res && res.insights) {
          setInsights(res.insights);
        }
      } catch (e) {
        console.error('Insights fetch error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInsights();
    return () => {
      isMounted = false;
    };
  }, [transactions, monthlyBudget, budgets, categories, currency, session, isDemoUser]);

  if (loading && !insights) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/60 dark:bg-[#1B3541]/60 rounded-2xl border border-[#C4DCE3] dark:border-[#365765]" />
        ))}
      </div>
    );
  }

  if (!insights) return null;

  const { metrics, budget, categories: catData, savings, categoryAlerts } = insights;
  const sym = insights.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Spent & Budget Pacing */}
        <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-4 sm:p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#C4DCE3] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
              Total Spent
            </span>
            <div className={`p-2 rounded-xl ${
              budget.isOverBudget
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : 'bg-[#B9D9E1] dark:bg-[#203D49] text-[#243D49] dark:text-[#B9D9E1]'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
              {sym}{metrics.totalExpense.toLocaleString()}
            </div>
            {budget.hasBudget ? (
              <div className="text-xs text-[#526C78] dark:text-[#83BDCF] flex items-center justify-between pt-1">
                <span>Cap: {sym}{budget.limit.toLocaleString()}</span>
                <span className={`font-semibold ${
                  budget.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-[#243D49] dark:text-[#B9D9E1]'
                }`}>
                  {budget.utilizationRate}% used
                </span>
              </div>
            ) : (
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">No monthly cap set</p>
            )}
          </div>

          {/* Progress bar */}
          {budget.hasBudget && (
            <div className="mt-3 w-full bg-[#D6EBF3] dark:bg-[#203D49] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budget.isOverBudget
                    ? 'bg-red-500'
                    : budget.utilizationRate >= 80
                    ? 'bg-amber-500'
                    : 'bg-[#447F98]'
                }`}
                style={{ width: `${Math.min(100, budget.utilizationRate || 0)}%` }}
              />
            </div>
          )}
        </div>

        {/* Card 2: Top Expense Category */}
        <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-4 sm:p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#C4DCE3] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
              Top Spending Driver
            </span>
            <div className="p-2 rounded-xl bg-[#B9D9E1] dark:bg-[#203D49] text-[#243D49] dark:text-[#B9D9E1]">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-lg font-bold text-[#243D49] dark:text-[#D6EBF3] truncate">
              {catData.highest ? catData.highest.name : 'None yet'}
            </div>
            <div className="text-2xl font-black text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
              {catData.highest ? `${sym}${catData.highest.amount.toLocaleString()}` : `${sym}0`}
            </div>
            <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
              {catData.highest ? `${catData.highest.percentage}% of total expenses` : 'Add transactions'}
            </p>
          </div>
        </div>

        {/* Card 3: Daily Burn Rate & Projected Month-End */}
        <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-4 sm:p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#C4DCE3] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
              Daily Burn Rate
            </span>
            <div className="p-2 rounded-xl bg-[#B9D9E1] dark:bg-[#203D49] text-[#243D49] dark:text-[#B9D9E1]">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
              {sym}{metrics.dailyAverage.toLocaleString()}
              <span className="text-xs font-normal text-[#526C78] dark:text-[#83BDCF]">/day</span>
            </div>
            <p className="text-xs text-[#526C78] dark:text-[#83BDCF] pt-1">
              Projected Month-End:{' '}
              <strong className="text-[#243D49] dark:text-[#D6EBF3]">
                {sym}{metrics.projectedMonthlySpend.toLocaleString()}
              </strong>
            </p>
          </div>
        </div>

        {/* Card 4: Potential Savings Trim */}
        <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-4 sm:p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#C4DCE3] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
              15% Savings Trim
            </span>
            <div className="p-2 rounded-xl bg-[#B9D9E1] dark:bg-[#203D49] text-[#243D49] dark:text-[#B9D9E1]">
              <TrendingUp className="w-4 h-4 text-[#447F98]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
              +{sym}{savings.trim15Percent.toLocaleString()}
            </div>
            <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
              Discretionary spend: {sym}{savings.discretionarySpend.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Overspending / Alerts Banner (if any) */}
      {(budget.isOverBudget || categoryAlerts.length > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Pacing Attention Required</h4>
            <p className="text-xs mt-0.5 leading-relaxed">
              {budget.isOverBudget
                ? `You have exceeded your overall monthly limit by ${sym}${budget.overBudgetAmount.toLocaleString()}. `
                : ''}
              {categoryAlerts.length > 0
                ? `${categoryAlerts.map((a) => `${a.category} (${a.status === 'exceeded' ? 'exceeded' : 'near limit'})`).join(', ')}.`
                : ''}
            </p>
          </div>
          {onPromptSelect && (
            <button
              onClick={() => onPromptSelect('How can I cut expenses to get back on budget?')}
              className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors flex-shrink-0"
            >
              Ask AI Fix
            </button>
          )}
        </div>
      )}

      {/* Category Spend Distribution Bar */}
      {catData.breakdown.length > 0 && (
        <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-[#243D49] dark:text-[#D6EBF3]">
                Spending Breakdown by Category
              </h4>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                Distribution of expenses across logged categories
              </p>
            </div>
            {onPromptSelect && (
              <button
                onClick={() => onPromptSelect('Where is most of my money going?')}
                className="text-xs text-[#243D49] dark:text-[#83BDCF] hover:underline font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Analyze with AI
              </button>
            )}
          </div>

          <div className="space-y-3">
            {catData.breakdown.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#243D49] dark:text-[#D6EBF3]">
                    {cat.name}
                  </span>
                  <span className="text-[#526C78] dark:text-[#83BDCF]">
                    <strong className="text-[#243D49] dark:text-[#D6EBF3]">{sym}{cat.amount.toLocaleString()}</strong> ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#D6EBF3] dark:bg-[#203D49] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#447F98] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

