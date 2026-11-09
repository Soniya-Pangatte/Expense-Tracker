import React from 'react';
import { CreditCard, PieChart, BarChart3, Check } from 'lucide-react';

const features = [
  {
    icon: CreditCard,
    title: 'Expense Tracking',
    points: [
      'Record and organize daily expenses.',
      'Track transaction history.',
    ],
  },
  {
    icon: PieChart,
    title: 'Budget Management',
    points: [
      'Set monthly budgets.',
      'Monitor spending and remaining balances.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Financial Analytics',
    points: [
      'Understand spending patterns.',
      'View category-wise expenses and reports.',
    ],
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-16 md:py-24 bg-white/70 dark:bg-[#1B3541]/60 border-y border-[#C4DCE3] dark:border-[#365765]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Everything You Need to Manage Money
          </h2>
        </div>

        {/* 3 Feature Cards in One Row on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] shadow-card hover:shadow-card-hover hover:border-[#C4DCE3] transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#B9D9E1]/20 text-[#243D49] dark:text-[#83BDCF] flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
                    <Icon size={24} strokeWidth={2.2} />
                  </div>

                  <h3 className="text-xl font-bold text-[#243D49] dark:text-[#D6EBF3] mb-4 group-hover:text-[#447F98] transition-colors">
                    {feat.title}
                  </h3>

                  <ul className="space-y-2.5">
                    {feat.points.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5 text-sm text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
                        <Check size={16} className="text-[#447F98] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
