import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export default function LandingCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#B9D9E1]/40 via-white to-[#D6EBF3]/60 dark:from-[#447F98] dark:via-[#1B3541] dark:to-[#447F98] border border-[#C4DCE3] dark:border-[#365765] text-center shadow-card overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-[#B9D9E1]/15 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
              Take Control of Your Finances Today.
            </h2>

            <p className="text-sm sm:text-base text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
              Start managing your money smarter with SpendWise.
            </p>

            <div className="pt-2 flex justify-center">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate('/register')}
                className="px-7 py-3 text-base font-semibold shadow-md"
              >
                Create Your Free Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
