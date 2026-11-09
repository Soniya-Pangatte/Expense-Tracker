import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ScanLine,
  Landmark,
  Edit3,
  Trash2,
  Calendar,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import TransactionDetailsModal from '../components/transactions/TransactionDetailsModal';
import DeleteConfirmModal from '../components/transactions/DeleteConfirmModal';

const ITEMS_PER_PAGE = 10;

export default function Transactions() {
  const navigate = useNavigate();
  const { transactions, categories, deleteTransaction } = useTransactions();
  const { formatCurrency } = useCurrency();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc, amount-asc
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [detailsTransaction, setDetailsTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast('');
    }, 3000);
  };

  // Reset all filters & search
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    sortBy !== 'date-desc';

  // 1. Filter Transactions
  const filteredAndSortedTransactions = useMemo(() => {
    const list = transactions.filter((tx) => {
      // Search matching description, merchant, or notes
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (tx.description && tx.description.toLowerCase().includes(term)) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(term)) ||
        (tx.notes && tx.notes.toLowerCase().includes(term));

      // Category filter (match categoryId or categoryName)
      const txCatId = tx.categoryId || tx.category_id;
      const txCatName = tx.categoryName || tx.category_name;
      const selectedCatObj = categories.find((c) => c.id === selectedCategory);

      const matchesCategory =
        selectedCategory === 'all' ||
        txCatId === selectedCategory ||
        txCatName === selectedCategory ||
        (selectedCatObj && txCatName === selectedCatObj.name);

      // Type filter
      const matchesType = selectedType === 'all' || tx.type === selectedType;

      // Date range filter
      let matchesDate = true;
      if (startDate && tx.date) {
        matchesDate = matchesDate && tx.date >= startDate;
      }
      if (endDate && tx.date) {
        matchesDate = matchesDate && tx.date <= endDate;
      }

      return matchesSearch && matchesCategory && matchesType && matchesDate;
    });

    // 2. Sort Transactions
    list.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      const amtA = Number(a.amount) || 0;
      const amtB = Number(b.amount) || 0;

      switch (sortBy) {
        case 'date-asc':
          return dateA - dateB;
        case 'amount-desc':
          return amtB - amtA;
        case 'amount-asc':
          return amtA - amtB;
        case 'date-desc':
        default:
          return dateB - dateA;
      }
    });

    return list;
  }, [
    transactions,
    searchTerm,
    selectedCategory,
    selectedType,
    startDate,
    endDate,
    sortBy,
    categories,
  ]);

  // 3. Pagination calculations
  const totalItems = filteredAndSortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedTransactions, safeCurrentPage]);

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems);

  const getSourceBadge = (source) => {
    switch (source) {
      case 'receipt':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
            <ScanLine size={12} /> Receipt OCR
          </span>
        );
      case 'bank':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
            <Landmark size={12} /> Bank Import
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#526C78] dark:text-[#83BDCF] bg-[#D6EBF3]/40 dark:bg-[#1B3541] px-2 py-0.5 rounded-md">
            <Edit3 size={12} /> Manual
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl animate-in slide-in-from-top-3 duration-200 text-sm font-semibold">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Transaction Ledger
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Complete transaction record, filtering, searching, and audit history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/scan-receipt')}
            icon={ScanLine}
          >
            Scan Receipt
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingTransaction(null);
              setIsFormModalOpen(true);
            }}
            icon={Plus}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="!p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#83BDCF]" size={16} />
            <input
              type="text"
              placeholder="Search by title, merchant, or notes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-9 py-2 text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#758D97] hover:text-[#243D49] dark:hover:text-[#D6EBF3]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs sm:text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl px-3 py-2 text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs sm:text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl px-3 py-2 text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs sm:text-sm bg-[#D6EBF3]/40 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl px-3 py-2 text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Date Range & Reset Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#C4DCE3]/50 dark:border-[#365765]/50 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#526C78] dark:text-[#83BDCF] font-medium flex items-center gap-1">
              <Calendar size={13} /> Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs bg-[#D6EBF3]/30 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-lg text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-1 focus:ring-[#447F98]"
              title="Start Date"
            />
            <span className="text-[#758D97]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs bg-[#D6EBF3]/30 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-lg text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-1 focus:ring-[#447F98]"
              title="End Date"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[#447F98] dark:text-[#83BDCF] hover:underline font-semibold cursor-pointer"
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#C4DCE3] dark:border-[#365765] bg-[#B9D9E1]/30 dark:bg-[#1B3541]/60 text-[11px] uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
                <th className="px-6 py-3.5 font-semibold">Transaction / Payee</th>
                <th className="px-4 py-3.5 font-semibold">Category</th>
                <th className="px-4 py-3.5 font-semibold">Method</th>
                <th className="px-4 py-3.5 font-semibold">Source</th>
                <th className="px-4 py-3.5 font-semibold">Date</th>
                <th className="px-6 py-3.5 font-semibold text-right">Amount</th>
                <th className="px-4 py-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C4DCE3]/60 dark:divide-[#365765]/60 text-xs">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-14 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-sm font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                        No matching transactions found
                      </p>
                      <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                        {hasActiveFilters
                          ? 'Try clearing your search query or broadening your date/category filters.'
                          : 'Your ledger is currently empty. Record your first transaction to start tracking.'}
                      </p>
                      {hasActiveFilters ? (
                        <div className="pt-2">
                          <Button variant="outline" size="sm" onClick={handleResetFilters}>
                            Clear Filters
                          </Button>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Plus}
                            onClick={() => {
                              setEditingTransaction(null);
                              setIsFormModalOpen(true);
                            }}
                          >
                            Add First Transaction
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#B9D9E1]/20 dark:hover:bg-[#1B3541]/50 transition-colors cursor-pointer group"
                      onClick={() => setDetailsTransaction(tx)}
                    >
                      {/* Name & Merchant */}
                      <td className="px-6 py-3.5 flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isIncome ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
                        </div>
                        <div>
                          <p className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                            {tx.description}
                          </p>
                          <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">
                            {tx.merchant || tx.description}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <Badge variant="neutral">{tx.categoryName || tx.category_name || 'General'}</Badge>
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3.5 text-[#526C78] dark:text-[#83BDCF]">
                        {tx.paymentMethod || tx.payment_method || 'Credit Card'}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5">
                        {getSourceBadge(tx.source)}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-[#526C78] dark:text-[#83BDCF]">
                        {new Date(tx.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-3.5 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[#243D49] dark:text-[#D6EBF3]'
                          }
                        >
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount, tx.currency || 'INR')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-4 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()} // Prevent row click opening details
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* View Details */}
                          <button
                            onClick={() => setDetailsTransaction(tx)}
                            className="p-1.5 text-[#526C78] hover:text-[#447F98] dark:hover:text-[#83BDCF] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            title="View transaction details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit Transaction */}
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 text-[#526C78] hover:text-[#447F98] dark:hover:text-[#83BDCF] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            title="Edit transaction"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete Transaction */}
                          <button
                            onClick={() => setDeletingTransaction(tx)}
                            className="p-1.5 text-[#526C78] hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            title="Delete transaction"
                          >
                            <Trash2 size={15} />
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

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="px-6 py-3.5 border-t border-[#C4DCE3] dark:border-[#365765] bg-[#D6EBF3]/20 dark:bg-[#1B3541]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526C78] dark:text-[#83BDCF]">
            <span>
              Showing <strong className="text-[#243D49] dark:text-[#D6EBF3]">{startIndex}</strong> to{' '}
              <strong className="text-[#243D49] dark:text-[#D6EBF3]">{endIndex}</strong> of{' '}
              <strong className="text-[#243D49] dark:text-[#D6EBF3]">{totalItems}</strong> transactions
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                icon={ChevronLeft}
              >
                Previous
              </Button>
              <span className="px-2.5 py-1 font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                {safeCurrentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                icon={ChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 1. Transaction Form Modal (Create & Edit) */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        transaction={editingTransaction}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={(msg) => triggerToast(msg)}
      />

      {/* 2. Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={Boolean(detailsTransaction)}
        transaction={detailsTransaction}
        onClose={() => setDetailsTransaction(null)}
        onEdit={(tx) => {
          setDetailsTransaction(null);
          setEditingTransaction(tx);
          setIsFormModalOpen(true);
        }}
        onDelete={(tx) => {
          setDetailsTransaction(null);
          setDeletingTransaction(tx);
        }}
      />

      {/* 3. Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTransaction)}
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={async (id) => {
          await deleteTransaction(id);
          triggerToast('Transaction deleted successfully.');
        }}
      />
    </div>
  );
}
