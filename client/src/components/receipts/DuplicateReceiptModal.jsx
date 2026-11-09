import React from 'react';
import { AlertTriangle, X, Check, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import Button from '../common/Button';
import { useCurrency } from '../../context/CurrencyContext';

export default function DuplicateReceiptModal({
  isOpen,
  onClose,
  existingReceipt,
  onForceProcess,
  onViewExisting,
}) {
  const { formatCurrency } = useCurrency();

  if (!isOpen || !existingReceipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4DCE3] dark:border-[#365765] bg-amber-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-800 dark:text-amber-300">
                Possible Duplicate Receipt
              </h3>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                Identical file hash detected in your records
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
            This exact receipt file was previously uploaded. To avoid double-counting expenses, please verify if you want to re-process it or view the existing record.
          </p>

          {/* Existing Receipt Preview Summary */}
          <div className="p-3.5 rounded-xl bg-[#D6EBF3]/30 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#526C78] dark:text-[#83BDCF]">Merchant:</span>
              <span className="font-bold text-[#243D49] dark:text-[#D6EBF3]">
                {existingReceipt.merchant_name || 'Receipt'}
              </span>
            </div>
            {existingReceipt.total_amount && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#526C78] dark:text-[#83BDCF]">Amount:</span>
                <span className="font-bold text-[#447F98] dark:text-[#83BDCF]">
                  {formatCurrency(existingReceipt.total_amount, existingReceipt.currency || 'INR')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#526C78] dark:text-[#83BDCF]">Date:</span>
              <span className="text-[#243D49] dark:text-[#D6EBF3]">
                {existingReceipt.receipt_date || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#526C78] dark:text-[#83BDCF]">Status:</span>
              <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {existingReceipt.status}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onForceProcess();
                onClose();
              }}
              icon={RefreshCw}
              className="w-full sm:w-auto !text-amber-700 dark:!text-amber-300 border-amber-300 hover:bg-amber-500/10"
            >
              Process Again
            </Button>
            {onViewExisting && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  onViewExisting(existingReceipt);
                  onClose();
                }}
                icon={ArrowRight}
                className="w-full sm:w-auto"
              >
                View Existing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
