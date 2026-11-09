import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, ArrowLeft, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const titles = {
  '/admin': 'Admin Overview',
  '/admin/overview': 'Admin Overview',
  '/admin/users': 'User Management',
  '/admin/analytics': 'Application Analytics',
  '/admin/system': 'System Health & Monitoring',
  '/admin/settings': 'Settings & Role-Based Access Control',
};

export default function AdminNavbar({ onOpenSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTitle = titles[location.pathname] || 'Admin Portal';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#1B3541]/90 backdrop-blur-md border-b border-[#C4DCE3] dark:border-[#365765] transition-colors">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-[#526C78] hover:text-[#243D49] dark:hover:text-[#EAF4F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle Admin Navigation"
          >
            <Menu size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#447F98] dark:text-[#83BDCF]">
                SpendWise Admin
              </span>
              <span className="text-xs text-[#758D97] dark:text-[#91ADB8]">/</span>
              <span className="text-xs text-[#526C78] dark:text-[#C0D5DC] font-medium hidden sm:inline">
                Control Plane
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[#243D49] dark:text-[#EAF4F7] tracking-tight">
              {currentTitle}
            </h1>
          </div>
        </div>

        {/* Right Section: Live Health & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live System Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Normal</span>
          </div>

          {/* Switch to User App */}
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#203D49] text-[#243D49] dark:text-[#EAF4F7] hover:bg-[#B9D9E1]/30 dark:hover:bg-[#284956] text-xs font-semibold transition-all shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>User Dashboard</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#243D49] dark:text-[#EAF4F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-amber-400 animate-in spin-in-180 duration-200" />
            ) : (
              <Moon size={18} className="text-[#447F98] animate-in spin-in-180 duration-200" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

