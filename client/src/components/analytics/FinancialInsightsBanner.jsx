import React from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import Card from '../common/Card';

export default function FinancialInsightsBanner({ insights = [] }) {
  if (insights.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-500 shrink-0" />;
      default:
        return <Sparkles size={18} className="text-[#447F98] dark:text-[#629BB5] shrink-0" />;
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200';
      default:
        return 'bg-[#447F98]/10 border-[#447F98]/20 text-[#243D49] dark:text-[#D6EBF3]';
    }
  };

  return (
    <Card
      title="Intelligent Financial Insights"
      subtitle="Data-driven observations from your transactions in this timeframe"
      className="bg-gradient-to-br from-blue-500/5 via-transparent to-transparent"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${getBadgeStyle(
              ins.type
            )}`}
          >
            <div className="mt-0.5">{getIcon(ins.type)}</div>
            <div>
              <h5 className="text-xs font-bold mb-0.5">{ins.title}</h5>
              <p className="text-[11px] opacity-90 leading-relaxed">{ins.text}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

