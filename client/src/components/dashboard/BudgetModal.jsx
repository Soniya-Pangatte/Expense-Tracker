import React, { useState, useEffect } from 'react';
import { X, PieChart, Check, AlertCircle } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../common/Button';

export default function BudgetModal({ isOpen, onClose }) {
  const { monthlyBudget, updateMonthlyBudget } = useTransactions();
  const { currency, getCurrencySymbol } = useCurrency();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync current monthly budget when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(monthlyBudget ? String(monthlyBudget) : '');
      setError('');
    }
  }, [isOpen, monthlyBudget]);

  if (!isOpen) return null;

  const currentMonthName = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid budget amount.');
      return;
    }

    setLoading(true);
    try {
      await updateMonthlyBudget(parsed, currency);
      onClose();
    } catch (err) {
      console.error('Error updating monthly budget:', err);
      setError(err.message || 'Failed to save budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4DCE3] dark:border-[#365765]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#B9D9E1]/20 text-[#243D49] dark:text-[#83BDCF]">
              <PieChart size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                Set Monthly Budget
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                Target spending cap for {currentMonthName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Monthly Budget Cap ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#526C78] dark:text-[#83BDCF]">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
            <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF] mt-1.5">
              Set to 0 to disable monthly budget tracking.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading} icon={Check}>
              Save Monthly Budget
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

