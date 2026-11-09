import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Search,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  Layers,
  Filter,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useCurrency } from '../../context/CurrencyContext';
import { getSourceLabel } from '../../data/transactionOptions';

export default function TransactionDrillDownModal({
  isOpen,
  onClose,
  categoryName = null,
  transactions = [],
  dateRangeLabel = '',
  startDate = '',
  endDate = '',
}) {
  const navigate = useNavigate();
  const { currency, formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  if (!isOpen) return null;

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Category filter if specified
      if (categoryName && categoryName !== 'All') {
        const cat = t.categoryName || t.category_name || 'General';
        if (cat.toLowerCase() !== categoryName.toLowerCase()) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const d = (t.description || '').toLowerCase();
        const m = (t.merchant || '').toLowerCase();
        const c = (t.categoryName || t.category_name || '').toLowerCase();
        const a = String(t.amount);
        return d.includes(q) || m.includes(q) || c.includes(q) || a.includes(q);
      }

      return true;
    });
  }, [transactions, categoryName, typeFilter, search]);

  // Aggregate drill-down summary
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((t) => {
      const a = Number(t.amount) || 0;
      if (t.type === 'income') income += a;
      else expense += a;
    });
    return {
      count: filtered.length,
      totalIncome: income,
      totalExpense: expense,
    };
  }, [filtered]);

  const handleNavigateToLedger = () => {
    onClose();
    navigate('/transactions', {
      state: {
        category: categoryName && categoryName !== 'All' ? categoryName : 'all',
        startDate,
        endDate,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1B3440] border border-[#C4DCE3] dark:border-[#2C4E5E] rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#C4DCE3]/60 dark:border-[#2C4E5E]/60 flex items-center justify-between bg-gray-50/50 dark:bg-[#152B35]/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#447F98]" />
              <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                {categoryName && categoryName !== 'All'
                  ? `${categoryName} Transactions`
                  : 'Itemized Transactions Drill-Down'}
              </h3>
            </div>
            <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-0.5">
              Filtered for <span className="font-semibold">{dateRangeLabel}</span> ({startDate} to {endDate})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#203D49] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Summary Bar & Search */}
        <div className="p-4 border-b border-[#C4DCE3]/40 dark:border-[#2C4E5E]/40 bg-white dark:bg-[#1B3440] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#152B35] font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                {summary.count} {summary.count === 1 ? 'Transaction' : 'Transactions'}
              </div>
              {summary.totalExpense > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                  Total Spent: {formatAmount(summary.totalExpense, currency)}
                </div>
              )}
              {summary.totalIncome > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  Total Inflow: {formatAmount(summary.totalIncome, currency)}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToLedger}
              className="text-xs flex items-center gap-1.5"
            >
              <span>Open in Transactions Ledger</span>
              <ExternalLink size={13} />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search description, merchant, or amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3] focus:outline-hidden focus:ring-2 focus:ring-[#447F98]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#C4DCE3]/80 dark:border-[#2C4E5E]/80 bg-white dark:bg-[#172E38] text-xs text-[#243D49] dark:text-[#D6EBF3] w-full sm:w-auto"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>

        {/* Scrollable Transaction List Table */}
        <div className="overflow-y-auto flex-1 p-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#526C78] dark:text-[#83BDCF]">
              No transactions match the selected filter in this date range.
            </div>
          ) : (
            <div className="border border-[#C4DCE3]/50 dark:border-[#2C4E5E]/40 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-[#152B35] text-[#526C78] dark:text-[#83BDCF] border-b border-[#C4DCE3]/40 dark:border-[#2C4E5E]/40">
                  <tr>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold">Method</th>
                    <th className="p-3 font-semibold">Source</th>
                    <th className="p-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C4DCE3]/30 dark:divide-[#2C4E5E]/30 text-[#243D49] dark:text-[#D6EBF3]">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/70 dark:hover:bg-[#203D49]/50 transition-colors">
                      <td className="p-3 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                        {t.date}
                      </td>
                      <td className="p-3 font-medium">
                        <div className="font-semibold">{t.description}</div>
                        {t.merchant && t.merchant !== t.description && (
                          <div className="text-[10px] text-[#526C78] dark:text-[#83BDCF]">{t.merchant}</div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#152B35] text-[10px] font-semibold text-[#526C78] dark:text-[#83BDCF]">
                          {t.categoryName || t.category_name || 'General'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-[11px] text-[#526C78] dark:text-[#83BDCF]">
                        {t.paymentMethod || t.payment_method || 'Other'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                          {getSourceLabel(t.source)}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-right font-mono font-bold">
                        <span className={t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}>
                          {t.type === 'income' ? '+' : '-'}
                          {formatAmount(Number(t.amount) || 0, t.currency || currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#C4DCE3]/60 dark:border-[#2C4E5E]/60 flex items-center justify-end bg-gray-50/50 dark:bg-[#152B35]/50">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

