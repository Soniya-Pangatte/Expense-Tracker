import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';

export default function LandingFooter() {
  const scrollToFeatures = () => {
    const elem = document.getElementById('features');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="border-t border-[#C4DCE3] dark:border-[#365765] bg-white/50 dark:bg-[#152B35]/50 transition-colors py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Brand & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-[#447F98] flex items-center justify-center text-[#D6EBF3] shadow-sm">
                <Wallet size={16} strokeWidth={2.4} />
              </div>
              <span className="font-bold text-base tracking-tight text-[#243D49] dark:text-[#D6EBF3]">
                Spend<span className="text-[#447F98]">Wise</span>
              </span>
            </Link>
            <span className="text-xs text-[#526C78] dark:text-[#83BDCF]">
              © {new Date().getFullYear()} SpendWise. All rights reserved.
            </span>
          </div>

          {/* Right: Minimal Navigation Links */}
          <div className="flex items-center gap-6 text-xs sm:text-sm font-medium text-[#526C78] dark:text-[#83BDCF]">
            <button
              onClick={scrollToFeatures}
              className="hover:text-[#243D49] dark:hover:text-[#D6EBF3] transition-colors"
            >
              Features
            </button>
            <Link
              to="/login"
              className="hover:text-[#243D49] dark:hover:text-[#D6EBF3] transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="text-[#447F98] font-semibold hover:underline transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
