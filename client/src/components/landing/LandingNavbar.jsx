import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Menu, X, Globe, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3 sm:py-4 bg-[#D6EBF3]/80 dark:bg-[#152B35]/85 backdrop-blur-md border-b border-[#C4DCE3]/80 dark:border-[#365765]/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo - SpendWise Aqua Identity */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#447F98] dark:bg-[#83BDCF] flex items-center justify-center text-white dark:text-[#152B35] shadow-sm group-hover:scale-105 transition-all">
            <Sparkles className="w-4 h-4 text-white dark:text-[#152B35]" />
          </div>
          <span className="font-space font-extrabold text-lg tracking-wider text-[#243D49] dark:text-[#EAF4F7]">
            SPENDWISE
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs tracking-wider uppercase font-semibold text-[#526C78] dark:text-[#C0D5DC]">
          <button
            onClick={() => scrollToSection('hero')}
            className="hover:text-[#447F98] dark:hover:text-[#83BDCF] transition-colors"
          >
            Overview
          </button>
          <button
            onClick={() => scrollToSection('capabilities')}
            className="hover:text-[#447F98] dark:hover:text-[#83BDCF] transition-colors"
          >
            Capabilities
          </button>
          <button
            onClick={() => scrollToSection('dashboard-preview')}
            className="hover:text-[#447F98] dark:hover:text-[#83BDCF] transition-colors"
          >
            Terminal
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-[#447F98] dark:hover:text-[#83BDCF] transition-colors"
          >
            Features
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl bg-white/80 dark:bg-[#203D49]/80 hover:bg-[#B9D9E1] dark:hover:bg-[#365765] border border-[#C4DCE3] dark:border-[#365765] text-[#243D49] dark:text-[#EAF4F7] transition-all shadow-2xs"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#447F98]" />}
          </button>

          <div className="flex items-center gap-1.5 text-[#526C78] dark:text-[#C0D5DC] hover:text-[#447F98] dark:hover:text-[#83BDCF] transition-colors cursor-pointer">
            <Globe className="w-3.5 h-3.5 text-[#447F98] dark:text-[#83BDCF]" />
            <span className="tracking-wide font-medium">English</span>
          </div>

          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-[#447F98] dark:bg-[#83BDCF] hover:bg-[#36687D] dark:hover:bg-[#95CCDC] text-white dark:text-[#152B35] font-bold tracking-wide shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[#243D49] dark:text-[#EAF4F7] hover:text-[#447F98] dark:hover:text-[#83BDCF] font-semibold tracking-wide transition-colors px-2"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-[#447F98] dark:bg-[#83BDCF] hover:bg-[#36687D] dark:hover:bg-[#95CCDC] text-white dark:text-[#152B35] font-bold tracking-wide shadow-xs hover:shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Sign up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden p-2 text-[#243D49] dark:text-[#EAF4F7] hover:text-[#447F98] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 px-6 py-5 bg-white/95 dark:bg-[#1B3541]/95 backdrop-blur-xl border border-[#C4DCE3] dark:border-[#365765] rounded-2xl space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-3 text-sm text-[#526C78] dark:text-[#83BDCF]">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-left py-1 hover:text-[#447F98] dark:hover:text-[#83BDCF]"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('capabilities')}
              className="text-left py-1 hover:text-[#447F98] dark:hover:text-[#83BDCF]"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection('dashboard-preview')}
              className="text-left py-1 hover:text-[#447F98] dark:hover:text-[#83BDCF]"
            >
              Terminal
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-left py-1 hover:text-[#447F98] dark:hover:text-[#83BDCF]"
            >
              Features
            </button>
          </nav>

          <div className="pt-3 border-t border-[#C4DCE3] dark:border-[#365765] flex flex-col gap-2.5">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-[#526C78] dark:text-[#C0D5DC]">Color Theme</span>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg bg-[#D6EBF3] dark:bg-[#203D49] text-[#243D49] dark:text-[#EAF4F7]"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#447F98]" />}
              </button>
            </div>
            <Link
              to="/login"
              className="w-full text-center py-2.5 rounded-xl text-[#243D49] dark:text-[#EAF4F7] font-semibold bg-[#B9D9E1]/40 dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765]"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="w-full text-center py-2.5 rounded-xl text-white font-bold bg-[#447F98] dark:bg-[#83BDCF] dark:text-[#152B35] shadow-xs"
            >
              Sign Up Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
