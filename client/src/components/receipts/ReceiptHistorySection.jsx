import React, { useState } from 'react';
import {
  FileText,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  ArrowRight,
  ExternalLink,
  Store,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useCurrency } from '../../context/CurrencyContext';

export default function ReceiptHistorySection({
  receipts = [],
  onSelectReceipt,
  onDeleteReceipt,
  loading = false,
}) {
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReceipts = receipts.filter((r) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'confirmed' && r.status === 'confirmed') ||
      (statusFilter === 'review' && (r.status === 'review_required' || r.status === 'pending_review')) ||
      (statusFilter === 'failed' && r.status === 'failed');

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (r.merchant_name && r.merchant_name.toLowerCase().includes(searchLower)) ||
      (r.file_name && r.file_name.toLowerCase().includes(searchLower)) ||
      (r.receipt_date && r.receipt_date.includes(searchLower));

    return matchesStatus && matchesSearch;
  });

  return (
    <Card className="!p-0 overflow-hidden space-y-0">
      {/* Search & Status Filters Bar */}
      <div className="p-4 sm:p-5 border-b border-[#C4DCE3] dark:border-[#365765] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#83BDCF]" />
          <input
            type="text"
            placeholder="Search by merchant, file, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-xs text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Receipts' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'review', label: 'Needs Review' },
            { id: 'failed', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-[#447F98] text-white shadow-sm'
                  : 'bg-[#B9D9E1]/20 dark:bg-[#1B3541] text-[#526C78] dark:text-[#83BDCF] hover:bg-[#B9D9E1]/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-[#C4DCE3] dark:border-[#365765] bg-[#B9D9E1]/20 dark:bg-[#1B3541]/60 text-[11px] uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
              <th className="px-5 py-3.5 font-semibold">Preview & Merchant</th>
              <th className="px-4 py-3.5 font-semibold">Receipt Date</th>
              <th className="px-4 py-3.5 font-semibold">Category</th>
              <th className="px-4 py-3.5 font-semibold">Status</th>
              <th className="px-4 py-3.5 font-semibold text-right">Extracted Amount</th>
              <th className="px-5 py-3.5 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C4DCE3]/60 dark:divide-[#365765]/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-xs text-[#526C78] dark:text-[#83BDCF]">
                  Loading receipt history...
                </td>
              </tr>
            ) : filteredReceipts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center text-[#526C78] dark:text-[#83BDCF]">
                  <FileText size={32} className="mx-auto mb-2 opacity-50 text-[#447F98]" />
                  <p className="font-semibold text-sm text-[#243D49] dark:text-[#D6EBF3]">
                    No receipts found.
                  </p>
                  <p className="text-xs mt-1">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search query or filters.'
                      : 'Upload and scan your first receipt to start building an automated archive.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredReceipts.map((rec) => {
                const isConfirmed = rec.status === 'confirmed';
                const isReview = rec.status === 'review_required' || rec.status === 'pending_review';

                return (
                  <tr
                    key={rec.id}
                    className="hover:bg-[#B9D9E1]/20 dark:hover:bg-[#1B3541] transition-colors"
                  >
                    {/* Thumbnail & Merchant */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/5 dark:bg-black/30 shrink-0 border border-[#C4DCE3] dark:border-[#365765] flex items-center justify-center">
                          {rec.image_url && rec.mime_type !== 'application/pdf' ? (
                            <img
                              src={rec.image_url}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText size={18} className="text-[#447F98]" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#243D49] dark:text-[#D6EBF3]">
                            {rec.merchant_name || 'Scanned Receipt'}
                          </div>
                          <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF] truncate max-w-[180px]">
                            {rec.file_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-[#526C78] dark:text-[#83BDCF]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar size={12} className="text-[#447F98]" />
                        <span>{rec.receipt_date || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#B9D9E1]/30 dark:bg-[#365765]/60 text-[#243D49] dark:text-[#D6EBF3]">
                        {rec.suggested_category || 'General'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isConfirmed
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : isReview
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isConfirmed ? (
                          <CheckCircle2 size={11} />
                        ) : isReview ? (
                          <Clock size={11} />
                        ) : (
                          <AlertCircle size={11} />
                        )}
                        {isConfirmed ? 'Confirmed' : isReview ? 'Needs Review' : 'Failed'}
                      </span>
                    </td>

                    {/* Extracted Amount */}
                    <td className="px-4 py-3.5 text-right font-extrabold text-sm text-[#243D49] dark:text-[#D6EBF3]">
                      {rec.total_amount
                        ? formatCurrency(rec.total_amount, rec.currency || 'INR')
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectReceipt(rec)}
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                            isReview
                              ? 'text-[#447F98] hover:bg-[#447F98]/10'
                              : 'text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                          title={isReview ? 'Complete review' : 'View receipt details'}
                        >
                          <span>{isReview ? 'Review' : 'View'}</span>
                          <ArrowRight size={12} />
                        </button>

                        <button
                          onClick={() => onDeleteReceipt(rec.id)}
                          className="p-1.5 rounded-lg text-[#526C78] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete receipt"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

