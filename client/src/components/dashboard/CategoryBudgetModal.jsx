import React, { useState, useEffect } from 'react';
import { X, Tag, DollarSign, AlertCircle, Palette, Calendar } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../common/Button';

const COLOR_OPTIONS = [
  '#447F98', // Primary Turquoise
  '#629BB5', // Slate Blue
  '#2A6F97', // Deep Ocean
  '#014F86', // Classic Navy
  '#2A9D8F', // Teal
  '#E76F51', // Terracotta
  '#F4A261', // Amber Coral
  '#E9C46A', // Goldenrod
  '#6D597A', // Plum
  '#526C78', // Slate Grey
];

export default function CategoryBudgetModal({ isOpen, onClose, budget = null }) {
  const { categories, budgets, addCategoryBudget, updateCategoryBudget } = useTransactions();
  const { currency, getCurrencySymbol } = useCurrency();

  const isEditing = Boolean(budget);

  const [categoryName, setCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [color, setColor] = useState('#447F98');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Available categories: filter out categories that already have a budget (except the currently edited one)
  const availableCategories = categories.filter((c) => {
    if (c.isIncome || c.is_income) return false;
    if (isEditing && (c.name === budget.categoryName || c.name === budget.category_name)) return true;
    const alreadyHasBudget = budgets.some(
      (b) => (b.categoryName || b.category_name)?.toLowerCase() === c.name.toLowerCase()
    );
    return !alreadyHasBudget;
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (budget) {
        setCategoryName(budget.categoryName || budget.category_name || '');
        setCategoryId(budget.categoryId || budget.category_id || '');
        setLimitAmount(String(budget.limitAmount ?? budget.limit ?? ''));
        setPeriod(budget.period || 'monthly');
        setColor(budget.color || '#447F98');
        setDescription(budget.description || '');
      } else {
        const firstAvailable = availableCategories[0]?.name || '';
        const firstId = availableCategories[0]?.id || '';
        setCategoryName(firstAvailable);
        setCategoryId(firstId);
        setLimitAmount('');
        setPeriod('monthly');
        setColor('#447F98');
        setDescription('');
      }
    }
  }, [isOpen, budget]);

  if (!isOpen) return null;

  const handleCategorySelect = (selectedName) => {
    setCategoryName(selectedName);
    const cat = categories.find((c) => c.name === selectedName);
    if (cat) {
      setCategoryId(cat.id);
      if (cat.color) setColor(cat.color);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedLimit = parseFloat(limitAmount);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Please specify a positive budget limit amount.');
      return;
    }

    if (!categoryName) {
      setError('Please select a category.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateCategoryBudget(budget.id, {
          categoryName,
          categoryId,
          limitAmount: parsedLimit,
          currency,
          period,
          color,
          description: description.trim(),
        });
      } else {
        await addCategoryBudget({
          categoryName,
          categoryId,
          limitAmount: parsedLimit,
          currency,
          period,
          color,
          description: description.trim(),
        });
      }
      onClose();
    } catch (err) {
      console.error('Error saving category budget:', err);
      setError(err.message || 'Failed to save budget limit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4DCE3] dark:border-[#365765]">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              <Tag size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                {isEditing ? 'Edit Category Budget' : 'Add Category Budget Limit'}
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                {isEditing ? 'Update spending limit & preferences' : 'Set a spending ceiling for this category'}
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

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Expense Category *
            </label>
            {isEditing ? (
              <input
                type="text"
                disabled
                value={categoryName}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-gray-100 dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-sm font-semibold cursor-not-allowed opacity-80"
              />
            ) : (
              <select
                value={categoryName}
                onChange={(e) => handleCategorySelect(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              >
                {availableCategories.length === 0 ? (
                  <option value="" disabled>All categories have budgets assigned</option>
                ) : (
                  availableCategories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Spending Limit Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Spending Limit ({currency}) *
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
                placeholder="e.g. 5000"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-sm font-bold placeholder-[#526C78]/50 focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              />
            </div>
          </div>

          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Budget Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#447F98]"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {COLOR_OPTIONS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#447F98]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Dining out & takeout weekend limits"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              disabled={loading || (!isEditing && availableCategories.length === 0)}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Limit' : 'Create Budget Limit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
