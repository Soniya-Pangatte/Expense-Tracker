import React from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  ScanLine,
  Landmark,
  Edit3,
  Trash2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDelete,
}) {
  const { formatCurrency } = useCurrency();

  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'income';

  const getSourceBadge = (source) => {
    switch (source) {
      case 'receipt':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg">
            <ScanLine size={13} /> Receipt OCR
          </span>
        );
      case 'bank':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
            <Landmark size={13} /> Bank Import
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#526C78] dark:text-[#83BDCF] bg-[#D6EBF3]/50 dark:bg-[#1B3541] px-2.5 py-1 rounded-lg">
            <Edit3 size={13} /> Manual Entry
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4DCE3] dark:border-[#365765] bg-[#D6EBF3]/30 dark:bg-[#1B3541]/40">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isIncome
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                Transaction Details
              </h3>
              <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">
                ID: {transaction.id?.slice(0, 8)}...
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

        {/* Amount Banner */}
        <div className="px-6 py-5 text-center bg-[#D6EBF3]/20 dark:bg-[#1B3541]/20 border-b border-[#C4DCE3]/50 dark:border-[#365765]/50">
          <span
            className={`text-3xl font-extrabold tracking-tight ${
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#243D49] dark:text-[#D6EBF3]'
            }`}
          >
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency || 'INR')}
          </span>
          <p className="text-sm font-semibold text-[#526C78] dark:text-[#83BDCF] mt-1">
            {transaction.description}
          </p>
          {transaction.merchant && transaction.merchant !== transaction.description && (
            <p className="text-xs text-[#758D97] dark:text-[#83BDCF]/80 mt-0.5">
              Merchant: {transaction.merchant}
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-3.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/50 dark:border-[#365765]/50">
            <span className="text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1.5 font-medium">
              <Tag size={14} /> Category
            </span>
            <Badge variant="neutral">{transaction.categoryName || transaction.category_name || 'General'}</Badge>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/50 dark:border-[#365765]/50">
            <span className="text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1.5 font-medium">
              <Calendar size={14} /> Date
            </span>
            <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
              {new Date(transaction.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/50 dark:border-[#365765]/50">
            <span className="text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1.5 font-medium">
              <CreditCard size={14} /> Payment Method
            </span>
            <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
              {transaction.paymentMethod || transaction.payment_method || 'Credit Card'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/50 dark:border-[#365765]/50">
            <span className="text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1.5 font-medium">
              <Clock size={14} /> Origin Source
            </span>
            {getSourceBadge(transaction.source)}
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#C4DCE3]/50 dark:border-[#365765]/50">
            <span className="text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} /> Currency
            </span>
            <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
              {transaction.currency || 'INR'}
            </span>
          </div>

          {/* Notes */}
          <div className="pt-1">
            <span className="block text-[#526C78] dark:text-[#83BDCF] font-medium mb-1 flex items-center gap-1.5">
              <FileText size={14} /> Notes
            </span>
            <div className="p-3 rounded-xl bg-[#D6EBF3]/40 dark:bg-[#1B3541] text-[#243D49] dark:text-[#D6EBF3] text-xs">
              {transaction.notes ? transaction.notes : <span className="italic text-[#758D97]">No notes attached to this transaction.</span>}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#D6EBF3]/20 dark:bg-[#1B3541]/40 border-t border-[#C4DCE3] dark:border-[#365765] flex items-center justify-between gap-2">
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => {
              onClose();
              if (onDelete) onDelete(transaction);
            }}
          >
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Edit3}
              onClick={() => {
                onClose();
                if (onEdit) onEdit(transaction);
              }}
            >
              Edit
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

