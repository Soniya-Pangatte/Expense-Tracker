import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Plus, Bell, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';

export default function Navbar({ onOpenSidebar, pageTitle = 'Dashboard' }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-md border-b border-[#C4DCE3] dark:border-[#365765] transition-colors">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu Button & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-[#526C78] hover:text-[#243D49] dark:hover:text-[#EAF4F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#243D49] dark:text-[#EAF4F7] tracking-tight">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Center: Search input (hidden on small mobile screens) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#C0D5DC]" size={16} />
            <input
              type="text"
              placeholder="Search transactions, merchants, categories..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#FFFFFF] dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] placeholder-[#758D97] dark:placeholder-[#91ADB8] focus:outline-none focus:ring-2 focus:ring-[#447F98] dark:focus:ring-[#83BDCF] transition-all"
            />
          </div>
        </div>

        {/* Right Section: Actions & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Expense button */}
          <Button
            size="sm"
            icon={Plus}
            onClick={() => navigate('/add-expense')}
            className="hidden sm:inline-flex"
          >
            Add Expense
          </Button>

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

          {/* Notifications button */}
          <button
            className="relative p-2 sm:p-2.5 rounded-xl border border-[#C4DCE3] dark:border-[#365765] bg-white dark:bg-[#1B3541] text-[#526C78] hover:text-[#243D49] dark:text-[#83BDCF] dark:hover:text-[#D6EBF3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#447F98]" />
          </button>
        </div>
      </div>
    </header>
  );
}
