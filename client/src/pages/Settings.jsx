import React, { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, User, Bell, Shield, Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isDemoUser, isConfigured } = useAuth();
  const { currency, setCurrency, currencies, savingCurrency } = useCurrency();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'SpendWise User';
  const displayEmail = profile?.email || user?.email || 'user@spendwise.io';

  const handleCurrencyChange = async (e) => {
    const newCode = e.target.value;
    await setCurrency(newCode);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
          Settings & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#83BDCF] mt-0.5">
          Configure application appearance, default currency, and connected accounts.
        </p>
      </div>

      {/* Theme & Display */}
      <Card title="Appearance" subtitle="Customize the visual theme">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B9D9E1]/20 text-[#243D49] dark:text-[#83BDCF]">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                Theme Mode
              </p>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                Currently set to {theme === 'dark' ? 'Dark' : 'Light'} mode
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            Toggle to {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </div>
      </Card>

      {/* Currency & Locale */}
      <Card title="Regional & Currency" subtitle="Default formatting and exchange-rate conversion">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#526C78] dark:text-[#83BDCF]">
                Default Currency *
              </label>
              {savingCurrency ? (
                <span className="text-[11px] text-[#447F98] flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin" /> Saving...
                </span>
              ) : saveSuccess ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Saved
                </span>
              ) : null}
            </div>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              className="w-full px-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98] font-medium"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) – {c.name} {c.code === 'INR' ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF] mt-1.5">
              Live multi-currency exchange conversion applied across all reports and balances.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#526C78] dark:text-[#83BDCF] mb-1.5">
              Date Format
            </label>
            <select
              defaultValue="MMM DD, YYYY"
              className="w-full px-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
            >
              <option value="MMM DD, YYYY">MMM DD, YYYY (e.g. Nov 07, 2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-07)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 07/11/2026)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Profile & Supabase Backend Status */}
      <Card title="Profile & Authentication" subtitle="User credentials & Supabase backend link">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#C4DCE3] dark:border-[#365765]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#B9D9E1]/20 text-[#243D49] dark:text-[#83BDCF] flex items-center justify-center font-bold text-sm">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                  {displayName}
                </p>
                <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
                  {displayEmail}
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isDemoUser
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isDemoUser ? 'Demo Account' : 'Supabase Authenticated'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1.5">
                <Database size={14} /> Backend Provider
              </span>
              <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                Supabase PostgreSQL
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#526C78] dark:text-[#83BDCF]">Configuration Status</span>
              <span className="flex items-center gap-1 font-semibold">
                {isConfigured ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Active & Connected
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle size={13} /> Using Local Demo / Pending .env
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#C4DCE3]/60 dark:border-[#365765]/60">
              <span className="text-[#526C78] dark:text-[#83BDCF]">User UUID</span>
              <span className="font-mono text-[11px] text-[#243D49] dark:text-[#D6EBF3]">
                {user?.id || 'demo-user-id-001'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
