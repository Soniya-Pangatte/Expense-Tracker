import React, { useState, useEffect } from 'react';
import { X, Repeat, DollarSign, Calendar, AlertCircle, CreditCard, Clock, Tag } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useCurrency } from '../../context/CurrencyContext';
import { PAYMENT_METHODS } from '../../data/transactionOptions';
import Button from '../common/Button';

const FREQUENCY_OPTIONS = [
  'Daily',
  'Weekly',
  'Monthly',
  'Quarterly',
  'Yearly',
];

const STATUS_OPTIONS = [
  'Active',
  'Paused',
  'Completed',
];

export default function RecurringExpenseModal({ isOpen, onClose, recurring = null }) {
  const { categories, addRecurringExpense, updateRecurringExpense } = useTransactions();
  const { currency, getCurrencySymbol } = useCurrency();

  const isEditing = Boolean(recurring);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [frequency, setFrequency] = useState('Monthly');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter out income categories for recurring bills
  const expenseCategories = categories.filter((c) => !c.isIncome && !c.is_income);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (recurring) {
        setName(recurring.name || '');
        setAmount(String(recurring.amount || ''));
        setCategory(recurring.category || expenseCategories[0]?.name || 'General');
        setPaymentMethod(recurring.paymentMethod || recurring.payment_method || 'UPI');
        setFrequency(recurring.frequency || 'Monthly');
        setDueDate(recurring.dueDate || recurring.due_date || '1st of month');
        setStartDate(recurring.startDate || recurring.start_date || new Date().toISOString().split('T')[0]);
        setNotes(recurring.notes || recurring.description || '');
        setStatus(recurring.status || 'Active');
      } else {
        setName('');
        setAmount('');
        setCategory(expenseCategories[0]?.name || 'General');
        setPaymentMethod('UPI');
        setFrequency('Monthly');
        setDueDate('1st of month');
        setStartDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setStatus('Active');
      }
    }
  }, [isOpen, recurring]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid bill amount greater than zero.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a bill or subscription title.');
      return;
    }

    if (!dueDate.trim()) {
      setError('Please enter a due schedule or due date.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        amount: parsedAmount,
        currency,
        category: category || 'General',
        frequency,
        dueDate: dueDate.trim(),
        paymentMethod,
        startDate: startDate || new Date().toISOString().split('T')[0],
        notes: notes.trim(),
        status,
      };

      if (isEditing) {
        await updateRecurringExpense(recurring.id, payload);
      } else {
        await addRecurringExpense(payload);
      }
      onClose();
    } catch (err) {
      console.error('Error saving recurring expense:', err);
      setError(err.message || 'Failed to save recurring expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4DCE3] dark:border-[#365765]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#447F98]/20 text-[#447F98] dark:text-[#83BDCF]">
              <Repeat size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                {isEditing ? 'Edit Recurring Bill' : 'Add Recurring Bill / Subscription'}
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                Track automated subscriptions, renewals, and periodic payments
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Expense Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Netflix, Wifi, Rent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Amount ({currency}) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#526C78] dark:text-[#83BDCF]">
                  {getCurrencySymbol()}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 799"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-sm font-bold placeholder-[#526C78]/50 focus:outline-none focus:ring-2 focus:ring-[#447F98]"
                />
              </div>
            </div>
          </div>

          {/* Category & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              >
                {expenseCategories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Billing Frequency *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Schedule Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Schedule & Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Due Schedule / Next Due Date *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5th of month or 2026-11-25"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Start / Subscription Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Notes / Account ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Account #849204, Auto-debit via Visa card"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C4DCE3] dark:border-[#365765]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Recurring Bill' : 'Save Recurring Bill'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

