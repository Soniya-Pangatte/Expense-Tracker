import React from 'react';
import { Sparkles } from 'lucide-react';

export default function LightTransitionSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center py-20 px-4 sm:px-8 z-10 pointer-events-auto">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B9D9E1]/80 dark:bg-[#203D49] border border-[#C4DCE3]/40 text-[#243D49] dark:text-[#D6EBF3] text-xs font-mono font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#447F98]" />
          <span>AUTONOMOUS FINANCIAL INTELLIGENCE</span>
        </div>

        <h2 className="font-space text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] tracking-tight leading-tight">
          Engineered for Clarity.{' '}
          <br className="hidden sm:inline" />
          <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#C4DCE3] via-[#36687D] to-[#447F98] dark:from-[#C4DCE3] dark:via-[#C4DCE3] dark:to-[#D6EBF3] drop-shadow-[0_2px_15px_rgba(113,201,206,0.35)]">
            Smarter Financial Decisions
          </span>
        </h2>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
          From micro-transactions to annual cash reserves, SpendWise translates raw ledger entries into clear, strategic intelligence with zero manual spreadsheets.
        </p>

        {/* 3 Metric Pills */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono font-semibold text-[#526C78] dark:text-[#83BDCF]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#447F98] shadow-[0_0_8px_rgba(113,201,206,0.8)]" />
            <span>SUB-SECOND CALCULATION</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#447F98] shadow-[0_0_8px_rgba(166,227,233,0.8)]" />
            <span>RLS ROW-LEVEL PRIVACY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#447F98] shadow-[0_0_8px_rgba(113,201,206,0.8)]" />
            <span>GEMINI 1.5 INTEGRATION</span>
          </div>
        </div>
      </div>
    </section>
  );
}
