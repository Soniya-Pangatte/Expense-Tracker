import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Button from '../common/Button';

export default function DeleteBudgetLimitModal({
  isOpen,
  onClose,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName = '',
  onConfirm,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDelete = async () => {
    setError('');
    setLoading(true);
    try {
      await onConfirm();
      setLoading(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
      setError(err.message || 'Failed to delete. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4DCE3] dark:border-[#365765] bg-rose-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-base font-bold text-rose-700 dark:text-rose-300">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF]">
            {message}
          </p>

          {itemName && (
            <div className="p-3 rounded-xl bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765]">
              <span className="text-xs font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                {itemName}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
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
              type="button"
              variant="primary"
              size="sm"
              className="!bg-rose-600 hover:!bg-rose-700 text-white"
              onClick={handleDelete}
              loading={loading}
              icon={Trash2}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
