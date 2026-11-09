import React from 'react';
import { ArrowUpRight, Cpu, Layers, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';

export default function CapabilitiesSection() {
  return (
    <section id="capabilities" className="relative min-h-screen py-24 px-4 sm:px-8 z-10 flex flex-col justify-center pointer-events-auto">
      <div className="max-w-6xl mx-auto w-full space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B9D9E1]/80 dark:bg-[#203D49] border border-[#C4DCE3]/40 text-[#243D49] dark:text-[#D6EBF3] text-xs font-mono font-semibold">
            CAPABILITIES // ARCHITECTURE
          </div>
          <h2 className="font-space text-3xl sm:text-5xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Multi-Currency{' '}
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#C4DCE3] via-[#36687D] to-[#447F98] dark:from-[#C4DCE3] dark:via-[#C4DCE3] dark:to-[#D6EBF3]">
              Settlement Facilities
            </span>
          </h2>
          <p className="text-sm text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
            Institutional-grade personal financial infrastructure designed to track, forecast, and optimize every cash flow.
          </p>
        </div>

        {/* 3 Large Glass Cards with Technical Wireframe Diagrams in Aqua Theme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Expense Ingestion */}
          <div className="relative bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-xl border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md group transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            {/* Top Wireframe Diagram Canvas */}
            <div className="w-full h-36 rounded-2xl bg-gradient-to-b from-[#B9D9E1]/60 to-[#D6EBF3]/40 dark:from-[#1B3541] dark:to-[#152B35] border border-[#C4DCE3] dark:border-[#365765] flex items-center justify-center relative overflow-hidden mb-6">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border border-[#C4DCE3]/60 rounded-lg rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                <div className="absolute inset-2 border border-[#C4DCE3] rounded-md -rotate-6 group-hover:rotate-12 transition-transform duration-700" />
                <div className="w-6 h-6 rounded-sm bg-[#447F98] shadow-[0_0_15px_rgba(113,201,206,0.6)]" />
              </div>
              <div className="absolute top-2 left-3 text-[10px] font-mono font-medium text-[#526C78] dark:text-[#83BDCF]">
                OCR_SCANNER :: ACTIVE
              </div>
              <div className="absolute bottom-2 right-3 text-[10px] font-mono font-bold text-[#243D49] dark:text-[#83BDCF]">
                99.4% ACCURACY
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#447F98] tracking-wider uppercase">
                ENGINE 01
              </span>
              <h3 className="font-space text-lg sm:text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] group-hover:text-[#447F98] transition-colors">
                Expense Ingestion
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
                Seamless multi-source tracking via receipt OCR scanning, bank statement CSV imports, and instant manual input.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#C4DCE3] dark:border-[#365765] flex items-center justify-between text-xs text-[#526C78] dark:text-[#83BDCF]">
              <span className="font-mono">Real-time Sync</span>
              <ArrowUpRight className="w-4 h-4 text-[#447F98] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Multi-Currency Settlement */}
          <div className="relative bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-xl border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md group transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            {/* Top Wireframe Diagram Canvas */}
            <div className="w-full h-36 rounded-2xl bg-gradient-to-b from-[#B9D9E1]/60 to-[#D6EBF3]/40 dark:from-[#1B3541] dark:to-[#152B35] border border-[#C4DCE3] dark:border-[#365765] flex items-center justify-center relative overflow-hidden mb-6">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-[#C4DCE3]/60 animate-spin" style={{ animationDuration: '18s' }} />
                <div className="absolute inset-3 rounded-full border border-[#C4DCE3]" />
                <div className="w-4 h-4 rounded-full bg-[#447F98] shadow-[0_0_15px_rgba(113,201,206,0.8)]" />
              </div>
              <div className="absolute top-2 left-3 text-[10px] font-mono font-medium text-[#526C78] dark:text-[#83BDCF]">
                FOREX_RATE :: LIVE
              </div>
              <div className="absolute bottom-2 right-3 text-[10px] font-mono font-bold text-[#243D49] dark:text-[#83BDCF]">
                INR · USD · EUR · GBP
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#447F98] tracking-wider uppercase">
                ENGINE 02
              </span>
              <h3 className="font-space text-lg sm:text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] group-hover:text-[#447F98] transition-colors">
                Dynamic Budgeting
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
                Adaptive monthly caps that auto-adjust to your income pace, with burn rate warnings before limits are breached.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#C4DCE3] dark:border-[#365765] flex items-center justify-between text-xs text-[#526C78] dark:text-[#83BDCF]">
              <span className="font-mono">Pacing Guardrails</span>
              <ArrowUpRight className="w-4 h-4 text-[#447F98] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: AI Financial Insights */}
          <div className="relative bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-xl border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md group transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            {/* Top Wireframe Diagram Canvas */}
            <div className="w-full h-36 rounded-2xl bg-gradient-to-b from-[#B9D9E1]/60 to-[#D6EBF3]/40 dark:from-[#1B3541] dark:to-[#152B35] border border-[#C4DCE3] dark:border-[#365765] flex items-center justify-center relative overflow-hidden mb-6">
              <div className="flex items-end gap-1.5 h-12">
                <div className="w-2.5 h-8 bg-[#447F98] dark:bg-[#365765] rounded-xs" />
                <div className="w-2.5 h-12 bg-[#447F98] rounded-xs" />
                <div className="w-2.5 h-6 bg-[#B9D9E1] dark:bg-[#1B3541] rounded-xs" />
                <div className="w-2.5 h-11 bg-[#203D49] dark:bg-[#83BDCF] rounded-xs shadow-[0_0_12px_rgba(113,201,206,0.5)]" />
                <div className="w-2.5 h-7 bg-[#447F98] rounded-xs" />
              </div>
              <div className="absolute top-2 left-3 text-[10px] font-mono font-medium text-[#526C78] dark:text-[#83BDCF]">
                GEMINI_AI :: ACTIVE
              </div>
              <div className="absolute bottom-2 right-3 text-[10px] font-mono font-bold text-[#243D49] dark:text-[#83BDCF]">
                100% FACTUAL
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#447F98] tracking-wider uppercase">
                ENGINE 03
              </span>
              <h3 className="font-space text-lg sm:text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] group-hover:text-[#447F98] transition-colors">
                AI Advisory Co-pilot
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
                SpendWise AI evaluates your real data, flags recurring subscriptions, and models customized monthly savings plans.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#C4DCE3] dark:border-[#365765] flex items-center justify-between text-xs text-[#526C78] dark:text-[#83BDCF]">
              <span className="font-mono">Deterministic Safety</span>
              <ArrowUpRight className="w-4 h-4 text-[#447F98] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
