import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Brain,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
  HelpCircle,
} from 'lucide-react';
import AIChatBox from '../components/ai/AIChatBox';
import FinancialInsightsSection from '../components/ai/FinancialInsightsSection';
import { useCurrency } from '../context/CurrencyContext';

export default function AIAssistant() {
  const { currency } = useCurrency();
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const handlePromptSelect = (promptText) => {
    setSelectedPrompt(promptText);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#D6EBF3] via-[#B9D9E1] to-[#C4DCE3] dark:from-[#1B3541] dark:via-[#447F98] dark:to-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/70 dark:bg-[#203D49]/70 text-[#243D49] dark:text-[#B9D9E1] border border-[#C4DCE3]/40 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#447F98]" />
              <span>SpendWise AI Assistant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
              Personalized Financial Intelligence
            </h1>
            <p className="text-sm sm:text-base text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
              Your real-time financial advisor. SpendWise AI connects directly to your verified expenses, budgets, and habits to offer actionable spending optimizations and customized savings targets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/80 dark:bg-[#203D49]/80 backdrop-blur-xs px-4 py-3 rounded-2xl border border-[#C4DCE3] dark:border-[#365765] flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#447F98] flex items-center justify-center text-[#D6EBF3]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
                  Data Privacy
                </p>
                <p className="text-xs font-bold text-[#243D49] dark:text-[#D6EBF3]">
                  Isolated & Encrypted
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#203D49]/80 backdrop-blur-xs px-4 py-3 rounded-2xl border border-[#C4DCE3] dark:border-[#365765] flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#447F98] flex items-center justify-center text-[#D6EBF3]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF]">
                  Active Engine
                </p>
                <p className="text-xs font-bold text-[#243D49] dark:text-[#D6EBF3]">
                  Deterministic + Gemini
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#B9D9E1]/20 blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Insights Dashboard & Chat Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Financial Insights Dashboard (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#447F98]" />
              <h2 className="text-base sm:text-lg font-bold text-[#243D49] dark:text-[#D6EBF3]">
                Financial Pulse & Pacing
              </h2>
            </div>
            <span className="text-xs text-[#526C78] dark:text-[#83BDCF] font-medium">
              Currency: {currency}
            </span>
          </div>

          <FinancialInsightsSection onPromptSelect={handlePromptSelect} />

          {/* Quick Consultation Suggestions Card */}
          <div className="bg-gradient-to-br from-white to-[#D6EBF3]/60 dark:from-[#1B3541] dark:to-[#447F98] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#447F98]" /> Popular Advisory Topics
            </h4>
            <div className="space-y-2">
              {[
                { title: 'Budget Pacing Check', query: 'Am I on track with my monthly budget?' },
                { title: 'Reduce Discretionary Spend', query: 'How can I trim 15% from my flexible expenses?' },
                { title: 'Subscription Audit', query: 'Review my recurring subscriptions and memberships' },
                { title: 'End-of-Month Projection', query: 'What is my projected total spend at the end of the month?' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptSelect(item.query)}
                  className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-[#203D49] hover:bg-[#B9D9E1]/50 dark:hover:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] transition-all text-xs font-medium text-[#243D49] dark:text-[#D6EBF3] flex items-center justify-between group shadow-2xs"
                >
                  <span>{item.title}</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#447F98] group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: SpendWise AI Interactive Chat Box (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-[#243D49] dark:text-[#D6EBF3]">
                Interactive AI Advisory Chat
              </h2>
            </div>
            <span className="text-xs text-[#526C78] dark:text-[#83BDCF]">
              Always-on Assistant
            </span>
          </div>

          <AIChatBox
            key={selectedPrompt}
            height="h-[580px] sm:h-[620px]"
            className="shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}

