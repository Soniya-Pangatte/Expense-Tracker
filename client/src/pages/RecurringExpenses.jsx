import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  Edit2,
  Trash2,
  CreditCard,
  AlertCircle,
  ArrowRightCircle,
  Check,
  FileCheck2,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import RecurringExpenseModal from '../components/dashboard/RecurringExpenseModal';
import DeleteBudgetLimitModal from '../components/dashboard/DeleteBudgetLimitModal';

export default function RecurringExpenses() {
  const {
    recurringExpenses,
    toggleRecurringExpenseStatus,
    deleteRecurringExpense,
    addTransaction,
    categories,
  } = useTransactions();
  const { currency, convertAmount, formatRawCurrency, formatCurrency } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [deletingRecurring, setDeletingRecurring] = useState(null);
  const [recordingId, setRecordingId] = useState(null);
  const [recordSuccessMsg, setRecordSuccessMsg] = useState('');

  // Calculate metrics
  const activeBills = recurringExpenses.filter((r) => r.status === 'Active');
  const pausedBills = recurringExpenses.filter((r) => r.status === 'Paused');

  const totalMonthlyCommitment = recurringExpenses.reduce(
    (acc, curr) => acc + convertAmount(Number(curr.amount) || 0, curr.currency || 'INR', currency),
    0
  );

  const activeMonthlyCommitment = activeBills.reduce(
    (acc, curr) => acc + convertAmount(Number(curr.amount) || 0, curr.currency || 'INR', currency),
    0
  );

  // Helper: compute days until due schedule
  const getDueDetails = (dueDateStr) => {
    if (!dueDateStr) return { label: 'Scheduled', badgeColor: 'neutral', days: null };

    // Check if it's an explicit date YYYY-MM-DD
    const dateMatch = dueDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const targetDate = new Date(dueDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, badgeColor: 'danger', days: diffDays };
      if (diffDays === 0) return { label: 'Due today', badgeColor: 'warning', days: 0 };
      if (diffDays === 1) return { label: 'Due tomorrow', badgeColor: 'warning', days: 1 };
      return { label: `Due in ${diffDays}d`, badgeColor: diffDays <= 5 ? 'warning' : 'primary', days: diffDays };
    }

    // Check if it's ordinal like "1st of month", "15th of month"
    const ordinalMatch = dueDateStr.match(/(\d+)(?:st|nd|rd|th)?/i);
    if (ordinalMatch) {
      const dayOfMonth = parseInt(ordinalMatch[1], 10);
      const today = new Date();
      const currentDay = today.getDate();
      let diff = dayOfMonth - currentDay;
      if (diff < 0) {
        // Due next month
        const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        diff = daysInCurrentMonth - currentDay + dayOfMonth;
      }
      if (diff === 0) return { label: 'Due today', badgeColor: 'warning', days: 0 };
      if (diff === 1) return { label: 'Due tomorrow', badgeColor: 'warning', days: 1 };
      return { label: `Due in ${diff}d`, badgeColor: diff <= 5 ? 'warning' : 'primary', days: diff };
    }

    return { label: dueDateStr, badgeColor: 'neutral', days: null };
  };

  // Quick Action: record recurring bill directly into transaction ledger
  const handleRecordTransaction = async (rec) => {
    setRecordingId(rec.id);
    setRecordSuccessMsg('');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const matchedCat = categories.find((c) => c.name?.toLowerCase() === rec.category?.toLowerCase());

      await addTransaction({
        description: `${rec.name} (Subscription)`,
        amount: Number(rec.amount),
        currency: rec.currency || currency,
        type: 'expense',
        categoryId: matchedCat?.id || null,
        categoryName: rec.category || 'General',
        paymentMethod: rec.paymentMethod || 'UPI',
        date: todayStr,
        source: 'recurring',
        notes: `Auto-recorded recurring payment for ${rec.frequency} schedule. ${rec.notes || ''}`.trim(),
      });

      setRecordSuccessMsg(`Recorded "${rec.name}" to your transaction ledger!`);
      setTimeout(() => setRecordSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to record recurring transaction:', err);
    } finally {
      setRecordingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Recurring Expenses & Subscriptions
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
            Keep track of fixed commitments, bill schedules, and upcoming renewal dates.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setEditingRecurring(null);
            setIsModalOpen(true);
          }}
        >
          Add Recurring Bill
        </Button>
      </div>

      {/* Success Banner */}
      {recordSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{recordSuccessMsg}</span>
          </div>
          <button
            onClick={() => setRecordSuccessMsg('')}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-5">
          <p className="text-xs uppercase font-semibold text-[#526C78] dark:text-[#83BDCF]">
            Active Fixed Commitments
          </p>
          <p className="text-2xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] mt-2">
            {formatRawCurrency(activeMonthlyCommitment)}
            <span className="text-xs font-normal text-[#526C78] dark:text-[#83BDCF]"> / month</span>
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
            Across {activeBills.length} active scheduled subscriptions
          </p>
        </Card>

        <Card className="!p-5">
          <p className="text-xs uppercase font-semibold text-[#526C78] dark:text-[#83BDCF]">
            Schedule Status
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {activeBills.length}
              </span>
              <span className="text-xs text-[#526C78] dark:text-[#83BDCF] ml-1 font-medium">Active</span>
            </div>
            <span className="text-[#C4DCE3] dark:text-[#365765]">•</span>
            <div>
              <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {pausedBills.length}
              </span>
              <span className="text-xs text-[#526C78] dark:text-[#83BDCF] ml-1 font-medium">Paused</span>
            </div>
          </div>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
            Total of {recurringExpenses.length} tracked commitments
          </p>
        </Card>

        <Card className="!p-5">
          <p className="text-xs uppercase font-semibold text-[#526C78] dark:text-[#83BDCF]">
            Next Upcoming Due
          </p>
          <p className="text-base font-extrabold text-[#447F98] dark:text-[#83BDCF] mt-2 truncate">
            {activeBills[0] ? `${activeBills[0].name} (${activeBills[0].dueDate})` : 'No upcoming bills'}
          </p>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1">
            {activeBills[0]
              ? `Amount: ${formatCurrency(activeBills[0].amount, activeBills[0].currency || 'INR')}`
              : 'Add bills to track upcoming schedules'}
          </p>
        </Card>
      </div>

      {/* Upcoming Payments Schedule Highlights */}
      {activeBills.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
            Upcoming Payment Schedule
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeBills.slice(0, 3).map((rec) => {
              const dueInfo = getDueDetails(rec.dueDate);
              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#243D49] dark:text-[#D6EBF3] truncate max-w-[150px]">
                      {rec.name}
                    </p>
                    <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1">
                      <Calendar size={11} />
                      <span>{rec.dueDate}</span>
                    </p>
                    <span
                      className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        dueInfo.badgeColor === 'danger'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : dueInfo.badgeColor === 'warning'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-[#B9D9E1]/30 text-[#447F98] dark:text-[#83BDCF]'
                      }`}
                    >
                      {dueInfo.label}
                    </span>
                  </div>

                  <div className="text-right space-y-1.5">
                    <p className="text-sm font-extrabold text-[#243D49] dark:text-[#D6EBF3]">
                      {formatCurrency(rec.amount, rec.currency || 'INR')}
                    </p>
                    <button
                      onClick={() => handleRecordTransaction(rec)}
                      disabled={recordingId === rec.id}
                      className="text-[11px] font-semibold text-[#447F98] dark:text-[#83BDCF] hover:underline flex items-center gap-1 ml-auto"
                      title="Add to transaction ledger now"
                    >
                      <FileCheck2 size={12} />
                      <span>{recordingId === rec.id ? 'Recording...' : 'Record Now'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Recurring List Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#C4DCE3] dark:border-[#365765] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
              All Scheduled Commitments
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
              Manage schedule frequencies, payment channels, and active/paused state.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#526C78] dark:text-[#83BDCF]">
            {recurringExpenses.length} recurring {recurringExpenses.length === 1 ? 'bill' : 'bills'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#C4DCE3] dark:border-[#365765] bg-[#B9D9E1]/20 dark:bg-[#1B3541]/60 text-[11px] uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
                <th className="px-6 py-3.5 font-semibold">Expense Name</th>
                <th className="px-4 py-3.5 font-semibold">Category</th>
                <th className="px-4 py-3.5 font-semibold">Frequency</th>
                <th className="px-4 py-3.5 font-semibold">Due Schedule</th>
                <th className="px-4 py-3.5 font-semibold">Payment Method</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Amount</th>
                <th className="px-6 py-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C4DCE3]/60 dark:divide-[#365765]/60 text-xs">
              {recurringExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-[#526C78] dark:text-[#83BDCF]">
                    <Repeat size={32} className="mx-auto mb-2 opacity-50 text-[#447F98]" />
                    <p className="font-semibold text-sm text-[#243D49] dark:text-[#D6EBF3]">
                      No recurring expenses configured.
                    </p>
                    <p className="text-xs mt-1">
                      Add your subscriptions, utility bills, or rent to track scheduled commitments.
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Plus}
                        onClick={() => {
                          setEditingRecurring(null);
                          setIsModalOpen(true);
                        }}
                      >
                        Add First Recurring Bill
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                recurringExpenses.map((rec) => {
                  const isActive = rec.status === 'Active';
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-[#B9D9E1]/20 dark:hover:bg-[#1B3541] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-[#243D49] dark:text-[#D6EBF3]">
                          {rec.name}
                        </div>
                        {rec.notes && (
                          <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF] truncate max-w-xs mt-0.5">
                            {rec.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#B9D9E1]/30 dark:bg-[#365765]/60 text-[#243D49] dark:text-[#D6EBF3]">
                          {rec.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#526C78] dark:text-[#83BDCF] font-medium">
                        {rec.frequency}
                      </td>
                      <td className="px-4 py-4 text-[#526C78] dark:text-[#83BDCF]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar size={13} className="text-[#447F98]" />
                          <span>{rec.dueDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#526C78] dark:text-[#83BDCF]">
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={12} className="opacity-70" />
                          <span>{rec.paymentMethod || 'UPI'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isActive ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-[#243D49] dark:text-[#D6EBF3]">
                        {formatCurrency(rec.amount, rec.currency || 'INR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Pause / Resume Button */}
                          <button
                            onClick={() => toggleRecurringExpenseStatus(rec.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-amber-600 hover:bg-amber-500/10'
                                : 'text-emerald-600 hover:bg-emerald-500/10'
                            }`}
                            title={isActive ? 'Pause recurring bill' : 'Resume recurring bill'}
                          >
                            {isActive ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                          </button>

                          {/* Quick Record Button */}
                          <button
                            onClick={() => handleRecordTransaction(rec)}
                            disabled={recordingId === rec.id}
                            className="p-1.5 rounded-lg text-[#447F98] hover:bg-[#447F98]/10 transition-colors"
                            title="Record to transaction ledger now"
                          >
                            <FileCheck2 size={15} />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditingRecurring(rec);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            title="Edit bill"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeletingRecurring(rec)}
                            className="p-1.5 rounded-lg text-[#526C78] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete bill"
                          >
                            <Trash2 size={14} />
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

      {/* Add / Edit Recurring Expense Modal */}
      <RecurringExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecurring(null);
        }}
        recurring={editingRecurring}
      />

      {/* Delete Confirmation Modal */}
      <DeleteBudgetLimitModal
        isOpen={Boolean(deletingRecurring)}
        onClose={() => setDeletingRecurring(null)}
        title="Delete Recurring Bill"
        message="Are you sure you want to permanently delete this recurring commitment? Any previously recorded ledger transactions will not be affected."
        itemName={deletingRecurring ? `${deletingRecurring.name} (${formatCurrency(deletingRecurring.amount, deletingRecurring.currency || 'INR')})` : ''}
        onConfirm={async () => {
          if (deletingRecurring) {
            await deleteRecurringExpense(deletingRecurring.id);
          }
        }}
      />
    </div>
  );
}
