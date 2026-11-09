import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Wallet, CreditCard, Coins, ArrowUpRight } from 'lucide-react';
import Button from '../common/Button';

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative pt-10 pb-16 md:pt-20 md:pb-28 overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-b from-[#C4DCE3]/30 via-[#C4DCE3]/15 to-transparent pointer-events-none -z-10 blur-3xl rounded-full"></div>
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-[#447F98]/10 dark:bg-[#83BDCF]/25 pointer-events-none -z-10 blur-3xl rounded-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT SIDE: Typography & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Small Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B9D9E1]/40 dark:bg-[#345968]/40 border border-[#C4DCE3] dark:border-[#365765] text-xs font-bold tracking-wider uppercase text-[#243D49] dark:text-[#83BDCF]">
              <Sparkles size={13} className="text-[#447F98] dark:text-[#83BDCF]" />
              <span>Smart Personal Finance</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#243D49] dark:text-[#EAF4F7] tracking-tight leading-[1.12]">
              Manage Money.{' '}
              <span className="text-[#447F98] dark:text-[#83BDCF] underline decoration-[#629BB5] decoration-wavy decoration-2">Live Better.</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#526C78] dark:text-[#C0D5DC] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Track expenses, manage budgets and understand your spending – all in one place.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-3.5 text-base font-medium"
              >
                Log In
              </Button>
            </div>
          </div>

          {/* RIGHT SIDE: Reserved 3D Interactive Scene Placeholder */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div
              id="interactive-3d-scene-container"
              className="relative w-full max-w-[420px] aspect-square rounded-3xl bg-gradient-to-br from-white via-[#D6EBF3] to-[#B9D9E1] dark:from-[#203D49]/90 dark:via-[#1B3541]/80 dark:to-[#152B35]/80 border border-[#C4DCE3] dark:border-[#365765] p-6 shadow-2xl flex items-center justify-center backdrop-blur-sm group select-none"
            >
              {/* Inner ambient ring */}
              <div className="absolute inset-4 rounded-2xl border border-dashed border-[#C4DCE3]/60 dark:border-[#365765]/30 pointer-events-none"></div>

              {/* Floating Element 1: Fintech Glass Card */}
              <div className="absolute w-64 sm:w-72 h-40 rounded-2xl bg-gradient-to-tr from-[#243D49] via-[#447F98] to-[#629BB5] text-white p-5 shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500 ease-out z-20 flex flex-col justify-between border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wallet size={16} className="text-[#B9D9E1]" />
                    <span className="text-xs font-bold tracking-widest uppercase text-white">SpendWise</span>
                  </div>
                  <CreditCard size={20} className="text-white/80" />
                </div>
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wider font-mono">Balance</div>
                  <div className="text-xl font-extrabold tracking-tight">₹1,24,500.00</div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-white/80">
                  <span>•••• 4829</span>
                  <span>11/29</span>
                </div>
              </div>

              {/* Floating Element 2: Digital Wallet Pill */}
              <div className="absolute -top-3 -right-3 sm:top-4 sm:right-2 z-30 bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl px-3.5 py-2.5 shadow-lg flex items-center gap-2.5 animate-bounce [animation-duration:4s]">
                <div className="w-8 h-8 rounded-xl bg-[#B9D9E1]/40 dark:bg-[#345968]/50 text-[#243D49] dark:text-[#83BDCF] flex items-center justify-center">
                  <Wallet size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-[#526C78] dark:text-[#C0D5DC]">Safe Budget</p>
                  <p className="text-xs font-bold text-[#329B78]">On Track</p>
                </div>
              </div>

              {/* Floating Element 3: Floating Coin Left */}
              <div className="absolute -bottom-2 -left-2 sm:bottom-6 sm:left-4 z-30 bg-gradient-to-br from-[#629BB5] to-[#447F98] text-white rounded-full w-12 h-12 shadow-xl flex items-center justify-center font-extrabold text-sm border-2 border-white dark:border-[#203D49] animate-pulse">
                <span className="font-serif">₹</span>
              </div>

              {/* Floating Element 4: Floating Coin Top Left */}
              <div className="absolute top-6 left-6 z-10 bg-gradient-to-br from-[#447F98] to-[#629BB5] text-white rounded-full w-9 h-9 shadow-lg flex items-center justify-center font-bold text-xs border border-white/60">
                <Coins size={14} />
              </div>

              {/* Future 3D Placeholder Tag */}
              <div className="absolute bottom-3 right-4 z-30 text-[10px] font-mono text-[#758D97] dark:text-[#91ADB8] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#447F98] dark:bg-[#83BDCF] animate-ping"></span>
                <span>Interactive 3D Scene</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
