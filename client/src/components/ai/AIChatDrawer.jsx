import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  X,
  Maximize2,
  Minimize2,
  ChevronUp,
} from 'lucide-react';
import AIChatBox from './AIChatBox';

export default function AIChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Hide the floating button when the user is already on the dedicated /ai-assistant page
  if (location.pathname === '/ai-assistant') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[420px] max-w-[440px] bg-white dark:bg-[#1B3541] rounded-2xl shadow-2xl border border-[#C4DCE3] dark:border-[#365765] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Drawer Top Navigation Bar */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-[#D6EBF3] via-[#B9D9E1] to-[#C4DCE3] dark:from-[#447F98] dark:to-[#1B3541] border-b border-[#C4DCE3] dark:border-[#365765] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#447F98] flex items-center justify-center text-[#D6EBF3]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs text-[#243D49] dark:text-[#D6EBF3]">
                SpendWise AI
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-assistant');
                }}
                title="Open Full Page View"
                className="p-1 text-[#526C78] hover:text-[#243D49] dark:text-[#83BDCF] dark:hover:text-[#D6EBF3] rounded-lg transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1 text-[#526C78] hover:text-[#243D49] dark:text-[#83BDCF] dark:hover:text-[#D6EBF3] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Embedded Chat Box */}
          <AIChatBox
            className="border-0 rounded-none shadow-none"
            height="h-[380px] sm:h-[420px]"
            isCompact={true}
          />
        </div>
      )}

      {/* Floating Trigger Bubble Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#C4DCE3] to-[#36687D] hover:from-[#36687D] hover:to-[#C4DCE3] text-[#243D49] font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/80 dark:border-[#365765]"
        aria-label="Open SpendWise AI Assistant"
      >
        <div className="w-7 h-7 rounded-full bg-white/90 dark:bg-[#203D49] flex items-center justify-center text-[#243D49] dark:text-[#B9D9E1] shadow-xs">
          {isOpen ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-[#447F98] dark:text-[#83BDCF]" />}
        </div>
        <span className="text-sm font-extrabold tracking-tight hidden sm:inline">
          {isOpen ? 'Close AI' : 'SpendWise AI'}
        </span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#447F98] opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
          </span>
        )}
      </button>
    </div>
  );
}

