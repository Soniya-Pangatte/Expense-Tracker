import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Calendar, Tag, CreditCard, DollarSign, FileText } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../../context/CurrencyContext';
import Button from '../common/Button';

export default function TransactionFormModal({
  isOpen,
  onClose,
  transaction = null, // null for create mode, or transaction object for edit mode
  onSuccess,
}) {
  const isEditMode = Boolean(transaction && transaction.id);
  const { categories, addTransaction, editTransaction } = useTransactions();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-fill fields when transaction prop changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setIsSubmitting(false);

      if (transaction) {
        setType(transaction.type || 'expense');
        setDescription(transaction.description || '');
        setMerchant(transaction.merchant || '');
        setAmount(transaction.amount !== undefined ? String(transaction.amount) : '');
        setCurrency(transaction.currency || defaultCurrency);
        setCategoryId(transaction.categoryId || transaction.category_id || '');
        setPaymentMethod(transaction.paymentMethod || transaction.payment_method || 'Credit Card (Visa)');
        setDate(transaction.date || new Date().toISOString().split('T')[0]);
        setNotes(transaction.notes || '');
      } else {
        // Reset to fresh create form
        setType('expense');
        setDescription('');
        setMerchant('');
        setAmount('');
        setCurrency(defaultCurrency);
        setCategoryId('');
        setPaymentMethod('Credit Card (Visa)');
        setDate(new Date().toISOString().split('T')[0]);
        setNotes('');
      }
    }
  }, [isOpen, transaction, defaultCurrency]);

  if (!isOpen) return null;

  // Filter available categories matching selected type
  const availableCategories = categories.filter((c) =>
    type === 'income' ? c.isIncome : !c.isIncome
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than zero.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Please enter a transaction title or description.');
      return;
    }

    if (!date) {
      setErrorMessage('Please select a valid date.');
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId) || availableCategories[0];

    setIsSubmitting(true);

    try {
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
        source: transaction?.source || 'manual',
      };

      if (isEditMode) {
        await editTransaction(transaction.id, payload);
      } else {
        await addTransaction(payload);
      }

      if (onSuccess) {
        onSuccess(isEditMode ? 'Transaction updated successfully.' : 'Transaction added successfully.');
      }
      onClose();
    } catch (err) {
      console.error('Error saving transaction:', err);
      setErrorMessage(err.message || 'Failed to save transaction. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4DCE3] dark:border-[#365765] bg-[#D6EBF3]/30 dark:bg-[#1B3541]/40">
          <div>
            <h3 className="text-lg font-bold text-[#243D49] dark:text-[#D6EBF3]">
              {isEditMode ? 'Edit Transaction' : 'Record New Transaction'}
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
              {isEditMode ? 'Update transaction details in your ledger' : 'Add an income or expense record manually'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
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
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 text-base font-bold bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
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
                className="w-full px-3 py-2.5 text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98] font-semibold"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Description / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grocery Store"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Merchant / Payee
              </label>
              <input
                type="text"
                placeholder="e.g. Walmart, Client Corp"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-4 py-2 text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Category *
              </label>
              <select
                value={categoryId || availableCategories[0]?.id || ''}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
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
                className="w-full px-3 py-2 text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
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
              className="w-full px-4 py-2 text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add optional notes, tags, or invoice reference..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98] resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#C4DCE3]/60 dark:border-[#365765]/60">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? 'Saving Changes...'
                  : 'Recording Transaction...'
                : isEditMode
                ? 'Save Changes'
                : `Record ${type === 'income' ? 'Income' : 'Expense'}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
