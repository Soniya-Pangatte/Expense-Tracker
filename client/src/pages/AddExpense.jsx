import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function AddExpense() {
  const navigate = useNavigate();
  const { categories, addTransaction } = useTransactions();
  const { currency, getCurrencySymbol } = useCurrency();

  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (Visa)');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Filter categories by type
  const availableCategories = categories.filter((c) =>
    type === 'income' ? c.isIncome : !c.isIncome
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || isSubmitting) return;

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const selectedCat = categories.find((c) => c.id === categoryId) || availableCategories[0];

      await addTransaction({
        description,
        merchant: merchant || description,
        amount: parseFloat(amount),
        currency, // Store with active currency
        type,
        categoryId: selectedCat?.id,
        categoryName: selectedCat?.name || 'General',
        date,
        paymentMethod,
        source: 'manual',
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate('/transactions');
      }, 600);
    } catch (err) {
      console.error('Failed to add transaction:', err);
      setSubmitError(err.message || 'Failed to record transaction. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Add Transaction
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF]">
            Record a new income or expense manually.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Income / Expense Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#D6EBF3]/50 dark:bg-[#1B3541] rounded-xl border border-[#C4DCE3] dark:border-[#365765]">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId('');
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-white dark:bg-[#203D49] text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-[#526C78] dark:text-[#EAF4F7] dark:text-[#83BDCF] hover:text-[#243D49]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId('');
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-white dark:bg-[#203D49] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-[#526C78] dark:text-[#EAF4F7] dark:text-[#83BDCF] hover:text-[#243D49]'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Amount ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#526C78] dark:text-[#83BDCF]">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 text-xl font-bold bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
          </div>

          {/* Description & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grocery trip"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Merchant / Payee
              </label>
              <input
                type="text"
                placeholder="e.g. Supermarket"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Category *
              </label>
              <select
                value={categoryId || availableCategories[0]?.id || ''}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              >
                <option value="UPI / Online">UPI / Online</option>
                <option value="Credit Card (Visa)">Credit Card (Visa)</option>
                <option value="Credit Card (Mastercard)">Credit Card (Mastercard)</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Direct Deposit">Direct Deposit</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            />
          </div>

          {/* Submit */}
          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              disabled={submitted || isSubmitting}
            >
              {submitted ? (
                <span className="flex items-center gap-2">
                  <Check size={18} /> Recorded Successfully!
                </span>
              ) : isSubmitting ? (
                'Saving Transaction...'
              ) : (
                `Save ${type === 'income' ? 'Income' : 'Expense'}`
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
