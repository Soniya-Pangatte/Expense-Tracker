import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Receipt,
  PieChart as PieIcon,
  ScanLine,
  Landmark,
  Sparkles,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminOverview } from '../../services/adminService';

export default function AdminOverview() {
  const { session, isDemoUser, isDemoAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminOverview({ session, isDemoUser, isDemoAdmin });
      if (res && res.success) {
        setData(res);
      } else {
        throw new Error(res?.error || 'Failed to fetch overview metrics');
      }
    } catch (err) {
      console.error('Admin overview load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session, isDemoUser, isDemoAdmin]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-white/70 dark:bg-[#1B3541]/70 rounded-2xl border border-[#C4DCE3] dark:border-[#365765]" />
          ))}
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const regTrends = data?.registrationTrends || [];
  const usageTrends = data?.usageTrends || [];
  const features = data?.featureDistribution || [];

  const statCards = [
    { label: 'Total Registered Users', value: summary.totalUsers || 0, icon: Users, color: 'text-[#447F98] bg-[#D6EBF3]' },
    { label: 'Active Users (30d)', value: summary.activeUsers || 0, icon: UserCheck, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'New Registrations', value: summary.newRegistrations || 0, icon: UserPlus, color: 'text-teal-600 bg-teal-500/10' },
    { label: 'Total Transactions Logged', value: summary.totalTransactions?.toLocaleString() || 0, icon: Receipt, color: 'text-sky-600 bg-sky-500/10' },
    { label: 'Budgets Configured', value: summary.totalBudgets || 0, icon: PieIcon, color: 'text-amber-600 bg-amber-500/10' },
    { label: 'Receipt OCR Scans', value: summary.totalReceipts || 0, icon: ScanLine, color: 'text-indigo-600 bg-indigo-500/10' },
    { label: 'Bank Statement Imports', value: summary.totalBankImports || 0, icon: Landmark, color: 'text-purple-600 bg-purple-500/10' },
    { label: 'AI Advisory Interactions', value: summary.totalAIMessages?.toLocaleString() || 0, icon: Sparkles, color: 'text-pink-600 bg-pink-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1B3541] p-5 sm:p-6 rounded-3xl border border-[#C4DCE3] dark:border-[#365765] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D6EBF3] dark:bg-[#203D49] text-[#243D49] dark:text-[#83BDCF] border border-[#C4DCE3]/60 dark:border-[#365765]">
              <ShieldCheck size={14} className="text-[#447F98]" /> Platform Operations
            </span>
            <span className="text-xs text-[#526C78] dark:text-[#91ADB8]">
              Updated live
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#243D49] dark:text-[#EAF4F7] tracking-tight">
            SpendWise System Overview
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#C0D5DC]">
            High-level telemetry, aggregate activity counts, and feature distribution across all registered accounts.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#447F98] hover:bg-[#36687D] text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 8 Primary Aggregated Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs hover:border-[#83BDCF] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#243D49] dark:text-[#EAF4F7] tracking-tight">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Registration Growth Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
                User Registration Growth
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
                Monthly signups across the last 6 months
              </p>
            </div>
            <div className="p-2 rounded-xl bg-[#D6EBF3] dark:bg-[#203D49] text-[#447F98] dark:text-[#83BDCF]">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            {regTrends.map((trend, i) => {
              const maxCount = Math.max(...regTrends.map((t) => t.count), 50);
              const pct = Math.round((trend.count / maxCount) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                      {trend.period}
                    </span>
                    <span className="font-bold text-[#447F98] dark:text-[#83BDCF]">
                      +{trend.count} new users
                    </span>
                  </div>
                  <div className="w-full bg-[#EBF4F7] dark:bg-[#13252E] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#447F98] to-[#83BDCF] transition-all duration-500"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Feature Usage Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
                Feature Usage Breakdown
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
                Activity distribution across system modules
              </p>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <PieIcon size={18} />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {features.map((feat, i) => (
              <div key={i} className="p-3 rounded-2xl bg-[#F4FAFC] dark:bg-[#152B35] border border-[#C4DCE3]/60 dark:border-[#365765]/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#243D49] dark:text-[#EAF4F7]">
                    {feat.name}
                  </p>
                  <p className="text-[11px] text-[#526C78] dark:text-[#91ADB8]">
                    {feat.count?.toLocaleString()} events recorded
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-[#447F98] dark:text-[#83BDCF]">
                    {feat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Activity Heatmap Pattern */}
      <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
              Weekly Application Engagement
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
              Relative daily transaction, AI consultation, and receipt OCR volumes
            </p>
          </div>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Activity size={18} />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {usageTrends.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#F4FAFC] dark:bg-[#152B35] border border-[#C4DCE3]/60 dark:border-[#365765]/60">
              <span className="text-xs font-bold text-[#526C78] dark:text-[#83BDCF]">
                {d.day}
              </span>
              <div className="w-full bg-[#EBF4F7] dark:bg-[#13252E] h-16 rounded-lg flex items-end p-1 justify-center">
                <div
                  className="w-full bg-[#447F98] dark:bg-[#83BDCF] rounded-md transition-all"
                  style={{ height: `${Math.min(100, Math.max(15, (d.transactions / 150) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                {d.transactions} txs
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
