import React from 'react';
import { Repeat, Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function RecurringExpenses() {
  const { recurringExpenses } = useTransactions();
  const { currency, convertAmount, formatRawCurrency, formatCurrency } = useCurrency();

  const totalMonthlyCommitment = recurringExpenses.reduce(
    (acc, curr) => acc + convertAmount(Number(curr.amount) || 0, curr.currency || 'INR', currency),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Recurring Expenses & Subscriptions
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Keep track of fixed commitments, bill schedules, and upcoming renewal dates.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus}>
          Add Recurring Bill
        </Button>
      </div>

      {/* Summary Box */}
      <div className="p-5 rounded-2xl bg-[#B9D9E1]/15 dark:bg-[#B9D9E1]/10 border border-[#C4DCE3]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#447F98]">
            Total Fixed Commitments
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] mt-1">
            {formatRawCurrency(totalMonthlyCommitment)}
            <span className="text-xs font-normal text-[#526C78] dark:text-[#83BDCF]"> / month</span>
          </p>
        </div>
        <p className="text-xs text-[#526C78] dark:text-[#83BDCF] max-w-xs">
          Automatic reminders notify you 3 days prior to scheduled due dates.
        </p>
      </div>

      {/* Recurring List */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[#C4DCE3] dark:border-[#365765] bg-[#B9D9E1]/30 dark:bg-[#1B3541]/60 text-[11px] uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
                <th className="px-6 py-3 font-semibold">Expense Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Frequency</th>
                <th className="px-4 py-3 font-semibold">Due Schedule</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C4DCE3]/60 dark:divide-[#365765]/60 text-xs">
              {recurringExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[#526C78] dark:text-[#83BDCF]">
                    No recurring expenses configured.
                  </td>
                </tr>
              ) : (
                recurringExpenses.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-[#B9D9E1]/25 dark:hover:bg-[#1B3541] transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                      {rec.name}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="neutral">{rec.category}</Badge>
                    </td>
                    <td className="px-4 py-4 text-[#526C78] dark:text-[#83BDCF]">
                      {rec.frequency}
                    </td>
                    <td className="px-4 py-4 text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{rec.dueDate}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          rec.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {rec.status === 'Active' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#243D49] dark:text-[#D6EBF3]">
                      {formatCurrency(rec.amount, rec.currency || 'INR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
