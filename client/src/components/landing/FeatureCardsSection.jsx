import React from 'react';
import { Lock, PieChart, Sparkles } from 'lucide-react';

export default function FeatureCardsSection() {
  return (
    <section id="features" className="relative min-h-screen py-24 px-4 sm:px-8 z-10 flex flex-col justify-center pointer-events-auto">
      <div className="max-w-6xl mx-auto w-full space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B9D9E1]/80 dark:bg-[#203D49] border border-[#C4DCE3]/40 text-[#243D49] dark:text-[#D6EBF3] text-xs font-mono font-bold">
            CORE PLATFORM // SPECIFICATIONS
          </div>
          <h2 className="font-space text-3xl sm:text-5xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Powerful Financial{' '}
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#C4DCE3] via-[#36687D] to-[#447F98] dark:from-[#C4DCE3] dark:via-[#C4DCE3] dark:to-[#D6EBF3]">
              Engine
            </span>
          </h2>
          <p className="text-sm text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
            Every feature is designed to replace fragmented financial tools with one coherent, privacy-first system.
          </p>
        </div>

        {/* 3 Dark/Light Glass Feature Cards in Aqua Theme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-xl border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] rounded-3xl p-7 shadow-xs hover:shadow-md space-y-6 group transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#B9D9E1] dark:bg-[#1B3541] border border-[#C4DCE3]/40 flex items-center justify-center text-[#243D49] dark:text-[#83BDCF] group-hover:scale-110 transition-transform shadow-2xs">
              <Lock className="w-5 h-5 text-[#447F98]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-space text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] group-hover:text-[#447F98] transition-colors">
                Secure & Isolated Data
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
                PostgreSQL database protected with Supabase Row Level Security (RLS). Your transactions and account figures are strictly private to you.
              </p>
            </div>

            <ul className="space-y-2 text-xs font-mono font-medium text-[#526C78] dark:text-[#83BDCF] pt-2 border-t border-[#C4DCE3] dark:border-[#365765]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#447F98]" />
                AES-256 Cloud Encryption
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#447F98]" />
                JWT Auth Token Verification
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-xl border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] rounded-3xl p-7 shadow-xs hover:shadow-md space-y-6 group transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#B9D9E1] dark:bg-[#1B3541] border border-[#C4DCE3]/40 flex items-center justify-center text-[#243D49] dark:text-[#83BDCF] group-hover:scale-110 transition-transform shadow-2xs">
              <PieChart className="w-5 h-5 text-[#447F98]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-space text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] group-hover:text-[#447F98] transition-colors">
                Dynamic Burn Analytics
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
                Deterministic calculation engine projects your end-of-month spend based on active pacing, flagging anomaly spikes and subscription creep.
              </p>
            </div>

            <ul className="space-y-2 text-xs font-mono font-medium text-[#526C78] dark:text-[#83BDCF] pt-2 border-t border-[#C4DCE3] dark:border-[#365765]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#447F98]" />
                Daily Burn Rate Telemetry
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#447F98]" />
                Over-Budget Early Warnings
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/90 dark:bg-[#203D49]/90 backdrop-blur-xl border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] rounded-3xl p-7 shadow-xs hover:shadow-md space-y-6 group transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#B9D9E1] dark:bg-[#1B3541] border border-[#C4DCE3]/40 flex items-center justify-center text-[#243D49] dark:text-[#83BDCF] group-hover:scale-110 transition-transform shadow-2xs">
              <Sparkles className="w-5 h-5 text-[#447F98]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-space text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] group-hover:text-[#447F98] transition-colors">
                Autonomous AI Advisory
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
                SpendWise AI analyzes your actual financial records to answer queries, suggest 15% discretionary trims, and keep you accountable.
              </p>
            </div>

            <ul className="space-y-2 text-xs font-mono font-medium text-[#526C78] dark:text-[#83BDCF] pt-2 border-t border-[#C4DCE3] dark:border-[#365765]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#447F98]" />
                Strict Zero-Hallucination Policy
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#447F98]" />
                Conversational Memory
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
