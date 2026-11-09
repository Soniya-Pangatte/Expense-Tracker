import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  ScanLine,
  Landmark,
  PieChart,
  Repeat,
  BarChart3,
  Settings,
  Wallet,
  X,
  LogOut,
  ChevronRight,
  Edit2,
  Plus,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { useCurrency } from '../../context/CurrencyContext';
import BudgetModal from '../dashboard/BudgetModal';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'AI' },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Add Expense', path: '/add-expense', icon: PlusCircle },
  { name: 'Scan Receipt', path: '/scan-receipt', icon: ScanLine },
  { name: 'Bank Imports', path: '/bank-imports', icon: Landmark },
  { name: 'Budgets', path: '/budgets', icon: PieChart },
  { name: 'Recurring Expenses', path: '/recurring-expenses', icon: Repeat },
  { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout, isDemoUser } = useAuth();
  const { stats } = useTransactions();
  const { formatCurrency } = useCurrency();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Determine user display information
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = profile?.email || user?.email || 'user@spendwise.io';

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'SW';
  };

  const initials = getInitials(displayName, displayEmail);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#E8F3F7] dark:bg-[#1A333F] border-r border-[#C4DCE3] dark:border-[#365765] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#C4DCE3] dark:border-[#365765]">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#447F98] dark:bg-[#83BDCF] flex items-center justify-center text-[#FFFFFF] dark:text-[#152B35] shadow-sm transition-transform group-hover:scale-105">
              <Wallet size={20} strokeWidth={2.4} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#243D49] dark:text-[#EAF4F7]">
                Spend<span className="text-[#447F98] dark:text-[#83BDCF]">Wise</span>
              </span>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-[#526C78] dark:text-[#91ADB8] -mt-1">
                Personal Finance
              </p>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#526C78] hover:text-[#243D49] dark:hover:text-[#EAF4F7] hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#758D97] dark:text-[#91ADB8] px-3 mb-2">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#447F98] dark:bg-[#83BDCF] text-[#FFFFFF] dark:text-[#152B35] shadow-sm font-semibold'
                    : 'text-[#526C78] dark:text-[#C0D5DC] hover:text-[#243D49] dark:hover:text-[#EAF4F7] hover:bg-[#B9D9E1]/30 dark:hover:bg-[#284956]/40'
                }`}
              >
                <Icon
                  size={19}
                  className={`transition-colors ${
                    isActive
                      ? 'text-[#FFFFFF] dark:text-[#152B35]'
                      : 'text-[#526C78] dark:text-[#C0D5DC] group-hover:text-[#243D49] dark:group-hover:text-[#EAF4F7]'
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-[#203D49] text-white'
                      : 'bg-[#B9D9E1]/50 text-[#243D49] dark:text-[#EAF4F7] border border-[#C4DCE3] dark:border-[#365765]'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={15} className="opacity-80" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Dynamic Monthly Budget Progress Card */}
        <div className="px-4 py-3 mx-4 mb-3 rounded-xl bg-[#FFFFFF]/80 dark:bg-[#203D49]/80 border border-[#C4DCE3] dark:border-[#365765]">
          {stats?.hasMonthlyBudget ? (
            <>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#243D49] dark:text-[#D6EBF3]">Monthly Budget</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-semibold ${
                      stats.isOverBudget
                        ? 'text-rose-500'
                        : stats.budgetUtilization > 90
                        ? 'text-amber-500'
                        : 'text-[#447F98]'
                    }`}
                  >
                    {stats.budgetUtilization}% used
                  </span>
                  <button
                    onClick={() => setIsBudgetModalOpen(true)}
                    title="Edit Monthly Budget"
                    className="text-[#526C78] hover:text-[#243D49] dark:hover:text-[#D6EBF3] p-0.5 rounded transition-colors"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              </div>
              <div className="w-full bg-[#B9D9E1] dark:bg-[#365765] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.isOverBudget
                      ? 'bg-rose-500'
                      : stats.budgetUtilization > 90
                      ? 'bg-amber-500'
                      : 'bg-[#447F98]'
                  }`}
                  style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF] mt-1.5 truncate">
                {stats.isOverBudget ? (
                  <span className="text-rose-500 font-medium">
                    Over by {formatCurrency(stats.currentMonthExpenses - stats.monthlyBudget)}
                  </span>
                ) : (
                  <>
                    {formatCurrency(stats.remainingBudget)} left of {formatCurrency(stats.monthlyBudget)}
                  </>
                )}
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#243D49] dark:text-[#D6EBF3]">Monthly Budget</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#B9D9E1] text-[#243D49] dark:bg-[#365765] dark:text-[#83BDCF]">
                  Not set
                </span>
              </div>
              <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">
                Spent this month: <strong className="text-[#243D49] dark:text-[#D6EBF3]">{formatCurrency(stats.currentMonthExpenses)}</strong>
              </p>
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="w-full py-1.5 px-2 text-xs font-semibold rounded-lg bg-[#B9D9E1]/40 hover:bg-[#B9D9E1]/70 text-[#243D49] dark:text-[#EAF4F7] transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={13} /> Set Monthly Budget
              </button>
            </div>
          )}
        </div>

        {/* Authenticated User Profile Footer */}
        <div className="p-3 border-t border-[#C4DCE3] dark:border-[#365765] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#B9D9E1]/50 dark:bg-[#345968]/50 text-[#243D49] dark:text-[#83BDCF] flex items-center justify-center font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-[#243D49] dark:text-[#EAF4F7] truncate">
                  {displayName}
                </p>
                {isDemoUser && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#B9D9E1] text-[#243D49] dark:bg-[#365765] dark:text-[#83BDCF]">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-xs text-[#526C78] dark:text-[#C0D5DC] truncate">
                {displayEmail}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out of SpendWise"
            className="p-2 text-[#526C78] hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* Reusable Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />
    </>
  );
}
