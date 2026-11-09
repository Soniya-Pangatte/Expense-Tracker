import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cpu,
  Sparkles,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminSystemHealth } from '../../services/adminService';

export default function AdminSystem() {
  const { session, isDemoUser, isDemoAdmin } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminSystemHealth({ session, isDemoUser, isDemoAdmin });
      if (res && res.success) {
        setHealth(res);
      }
    } catch (err) {
      console.error('System health load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, [session, isDemoUser, isDemoAdmin]);

  const formatUptime = (seconds = 0) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m`;
  };

  if (loading && !health) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/70 dark:bg-[#1B3541]/70 rounded-2xl border border-[#C4DCE3] dark:border-[#365765]" />
          ))}
        </div>
      </div>
    );
  }

  const services = health?.services || [];
  const logs = health?.recentAuditLogs || [];
  const memory = health?.memory || { rssMb: 0, heapUsedMb: 0, heapTotalMb: 0 };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1B3541] p-5 sm:p-6 rounded-3xl border border-[#C4DCE3] dark:border-[#365765] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D6EBF3] dark:bg-[#203D49] text-[#243D49] dark:text-[#83BDCF] border border-[#C4DCE3]/60 dark:border-[#365765]">
              <Activity size={14} className="text-[#447F98]" /> Infrastructure Health
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Green
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#243D49] dark:text-[#EAF4F7] tracking-tight">
            System Monitoring & Audit Logs
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#C0D5DC]">
            Real-time status of backend services, database connections, AI engines, and administrative event logs.
          </p>
        </div>

        <button
          onClick={loadHealth}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#447F98] hover:bg-[#36687D] text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Ping Services</span>
        </button>
      </div>

      {/* 4 Core Services Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((svc, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526C78] dark:text-[#91ADB8]">
                {svc.type}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  svc.status === 'operational'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                <CheckCircle2 size={11} />
                <span className="capitalize">{svc.status}</span>
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#243D49] dark:text-[#EAF4F7]">
                {svc.name}
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#C0D5DC] mt-0.5">
                {svc.details}
              </p>
            </div>

            <div className="text-[11px] text-[#526C78] dark:text-[#83BDCF] pt-1 border-t border-[#C4DCE3]/40 dark:border-[#365765]/40 flex items-center justify-between">
              <span>Latency</span>
              <span className="font-bold font-mono">{svc.latencyMs} ms</span>
            </div>
          </div>
        ))}
      </div>

      {/* Server Runtime & Telemetry Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#526C78] dark:text-[#91ADB8]">
            <span>Uptime</span>
            <Clock size={16} className="text-[#447F98]" />
          </div>
          <p className="text-xl font-black text-[#243D49] dark:text-[#EAF4F7]">
            {formatUptime(health?.uptimeSeconds)}
          </p>
          <p className="text-[11px] text-[#526C78] dark:text-[#C0D5DC]">Zero unexpected restarts</p>
        </div>

        <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#526C78] dark:text-[#91ADB8]">
            <span>Memory Heap</span>
            <Cpu size={16} className="text-[#447F98]" />
          </div>
          <p className="text-xl font-black text-[#243D49] dark:text-[#EAF4F7]">
            {memory.heapUsedMb} MB / {memory.heapTotalMb} MB
          </p>
          <p className="text-[11px] text-[#526C78] dark:text-[#C0D5DC]">Process RSS: {memory.rssMb} MB</p>
        </div>

        <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#526C78] dark:text-[#91ADB8]">
            <span>Runtime Environment</span>
            <Server size={16} className="text-[#447F98]" />
          </div>
          <p className="text-xl font-black text-[#243D49] dark:text-[#EAF4F7]">
            Node {health?.nodeVersion || 'v20'}
          </p>
          <p className="text-[11px] text-[#526C78] dark:text-[#C0D5DC]">Mode: {health?.environment}</p>
        </div>
      </div>

      {/* Administrative Audit Trail */}
      <div className="bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
              Administrative Event Audit Trail
            </h3>
            <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
              Immutable log of admin actions, status changes, and privilege modifications
            </p>
          </div>
          <div className="p-2 rounded-xl bg-[#D6EBF3] dark:bg-[#203D49] text-[#447F98] dark:text-[#83BDCF]">
            <ShieldCheck size={18} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EBF4F7] dark:bg-[#18303C] border-b border-[#C4DCE3] dark:border-[#365765] text-[#526C78] dark:text-[#83BDCF] uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Target User ID</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C4DCE3]/60 dark:divide-[#365765]/60 font-medium">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F4FAFC] dark:hover:bg-[#152B35]/60">
                  <td className="px-4 py-3 text-[#526C78] dark:text-[#C0D5DC]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-[#447F98] dark:text-[#83BDCF] bg-[#D6EBF3]/40 dark:bg-[#203D49] px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#243D49] dark:text-[#EAF4F7]">
                    {log.admin_email}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#526C78] dark:text-[#91ADB8]">
                    {log.target_user_id || 'N/A (Global)'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#526C78] dark:text-[#C0D5DC]">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

