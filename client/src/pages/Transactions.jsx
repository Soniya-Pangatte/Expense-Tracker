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
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function Transactions() {
  const navigate = useNavigate();
  const { transactions, categories, deleteTransaction } = useTransactions();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()));
      const txCatId = tx.categoryId || tx.category_id;
      const txCatName = tx.categoryName || tx.category_name;
      const selectedCatObj = categories.find((c) => c.id === selectedCategory);

      const matchesCategory =
        selectedCategory === 'all' ||
        txCatId === selectedCategory ||
        txCatName === selectedCategory ||
        (selectedCatObj && txCatName === selectedCatObj.name);

      const matchesType = selectedType === 'all' || tx.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, searchTerm, selectedCategory, selectedType, categories]);

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
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/40 px-2 py-0.5 rounded-md">
            <Edit3 size={12} /> Manual
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Transaction History
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Unified ledger for manual entries, receipt scans, and bank imports.
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
            onClick={() => navigate('/add-expense')}
            icon={Plus}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#83BDCF]" size={16} />
            <input
              type="text"
              placeholder="Search by merchant, note, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs sm:text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl px-3 py-2 text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs sm:text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl px-3 py-2 text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#C4DCE3] dark:border-[#365765] bg-[#B9D9E1]/30 dark:bg-[#1B3541]/60 text-[11px] uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
                <th className="px-6 py-3 font-semibold">Transaction / Merchant</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Origin</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C4DCE3]/60 dark:divide-[#365765]/60 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[#526C78] dark:text-[#83BDCF]">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#B9D9E1]/25 dark:hover:bg-[#1B3541] transition-colors"
                    >
                      {/* Name & Merchant */}
                      <td className="px-6 py-4 flex items-center gap-3">
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
                            {tx.merchant}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <Badge variant="neutral">{tx.categoryName || tx.category_name || 'General'}</Badge>
                      </td>

                      {/* Method */}
                      <td className="px-4 py-4 text-[#526C78] dark:text-[#83BDCF]">
                        {tx.paymentMethod || tx.payment_method || 'Credit Card'}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-4">
                        {getSourceBadge(tx.source)}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-[#526C78] dark:text-[#83BDCF]">
                        {new Date(tx.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right font-bold whitespace-nowrap">
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
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={async () => {
                              try {
                                await deleteTransaction(tx.id);
                              } catch (err) {
                                alert(err.message || 'Failed to delete transaction.');
                              }
                            }}
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
      </Card>
    </div>
  );
}
