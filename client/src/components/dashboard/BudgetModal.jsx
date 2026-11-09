import React, { useState, useEffect } from 'react';
import { X, PieChart, Check, AlertCircle, Trash2, Calendar } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../common/Button';

export default function BudgetModal({ isOpen, onClose }) {
  const {
    monthlyBudgetsList,
    selectedBudgetMonth,
    setSelectedBudgetMonth,
    currentMonthKey,
    updateMonthlyBudget,
    deleteMonthlyBudget,
  } = useTransactions();
  const { currency, getCurrencySymbol } = useCurrency();

  const [monthKey, setMonthKey] = useState(selectedBudgetMonth || currentMonthKey);
  const [name, setName] = useState('Monthly Budget');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync inputs when modal opens or selected month changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setConfirmDelete(false);
      const activeKey = selectedBudgetMonth || currentMonthKey;
      setMonthKey(activeKey);

      const existingRecord = monthlyBudgetsList.find((b) => b.month_year === activeKey);
      if (existingRecord) {
        setName(existingRecord.name || 'Monthly Budget');
        setAmount(String(existingRecord.amount));
        setDescription(existingRecord.description || '');
      } else {
        setName('Monthly Budget');
        setAmount('');
        setDescription('');
      }
    }
  }, [isOpen, selectedBudgetMonth, currentMonthKey, monthlyBudgetsList]);

  // When user switches monthKey in modal, autofill if existing
  const handleMonthChange = (newMonth) => {
    setMonthKey(newMonth);
    setConfirmDelete(false);
    const existing = monthlyBudgetsList.find((b) => b.month_year === newMonth);
    if (existing) {
      setName(existing.name || 'Monthly Budget');
      setAmount(String(existing.amount));
      setDescription(existing.description || '');
    } else {
      setName('Monthly Budget');
      setAmount('');
      setDescription('');
    }
  };

  if (!isOpen) return null;

  const existingRecordForSelectedMonth = monthlyBudgetsList.find((b) => b.month_year === monthKey);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid budget amount (0 or positive).');
      return;
    }

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      setError('Please select a valid month and year (YYYY-MM).');
      return;
    }

    setLoading(true);
    try {
      await updateMonthlyBudget(parsed, currency, monthKey, name.trim(), description.trim());
      setSelectedBudgetMonth(monthKey);
      onClose();
    } catch (err) {
      console.error('Error updating monthly budget:', err);
      setError(err.message || 'Failed to save budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async () => {
    setLoading(true);
    try {
      await deleteMonthlyBudget(monthKey);
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error('Error deleting monthly budget:', err);
      setError(err.message || 'Failed to delete budget.');
    } finally {
      setLoading(false);
    }
  };

  // Format month for display
  const [yearStr, monthStr] = (monthKey || '2026-11').split('-');
  const displayMonthDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const displayMonthName = isNaN(displayMonthDate)
    ? monthKey
    : displayMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4DCE3] dark:border-[#365765]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#447F98]/20 text-[#447F98] dark:text-[#83BDCF]">
              <PieChart size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                {existingRecordForSelectedMonth ? 'Edit Monthly Budget' : 'Create Monthly Budget'}
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                Target spending cap for {displayMonthName}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Month & Year Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Budget Month *
              </label>
              <input
                type="month"
                required
                value={monthKey}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Budget Name
              </label>
              <input
                type="text"
                placeholder="e.g. Monthly Budget"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
          </div>

          {/* Amount */}
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
                className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-[#D6EBF3]/30 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
            <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF] mt-1.5">
              Target monthly ceiling for all expense tracking.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly cap including rent & utilities"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            />
          </div>

          {/* Confirm Delete prompt */}
          {confirmDelete && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                Remove budget target for {displayMonthName}? Your transactions will remain safe.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="!text-xs !py-1 text-rose-600 border-rose-300 hover:bg-rose-500/10"
                  onClick={handleDeleteBudget}
                  disabled={loading}
                >
                  Yes, Delete Budget
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-[#526C78] dark:text-[#83BDCF] hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#C4DCE3] dark:border-[#365765]">
            {existingRecordForSelectedMonth && !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 font-semibold"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading} icon={Check}>
                Save Monthly Budget
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
