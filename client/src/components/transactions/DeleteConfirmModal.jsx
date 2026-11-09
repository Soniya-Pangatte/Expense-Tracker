import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../common/Button';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  transaction,
  onConfirm,
}) {
  const { formatCurrency } = useCurrency();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!isOpen || !transaction) return null;

  const handleDelete = async () => {
    setDeleteError('');
    setIsDeleting(true);
    try {
      await onConfirm(transaction.id);
      setIsDeleting(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      setDeleteError(err.message || 'Failed to delete transaction. Please try again.');
      setIsDeleting(false);
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
              Confirm Transaction Deletion
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF]">
            Are you sure you want to permanently delete this transaction? This action will immediately adjust your ledger, category budgets, and overall balance.
          </p>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
              {deleteError}
            </div>
          )}

          {/* Identified Transaction Card */}
          <div className="p-3.5 rounded-xl bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#243D49] dark:text-[#D6EBF3]">
                {transaction.description}
              </span>
              <span className="font-bold text-xs text-[#243D49] dark:text-[#D6EBF3]">
                {formatCurrency(transaction.amount, transaction.currency || 'INR')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#758D97] dark:text-[#83BDCF]">
              <span>{transaction.categoryName || transaction.category_name || 'General'}</span>
              <span>{new Date(transaction.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#C4DCE3] dark:border-[#365765] bg-[#D6EBF3]/20 dark:bg-[#1B3541]/40 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Transaction'}
          </Button>
        </div>
      </div>
    </div>
  );
}
