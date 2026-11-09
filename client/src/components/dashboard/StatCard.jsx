import React from 'react';
import Card from '../common/Card';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'positive',
  iconBgColor = 'bg-[#B9D9E1]/30 text-[#447F98] dark:bg-[#345968]/50 dark:text-[#83BDCF]',
}) {
  return (
    <Card className="hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#758D97] dark:text-[#91ADB8]">
            {title}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#243D49] dark:text-[#EAF4F7] mt-1.5 tracking-tight">
            {value}
          </h2>
          {subtitle && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend && (
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    trendType === 'positive'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : trendType === 'negative'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-stone-500/10 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {trend}
                </span>
              )}
              <span className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
                {subtitle}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ${iconBgColor} shrink-0`}>
            <Icon size={22} strokeWidth={2.2} />
          </div>
        )}
      </div>
    </Card>
  );
}
