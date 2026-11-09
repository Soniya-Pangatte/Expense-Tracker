import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, FileText } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function AddExpense() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = paramId || searchParams.get('edit');

  const { transactions, categories, addTransaction, editTransaction } = useTransactions();
  const { currency: defaultCurrency, getCurrencySymbol } = useCurrency();

  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (Visa)');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isEditMode = Boolean(editId);

  // If in edit mode, populate data from matching transaction
  useEffect(() => {
    if (editId && transactions.length > 0) {
      const existing = transactions.find((t) => t.id === editId);
      if (existing) {
        setType(existing.type || 'expense');
        setDescription(existing.description || '');
        setMerchant(existing.merchant || '');
        setAmount(existing.amount !== undefined ? String(existing.amount) : '');
        setCurrency(existing.currency || defaultCurrency);
        setCategoryId(existing.categoryId || existing.category_id || '');
        setPaymentMethod(existing.paymentMethod || existing.payment_method || 'Credit Card (Visa)');
        setDate(existing.date || new Date().toISOString().split('T')[0]);
        setNotes(existing.notes || '');
      }
    }
  }, [editId, transactions, defaultCurrency]);

  // Filter categories by type
  const availableCategories = categories.filter((c) =>
    type === 'income' ? c.isIncome : !c.isIncome
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!description.trim()) {
      setSubmitError('Please enter a transaction title or description.');
      return;
    }

    if (!date) {
      setSubmitError('Please select a valid date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCat = categories.find((c) => c.id === categoryId) || availableCategories[0];

      const payload = {
        description: description.trim(),
        merchant: merchant.trim() || description.trim(),
        amount: parsedAmount,
        currency,
        type,
        categoryId: selectedCat?.id,
        categoryName: selectedCat?.name || 'General',
        date,
        paymentMethod,
        notes: notes.trim() || null,
        source: 'manual',
      };

      if (isEditMode) {
        await editTransaction(editId, payload);
      } else {
        await addTransaction(payload);
      }

      setSubmitted(true);
      setTimeout(() => {
        navigate('/transactions');
      }, 500);
    } catch (err) {
      console.error('Failed to save transaction:', err);
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
            {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF]">
            {isEditMode
              ? 'Modify the details of your recorded transaction.'
              : 'Record a new income or expense manually.'}
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
                  : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49]'
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
                  : 'text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49]'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount & Currency Fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Amount *
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-3 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98] font-bold h-[50px] mt-0.5"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Description / Title *
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

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add optional notes, tags, or invoice numbers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98] resize-none"
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
                  <Check size={18} /> {isEditMode ? 'Updated Successfully!' : 'Recorded Successfully!'}
                </span>
              ) : isSubmitting ? (
                isEditMode ? 'Saving Changes...' : 'Saving Transaction...'
              ) : (
                isEditMode ? 'Save Changes' : `Save ${type === 'income' ? 'Income' : 'Expense'}`
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
