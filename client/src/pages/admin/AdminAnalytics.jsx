import React, { useState, useEffect } from 'react';
import {
  LineChart,
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  Receipt,
  ScanLine,
  Landmark,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminAnalytics } from '../../services/adminService';

export default function AdminAnalytics() {
  const { session, isDemoUser, isDemoAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminAnalytics({ session, isDemoUser, isDemoAdmin });
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Admin analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [session, isDemoUser, isDemoAdmin]);

  const handleExportCSV = () => {
    if (!data?.monthlyActivity) return;

    const headers = ['Month', 'Transactions', 'Receipts', 'Bank Imports', 'AI Queries', 'Active Users'];
    const rows = data.monthlyActivity.map((m) => [
      m.month,
      m.transactions,
      m.receipts,
      m.bankImports,
      m.aiQueries,
      m.activeUsers,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SpendWise_Application_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-white/70 dark:bg-[#1B3541]/70 rounded-3xl border border-[#C4DCE3] dark:border-[#365765]" />
          ))}
        </div>
      </div>
    );
  }

  const monthly = data?.monthlyActivity || [];
  const hourly = data?.hourlyUsagePattern || [];
  const adoption = data?.featureAdoptionRates || [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1B3541] p-5 sm:p-6 rounded-3xl border border-[#C4DCE3] dark:border-[#365765] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D6EBF3] dark:bg-[#203D49] text-[#243D49] dark:text-[#83BDCF] border border-[#C4DCE3]/60 dark:border-[#365765]">
              <LineChart size={14} className="text-[#447F98]" /> Platform Telemetry
            </span>
            <span className="text-xs text-[#526C78] dark:text-[#91ADB8]">
              Aggregated Metrics
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#243D49] dark:text-[#EAF4F7] tracking-tight">
            Application Analytics & Volume Trends
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#C0D5DC]">
            Time-series telemetry tracking transaction throughput, OCR conversions, bank import batches, and AI interactions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadAnalytics}
            className="p-2 rounded-xl border border-[#C4DCE3] dark:border-[#365765] text-[#526C78] hover:text-[#243D49] dark:text-[#C0D5DC] dark:hover:text-[#EAF4F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-[#447F98] hover:bg-[#36687D] text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Monthly Feature Volume Telemetry Table */}
      <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
              Monthly Volume & Engagement Throughput
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
              Aggregate action counts recorded across recent months
            </p>
          </div>
          <div className="p-2 rounded-xl bg-[#D6EBF3] dark:bg-[#203D49] text-[#447F98] dark:text-[#83BDCF]">
            <Calendar size={18} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#EBF4F7] dark:bg-[#18303C] border-b border-[#C4DCE3] dark:border-[#365765] text-[#526C78] dark:text-[#83BDCF] uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Transactions</th>
                <th className="px-4 py-3">Receipt OCR</th>
                <th className="px-4 py-3">Bank Imports</th>
                <th className="px-4 py-3">AI Advisory</th>
                <th className="px-4 py-3">Active Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C4DCE3]/60 dark:divide-[#365765]/60 font-medium">
              {monthly.map((m, i) => (
                <tr key={i} className="hover:bg-[#F4FAFC] dark:hover:bg-[#152B35]/60">
                  <td className="px-4 py-3.5 font-bold text-[#243D49] dark:text-[#EAF4F7]">{m.month}</td>
                  <td className="px-4 py-3.5 text-sky-600 dark:text-sky-400 font-bold">{m.transactions}</td>
                  <td className="px-4 py-3.5 text-indigo-600 dark:text-indigo-400 font-bold">{m.receipts}</td>
                  <td className="px-4 py-3.5 text-purple-600 dark:text-purple-400 font-bold">{m.bankImports}</td>
                  <td className="px-4 py-3.5 text-pink-600 dark:text-pink-400 font-bold">{m.aiQueries}</td>
                  <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{m.activeUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Hourly Distribution & Feature Adoption */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Distribution (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
              Peak Hourly Traffic Distribution
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
              Daily request concentrations across 24-hour cycles
            </p>
          </div>

          <div className="flex items-end gap-2 h-40 pt-6">
            {hourly.map((h, idx) => {
              const maxVal = Math.max(...hourly.map((x) => x.count), 60);
              const pct = (h.count / maxVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-[#EBF4F7] dark:bg-[#13252E] rounded-md h-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-[#447F98] to-[#83BDCF] rounded-md transition-all"
                      style={{ height: `${Math.max(pct, 10)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[#526C78] dark:text-[#91ADB8]">
                    {h.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Adoption Rates (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
              Platform Feature Adoption
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
              Percentage of registered users actively utilizing key capabilities
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {adoption.map((feat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#243D49] dark:text-[#EAF4F7]">{feat.feature}</span>
                  <span className="font-bold text-[#447F98] dark:text-[#83BDCF]">{feat.rate}%</span>
                </div>
                <div className="w-full bg-[#EBF4F7] dark:bg-[#13252E] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#447F98] dark:bg-[#83BDCF] transition-all"
                    style={{ width: `${feat.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
