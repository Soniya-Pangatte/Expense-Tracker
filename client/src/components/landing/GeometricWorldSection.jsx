import React from 'react';
import { Layers } from 'lucide-react';

export default function GeometricWorldSection() {
  return (
    <section className="relative min-h-[85vh] py-24 px-4 sm:px-8 z-10 flex flex-col justify-center items-center text-center pointer-events-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B9D9E1]/80 dark:bg-[#203D49] border border-[#C4DCE3]/40 text-[#243D49] dark:text-[#D6EBF3] text-xs font-mono font-bold shadow-2xs">
          <Layers className="w-3.5 h-3.5 text-[#447F98]" />
          <span>GLOBAL GEOMETRIC MESH // TELEMETRY</span>
        </div>

        <h2 className="font-space text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] tracking-tight leading-tight">
          Global Architecture.{' '}
          <br className="hidden sm:inline" />
          <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#C4DCE3] via-[#36687D] to-[#447F98] dark:from-[#C4DCE3] dark:via-[#C4DCE3] dark:to-[#D6EBF3] drop-shadow-[0_2px_15px_rgba(113,201,206,0.35)]">
            Unified Control.
          </span>
        </h2>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
          Every transaction, category threshold, and recurring subscription operates in a unified matrix. As your cash flow evolves, SpendWise updates your trajectory instantly.
        </p>

        {/* 3 Metric Cards in Aqua Palette */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 max-w-2xl mx-auto text-left">
          <div className="bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-md border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs">
            <div className="text-2xl font-black text-[#243D49] dark:text-[#D6EBF3] font-space">100%</div>
            <div className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1 font-medium">Deterministic Calculations</div>
          </div>
          <div className="bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-md border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs">
            <div className="text-2xl font-black text-[#447F98] font-space">&lt; 0.2s</div>
            <div className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1 font-medium">Real-time Budget Recalculation</div>
          </div>
          <div className="bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-md border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs">
            <div className="text-2xl font-black text-[#243D49] dark:text-[#D6EBF3] font-space">5 Currencies</div>
            <div className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1 font-medium">INR, USD, EUR, GBP, CAD</div>
          </div>
        </div>
      </div>
    </section>
  );
}
