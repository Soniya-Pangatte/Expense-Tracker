import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Sparkles, Box, Compass } from 'lucide-react';

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-between pt-28 pb-12 px-4 sm:px-8 z-10 pointer-events-auto">
      {/* Central Headline Block */}
      <div className="max-w-4xl mx-auto text-center mt-6 sm:mt-12 space-y-5">
        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B9D9E1]/80 dark:bg-[#203D49] border border-[#C4DCE3]/50 text-[#243D49] dark:text-[#D6EBF3] text-xs font-semibold tracking-wide shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#447F98] animate-pulse" />
          <span>Introducing SpendWise Digital</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-space text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#243D49] dark:text-[#D6EBF3] leading-[1.08]">
          Transforming the Way <br />
          You Manage{' '}
          <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#C4DCE3] via-[#36687D] to-[#447F98] dark:from-[#C4DCE3] dark:via-[#C4DCE3] dark:to-[#D6EBF3] drop-shadow-[0_2px_15px_rgba(113,201,206,0.35)]">
            Money
          </span>
        </h1>

        {/* Supporting Subtitle */}
        <p className="max-w-xl mx-auto text-sm sm:text-base text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
          Autonomous expense intelligence, dynamic budget pacing, and AI financial advisory engineered for total clarity.
        </p>

        {/* Call to Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3.5 rounded-full bg-[#447F98] dark:bg-[#83BDCF] hover:bg-[#36687D] dark:hover:bg-[#95CCDC] text-white dark:text-[#152B35] font-extrabold text-sm tracking-wide shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 text-white dark:text-[#152B35]" />
          </Link>
          <a
            href="#capabilities"
            className="px-6 py-3.5 rounded-full bg-white/80 dark:bg-[#203D49]/80 hover:bg-[#B9D9E1] dark:hover:bg-[#365765] text-[#243D49] dark:text-[#EAF4F7] border border-[#C4DCE3] dark:border-[#365765] text-sm font-semibold transition-all shadow-2xs"
          >
            Explore Platform
          </a>
        </div>
      </div>

      {/* 3 Bottom Blueprint Cards with Aqua Palette */}
      <div className="max-w-5xl mx-auto w-full pt-16 sm:pt-24 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1 */}
        <div className="bg-white/85 dark:bg-[#203D49]/85 backdrop-blur-md border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] p-5 rounded-2xl shadow-xs transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono tracking-wider uppercase font-bold text-[#447F98]">01 // TRACK</span>
            <div className="w-8 h-8 rounded-xl bg-[#B9D9E1] dark:bg-[#1B3541] flex items-center justify-center text-[#243D49] dark:text-[#83BDCF] group-hover:scale-110 transition-transform">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-space font-bold text-base text-[#243D49] dark:text-[#D6EBF3]">Expense Tracking</h3>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1 leading-relaxed">
            Real-time receipt OCR ingestion and multi-category expense classification.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white/85 dark:bg-[#203D49]/85 backdrop-blur-md border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] p-5 rounded-2xl shadow-xs transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono tracking-wider uppercase font-bold text-[#447F98]">02 // BUDGET</span>
            <div className="w-8 h-8 rounded-xl bg-[#B9D9E1] dark:bg-[#1B3541] flex items-center justify-center text-[#243D49] dark:text-[#83BDCF] group-hover:scale-110 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-space font-bold text-base text-[#243D49] dark:text-[#D6EBF3]">Smart Budgeting</h3>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1 leading-relaxed">
            Adaptive monthly caps and live burn-rate forecasting in your currency.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white/85 dark:bg-[#203D49]/85 backdrop-blur-md border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] p-5 rounded-2xl shadow-xs transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono tracking-wider uppercase font-bold text-[#447F98]">03 // ADVISE</span>
            <div className="w-8 h-8 rounded-xl bg-[#B9D9E1] dark:bg-[#1B3541] flex items-center justify-center text-[#243D49] dark:text-[#83BDCF] group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-space font-bold text-base text-[#243D49] dark:text-[#D6EBF3]">AI Financial Insights</h3>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF] mt-1 leading-relaxed">
            Autonomous spending analysis and savings roadmaps driven by Gemini AI.
          </p>
        </div>
      </div>

      {/* Scroll Down Indicator at bottom right */}
      <div className="flex justify-end pt-6 pr-4 sm:pr-8">
        <a
          href="#capabilities"
          className="inline-flex items-center gap-1.5 text-xs text-[#526C78] dark:text-[#EAF4F7] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3] transition-colors"
        >
          <span className="tracking-wide font-mono font-medium">Scroll down</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce text-[#447F98]" />
        </a>
      </div>
    </section>
  );
}
