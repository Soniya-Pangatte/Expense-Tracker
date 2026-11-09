import React from 'react';
import { Download, BarChart2, TrendingUp, Calendar } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart';
import CategoryBreakdownChart from '../components/dashboard/CategoryBreakdownChart';

export default function Analytics() {
  const { stats, transactions } = useTransactions();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Financial Analytics & Reports
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Deep dive into spending habits, savings velocities, and exportable financial reports in {currency}.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
          Export CSV Ledger
        </Button>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingTrendChart data={stats.spendingTrends} />
        </div>
        <div className="lg:col-span-1">
          <CategoryBreakdownChart data={stats.categoryBreakdown} />
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="!p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
            Avg. Daily Spend
          </p>
          <p className="text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] mt-1">
            {formatRawCurrency(avgDailySpend)}
          </p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
            Top Category
          </p>
          <p className="text-xl font-bold text-[#447F98] mt-1 truncate">
            {stats.categoryBreakdown[0]?.name || 'N/A'}
          </p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
            Net Savings Rate
          </p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.savingsRate}%
          </p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
            Total Entries
          </p>
          <p className="text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] mt-1">
            {transactions.length} records
          </p>
        </Card>
      </div>
    </div>
  );
}
