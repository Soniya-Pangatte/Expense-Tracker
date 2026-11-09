import React from 'react';
import {
  Sliders,
  ShieldCheck,
  Key,
  Database,
  Lock,
  CheckCircle2,
  FileCode,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSettings() {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-[#1B3541] p-5 sm:p-6 rounded-3xl border border-[#C4DCE3] dark:border-[#365765] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D6EBF3] dark:bg-[#203D49] text-[#243D49] dark:text-[#83BDCF] border border-[#C4DCE3]/60 dark:border-[#365765]">
              <Sliders size={14} className="text-[#447F98]" /> Governance
            </span>
            <span className="text-xs text-[#526C78] dark:text-[#91ADB8]">
              Role-Based Access Control
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#243D49] dark:text-[#EAF4F7] tracking-tight">
            Security Policies & Role Management
          </h2>
          <p className="text-xs sm:text-sm text-[#526C78] dark:text-[#C0D5DC]">
            Admin role delegation procedure, Supabase RLS specifications, and zero-trust configuration controls.
          </p>
        </div>
      </div>

      {/* Grid: Admin Assignment Procedure & RLS Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: How Admin Roles Are Assigned (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D6EBF3] dark:bg-[#203D49] text-[#447F98] dark:text-[#83BDCF] flex items-center justify-center">
              <Key size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
                Admin Role Assignment Procedure
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
                Strict procedure preventing public privilege escalation
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-[#526C78] dark:text-[#C0D5DC] leading-relaxed">
            <p>
              In SpendWise, <strong>no user can ever self-assign an Admin role during public signup</strong>. Every registration automatically triggers the PostgreSQL trigger <code>handle_new_user()</code> which hardcodes the default role to <code>'user'</code>.
            </p>

            <div className="p-3.5 rounded-2xl bg-[#F4FAFC] dark:bg-[#152B35] border border-[#C4DCE3]/60 dark:border-[#365765]/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#243D49] dark:text-[#EAF4F7]">
                <Terminal size={14} className="text-[#447F98]" />
                <span>Option 1: Promote via Database Administrator Stored Procedure</span>
              </div>
              <p className="text-[11px] text-[#526C78] dark:text-[#91ADB8]">
                Execute the secure stored procedure in the Supabase SQL editor:
              </p>
              <pre className="p-2.5 rounded-xl bg-[#1B3541] text-[#EAF4F7] font-mono text-[11px] overflow-x-auto">
{`SELECT public.assign_user_role('target.email@domain.com', 'admin');`}
              </pre>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4FAFC] dark:bg-[#152B35] border border-[#C4DCE3]/60 dark:border-[#365765]/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#243D49] dark:text-[#EAF4F7]">
                <ShieldCheck size={14} className="text-[#447F98]" />
                <span>Option 2: Promote via Admin Portal (Verified Admin Only)</span>
              </div>
              <p className="text-[11px] text-[#526C78] dark:text-[#91ADB8]">
                An existing administrator can navigate to <strong>User Management</strong>, locate the user, and click the Shield icon to promote them. The action is recorded in the immutable audit log.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Security Guarantees & RLS Checklist (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#243D49] dark:text-[#EAF4F7]">
                Security Checklist
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
                Verified system protection controls
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            {[
              { title: 'Server-side Token Verification', desc: 'Every admin request checks JWT validity against Supabase.' },
              { title: 'Database Role Verification', desc: 'Checked against public.user_roles; frontend claims are not trusted.' },
              { title: 'Zero Exposure of Financial Data', desc: 'No personal transactions, receipts, or statements appear in admin views.' },
              { title: 'Self-Deactivation Prohibited', desc: 'Admins cannot lock themselves out of the system.' },
              { title: 'Row Level Security Active', desc: 'RLS policies on user_roles and admin_audit_logs enforce strict isolation.' },
              { title: 'Service Role Keys Kept on Backend', desc: 'No privileged credentials bundled in the React Vite bundle.' },
            ].map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#F4FAFC] dark:bg-[#152B35] border border-[#C4DCE3]/60 dark:border-[#365765]/60 flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#243D49] dark:text-[#EAF4F7]">{item.title}</p>
                  <p className="text-[11px] text-[#526C78] dark:text-[#91ADB8]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
