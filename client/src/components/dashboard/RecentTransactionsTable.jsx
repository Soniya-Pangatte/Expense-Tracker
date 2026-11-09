import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowUpRight as IncomeIcon,
  ArrowDownLeft as ExpenseIcon,
  ScanLine,
  Landmark,
  Edit3,
  Repeat,
  Layers,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { useCurrency } from '../../context/CurrencyContext';

export default function RecentTransactionsTable({ transactions = [] }) {
  const { formatCurrency } = useCurrency();

  const getSourceIcon = (source) => {
    const s = (source || 'manual').toLowerCase();
    if (s.includes('receipt')) return <ScanLine size={13} title="Receipt Scan" className="text-purple-500" />;
    if (s.includes('bank')) return <Landmark size={13} title="Bank Statement Import" className="text-blue-500" />;
    if (s.includes('recurring')) return <Repeat size={13} title="Recurring Transaction" className="text-amber-500" />;
    if (s.includes('other')) return <Layers size={13} title="Other Source" className="text-slate-400" />;
    return <Edit3 size={13} title="Manual Entry" className="text-stone-400" />;
  };

  return (
    <Card
      title="Recent Transactions"
      subtitle="Latest recorded incomes and expenses"
      action={
        <Link
          to="/transactions"
          className="text-xs font-semibold text-[#243D49] dark:text-[#83BDCF] hover:underline flex items-center gap-1"
        >
          View All <ArrowUpRight size={14} />
        </Link>
      }
    >
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-[#C4DCE3] dark:border-[#365765] text-[11px] uppercase tracking-wider text-[#758D97] dark:text-[#91ADB8]">
              <th className="px-6 py-3 font-semibold">Transaction</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-6 py-3 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C4DCE3]/60 dark:divide-[#365765]/60 text-xs">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-[#526C78] dark:text-[#C0D5DC]">
                  No transactions recorded yet.
                </td>
              </tr>
            ) : (
              transactions.slice(0, 6).map((tx) => {
                const isIncome = tx.type === 'income';

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#B9D9E1]/25 dark:hover:bg-[#1B3541] transition-colors"
                  >
                    {/* Transaction Name & Source */}
                    <td className="px-6 py-3.5 flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? <IncomeIcon size={16} /> : <ExpenseIcon size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#243D49] dark:text-[#EAF4F7] truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#526C78] dark:text-[#C0D5DC]">
                          {getSourceIcon(tx.source)}
                          <span>{tx.merchant || 'Direct'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <Badge variant="neutral">
                        {tx.categoryName || tx.category_name || 'General'}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-[#526C78] dark:text-[#C0D5DC]">
                      {new Date(tx.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3.5 text-[#526C78] dark:text-[#C0D5DC]">
                      {tx.paymentMethod || tx.payment_method || 'Credit Card'}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-3.5 text-right font-bold whitespace-nowrap">
                      <span
                        className={
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[#243D49] dark:text-[#EAF4F7]'
                        }
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount, tx.currency || 'INR')}
                      </span>
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
