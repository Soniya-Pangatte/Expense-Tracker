import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function FinalCTASection() {
  return (
    <section className="relative min-h-screen py-24 px-4 sm:px-8 z-10 flex flex-col justify-between items-center text-center pointer-events-auto">
      {/* Spacer */}
      <div className="h-10" />

      {/* Center CTA Box over the 3D Luminous Sphere in Aqua Theme */}
      <div className="max-w-3xl mx-auto space-y-6 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B9D9E1]/80 dark:bg-[#203D49] border border-[#C4DCE3]/40 text-[#243D49] dark:text-[#D6EBF3] text-xs font-mono font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#447F98]" />
          <span>START YOUR FINANCIAL INDEPENDENCE</span>
        </div>

        <h2 className="font-space text-4xl sm:text-6xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] tracking-tight leading-tight">
          Ready to Take Control of Your{' '}
          <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#C4DCE3] via-[#36687D] to-[#447F98] dark:from-[#C4DCE3] dark:via-[#C4DCE3] dark:to-[#D6EBF3] drop-shadow-[0_2px_15px_rgba(113,201,206,0.35)]">
            Money?
          </span>
        </h2>

        <p className="max-w-lg mx-auto text-sm sm:text-base text-[#526C78] dark:text-[#83BDCF] leading-relaxed font-medium">
          Join users worldwide mastering their finances with automated tracking, intelligent budgeting, and personal AI guidance.
        </p>

        {/* Luminous Aqua CTA Button */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-9 py-3.5 rounded-full bg-[#447F98] dark:bg-[#83BDCF] hover:bg-[#36687D] dark:hover:bg-[#95CCDC] text-white dark:text-[#152B35] font-extrabold text-sm tracking-wide shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 text-white dark:text-[#152B35]" />
          </Link>
          <Link
            to="/login"
            className="px-7 py-3.5 rounded-full bg-white/80 dark:bg-[#203D49]/80 hover:bg-[#B9D9E1] dark:hover:bg-[#365765] text-[#243D49] dark:text-[#EAF4F7] border border-[#C4DCE3] dark:border-[#365765] text-sm font-semibold transition-all shadow-2xs"
          >
            Log In
          </Link>
        </div>

        <div className="pt-2 text-[11px] font-mono font-medium text-[#526C78] dark:text-[#C0D5DC] flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#447F98] dark:text-[#83BDCF]" />
          <span>Free account · No credit card required · Isolated user database</span>
        </div>
      </div>

      {/* Minimal Footer matching SpendWise UI */}
      <footer className="w-full max-w-7xl mx-auto pt-16 pb-6 border-t border-[#C4DCE3] dark:border-[#365765] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#526C78] dark:text-[#C0D5DC]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#447F98] dark:bg-[#83BDCF] flex items-center justify-center text-white dark:text-[#152B35] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-white dark:text-[#152B35]" />
          </div>
          <span className="font-space font-bold tracking-wider text-[#243D49] dark:text-[#EAF4F7]">
            SPENDWISE
          </span>
          <span className="text-[#526C78]/70 dark:text-[#C0D5DC]/60 ml-2">© {new Date().getFullYear()} SpendWise Systems.</span>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <Link to="/login" className="hover:text-[#447F98] dark:hover:text-[#83BDCF] transition-colors">
            Security & RLS
          </Link>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#243D49] dark:hover:text-[#D6EBF3] transition-colors"
          >
            Supabase DB
          </a>
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#243D49] dark:hover:text-[#D6EBF3] transition-colors"
          >
            Gemini AI
          </a>
          <Link to="/register" className="text-[#243D49] dark:text-[#EAF4F7] dark:text-[#83BDCF] hover:underline font-bold">
            Get Started →
          </Link>
        </div>
      </footer>
    </section>
  );
}
