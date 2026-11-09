import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  LineChart,
  Activity,
  Sliders,
  ArrowLeft,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const adminNavItems = [
  { name: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
  { name: 'User Management', path: '/admin/users', icon: Users },
  { name: 'Application Analytics', path: '/admin/analytics', icon: LineChart },
  { name: 'System Health', path: '/admin/system', icon: Activity },
  { name: 'Settings & RBAC', path: '/admin/settings', icon: Sliders },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout, isDemoAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'System Administrator';
  const displayEmail = profile?.email || user?.email || 'admin@spendwise.io';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Admin Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#1E3A47] text-white border-r border-[#315668] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#315668]">
          <NavLink to="/admin/overview" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#447F98] to-[#203D49] border border-[#83BDCF]/40 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-[#EAF4F7]">
                  Spend<span className="text-[#83BDCF]">Wise</span>
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#83BDCF] text-[#152B35]">
                  Admin
                </span>
              </div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-[#91ADB8] -mt-0.5">
                Control Center
              </p>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#91ADB8] hover:text-white hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Back to App Link */}
        <div className="p-3 mx-4 my-3 rounded-xl bg-[#244554] border border-[#3A6478] flex items-center justify-between">
          <div className="text-xs">
            <span className="text-[#91ADB8] block text-[10px] uppercase font-bold tracking-wider">Mode</span>
            <span className="font-semibold text-white">Admin Portal</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-2.5 py-1.5 rounded-lg bg-[#447F98] hover:bg-[#36687D] text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>Exit to App</span>
          </button>
        </div>

        {/* Admin Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#83BDCF] px-3 mb-2">
            Administration
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/admin/overview' && location.pathname === '/admin');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#447F98] text-white shadow-sm font-semibold'
                    : 'text-[#C0D5DC] hover:text-white hover:bg-[#284956]/70'
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors ${
                    isActive ? 'text-white' : 'text-[#83BDCF] group-hover:text-white'
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight size={15} className="opacity-80" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Security Status Card */}
        <div className="mx-4 mb-3 p-3 rounded-xl bg-[#172D37] border border-[#2D5060] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#83BDCF]">RBAC Guard</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-[#C0D5DC] leading-snug">
            Protected by verified JWT and Supabase Row Level Security.
          </p>
        </div>

        {/* Admin User Profile Footer */}
        <div className="p-3 border-t border-[#315668] flex items-center justify-between bg-[#1A333F]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#447F98] text-white flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-white/30">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-white truncate">
                  {displayName}
                </p>
                {isDemoAdmin && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#91ADB8] truncate">
                {displayEmail}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out of Admin Portal"
            className="p-1.5 text-[#91ADB8] hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
