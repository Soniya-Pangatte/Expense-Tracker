import React, { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export default function DashboardShowcaseSection() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section id="dashboard-preview" className="relative min-h-screen py-24 px-4 sm:px-8 z-10 flex flex-col justify-center pointer-events-auto">
      <div className="max-w-6xl mx-auto w-full space-y-10">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B9D9E1]/80 dark:bg-[#203D49] border border-[#C4DCE3]/40 text-[#243D49] dark:text-[#D6EBF3] text-xs font-mono font-bold">
            TERMINAL // PRODUCT PREVIEW
          </div>
          <h2 className="font-space text-3xl sm:text-5xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Essential Financial{' '}
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#C4DCE3] via-[#36687D] to-[#447F98] dark:from-[#C4DCE3] dark:via-[#C4DCE3] dark:to-[#D6EBF3]">
              Connectivity
            </span>
          </h2>
          <p className="text-sm text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
            A high-performance modern console built for rapid expense logging, visual budget pacing, and autonomous intelligence.
          </p>
        </div>

        {/* Dashboard Preview Shell with Glowing Turquoise Border Arc */}
        <div className="relative rounded-3xl p-0.5 bg-gradient-to-b from-[#C4DCE3] via-[#C4DCE3]/60 to-transparent shadow-[0_4px_35px_rgba(113,201,206,0.3)]">
          {/* Main Console Surface */}
          <div className="bg-white/95 dark:bg-[#1B3541]/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 border border-[#C4DCE3] dark:border-[#365765] overflow-hidden space-y-6">
            {/* Terminal Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#C4DCE3] dark:border-[#365765]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="font-mono text-xs font-bold text-[#243D49] dark:text-[#D6EBF3] tracking-wider">
                  SPENDWISE_OS :: v2.4
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#B9D9E1] dark:bg-[#203D49] text-[#243D49] dark:text-[#83BDCF] border border-[#C4DCE3]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CONNECTED
                </span>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 bg-[#D6EBF3] dark:bg-[#203D49] p-1 rounded-xl border border-[#C4DCE3] dark:border-[#365765]">
                {['Overview', 'Transactions', 'Budgets', 'AI Advisor'].map((tab) => {
                  const key = tab.toLowerCase().replace(' ', '-');
                  const isActive = activeTab === key || (key === 'overview' && activeTab === 'overview');
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(key)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        isActive
                          ? 'bg-[#447F98] text-[#D6EBF3] shadow-xs'
                          : 'text-[#526C78] dark:text-[#EAF4F7] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-[#D6EBF3]'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dashboard Inner Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Metric Cards & Monthly Budget Pacing (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Total Balance Card */}
                <div className="bg-[#D6EBF3]/50 dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-[#526C78] dark:text-[#83BDCF] mb-2 font-mono font-semibold">
                    <span>NET SAVINGS (NOVEMBER)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-bold">
                      <TrendingUp className="w-3.5 h-3.5" /> +28.4%
                    </span>
                  </div>
                  <div className="text-3xl font-black text-[#243D49] dark:text-[#D6EBF3] font-space tracking-tight">
                    ₹68,450.00
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs font-mono font-semibold">
                    <div className="text-[#526C78] dark:text-[#83BDCF]">
                      In: <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹1,12,000</span>
                    </div>
                    <div className="text-[#526C78] dark:text-[#83BDCF]">
                      Out: <span className="text-rose-500 font-bold">₹43,550</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Budget Gauge Card */}
                <div className="bg-[#D6EBF3]/50 dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="font-mono text-[#526C78] dark:text-[#83BDCF]">MONTHLY BUDGET PACING</span>
                    <span className="text-[#447F98] font-extrabold font-mono">76% USED</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] font-space">
                      ₹38,200 <span className="text-xs text-[#526C78] dark:text-[#83BDCF] font-normal">/ ₹50,000 cap</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ₹11,800 left
                    </span>
                  </div>
                  {/* Pacing progress bar */}
                  <div className="w-full bg-[#447F98] dark:bg-[#365765] h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#C4DCE3] to-[#C4DCE3] h-full rounded-full w-[76%]" />
                  </div>
                  <p className="text-[11px] text-[#526C78] dark:text-[#83BDCF]">
                    At current daily burn rate (₹1,273/day), you will finish within budget.
                  </p>
                </div>
              </div>

              {/* Right Column: Recent Transactions Table & AI Banner (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#D6EBF3]/50 dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#526C78] dark:text-[#83BDCF] pb-2 border-b border-[#C4DCE3] dark:border-[#365765]">
                    <span>REAL-TIME TRANSACTION STREAM</span>
                    <span className="text-[#243D49] dark:text-[#83BDCF]">CURRENCY: INR (₹)</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      {
                        name: 'TechCorp Monthly Salary',
                        cat: 'Salary & Earnings',
                        amt: '+₹5,200.00',
                        date: 'Today',
                        isIncome: true,
                      },
                      {
                        name: 'Apartment Lease Rent',
                        cat: 'Housing & Rent',
                        amt: '-₹1,350.00',
                        date: 'Yesterday',
                        isIncome: false,
                      },
                      {
                        name: 'Whole Foods Market',
                        cat: 'Groceries & Food',
                        amt: '-₹142.60',
                        date: 'Nov 07',
                        isIncome: false,
                      },
                      {
                        name: 'Metronet High-Speed Fiber',
                        cat: 'Utilities & Bills',
                        amt: '-₹79.99',
                        date: 'Nov 05',
                        isIncome: false,
                      },
                    ].map((tx, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-[#1B3541]/80 border border-[#C4DCE3] dark:border-[#365765] text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              tx.isIncome
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-[#B9D9E1] dark:bg-[#1B3541] text-[#243D49] dark:text-[#83BDCF]'
                            }`}
                          >
                            {tx.isIncome ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">{tx.name}</div>
                            <div className="text-[10px] text-[#526C78] dark:text-[#83BDCF]">{tx.cat}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-mono font-bold ${
                              tx.isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#243D49] dark:text-[#D6EBF3]'
                            }`}
                          >
                            {tx.amt}
                          </div>
                          <div className="text-[10px] text-[#526C78] dark:text-[#83BDCF]">{tx.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insight Chip in Aqua Theme */}
                <div className="p-3.5 rounded-xl bg-[#B9D9E1]/80 dark:bg-[#203D49] border border-[#C4DCE3]/50 flex items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#447F98] flex-shrink-0 animate-pulse" />
                    <span className="text-[#243D49] dark:text-[#D6EBF3] leading-tight font-medium">
                      <strong className="font-bold">SpendWise AI:</strong> Trimming 15% from discretionary dining frees up <strong className="font-bold">₹4,200</strong> this month.
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#243D49] dark:text-[#83BDCF] tracking-wider uppercase flex-shrink-0 bg-[#B9D9E1]/25 px-2 py-0.5 rounded-full border border-[#C4DCE3]/40">
                    ADVICE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
