import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import Card from '../common/Card';
import { useCurrency } from '../../context/CurrencyContext';

export default function SavingsAnalysisWidget({
  totalIncome = 0,
  totalExpenses = 0,
  netSavings = 0,
  savingsRate = 0,
  prevNetSavings = 0,
  savingsPercentChange = 0,
  prevLabel = 'vs previous period',
}) {
  const { formatRawCurrency } = useCurrency();

  const isPositiveSavings = netSavings >= 0;
  const targetSavingsRate = 20; // 20% benchmark standard
  const benchmarkProgress = Math.min(100, Math.max(0, (savingsRate / targetSavingsRate) * 100));

  return (
    <Card
      title="Savings Rate & Accumulation"
      subtitle="Financial surplus analysis and benchmark pacing"
    >
      <div className="space-y-4">
        {/* Main Metric Spotlight */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <PiggyBank size={24} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#526C78] dark:text-[#83BDCF]">
                Net Savings (Income - Expenses)
              </span>
              <div className="text-2xl font-bold font-mono text-[#243D49] dark:text-[#D6EBF3]">
                {formatRawCurrency(netSavings)}
              </div>
              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                {savingsPercentChange !== 0 && (
                  <span
                    className={`inline-flex items-center font-semibold text-[11px] ${
                      savingsPercentChange > 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {savingsPercentChange > 0 ? '+' : ''}
                    {savingsPercentChange}%
                  </span>
                )}
                <span className="text-[#526C78] dark:text-[#83BDCF]">{prevLabel}</span>
              </div>
            </div>
          </div>

          {/* Savings Rate Gauge Card */}
          <div className="text-left sm:text-right bg-white/70 dark:bg-[#1B3440]/70 p-3 rounded-xl border border-[#C4DCE3]/60 dark:border-[#2C4E5E]/40 sm:min-w-[160px]">
            <span className="text-[11px] uppercase font-semibold text-[#526C78] dark:text-[#83BDCF]">
              Savings Rate
            </span>
            <div
              className={`text-2xl font-extrabold ${
                savingsRate >= 20
                  ? 'text-emerald-500'
                  : savingsRate > 0
                  ? 'text-teal-500'
                  : 'text-rose-500'
              }`}
            >
              {totalIncome > 0 ? `${savingsRate}%` : 'N/A'}
            </div>
            <span className="text-[10px] text-[#526C78] dark:text-[#83BDCF]">
              {totalIncome > 0 ? 'of total earnings' : 'No income recorded'}
            </span>
          </div>
        </div>

        {/* 20% Standard Benchmark Gauge */}
        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#152B35]/70 border border-[#C4DCE3]/40 dark:border-[#2C4E5E]/40 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#447F98]" />
              <span>Recommended 20% Savings Target</span>
            </span>
            <span className="font-bold text-[#447F98] dark:text-[#83BDCF]">
              {savingsRate >= 20 ? 'Goal Met' : `${savingsRate}% / 20%`}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-[#203D49] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                savingsRate >= 20 ? 'bg-emerald-500' : 'bg-[#447F98]'
              }`}
              style={{ width: `${benchmarkProgress}%` }}
            />
          </div>

          <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF] pt-0.5">
            {savingsRate >= 20
              ? '✨ Excellent financial discipline. You are surpassing the standard 50/30/20 wealth accumulation guideline.'
              : totalIncome > 0
              ? '💡 The 50/30/20 guideline recommends allocating at least 20% of net income toward savings and investments.'
              : 'Add income transactions to unlock savings rate benchmarking.'}
          </p>
        </div>
      </div>
    </Card>
  );
}

