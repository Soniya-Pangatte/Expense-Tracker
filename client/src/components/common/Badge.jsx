import React from 'react';

export default function Badge({ children, variant = 'neutral', size = 'sm', className = '' }) {
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
  };

  const variantStyles = {
    neutral: 'bg-[#B9D9E1] text-[#243D49] dark:bg-[#365765] dark:text-[#D6EBF3]',
    primary: 'bg-[#B9D9E1]/20 text-[#243D49] dark:bg-[#B9D9E1]/25 dark:text-[#D6EBF3] font-medium',
    income: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    expense: 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    warning: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    info: 'bg-[#B9D9E1]/30 text-[#243D49] dark:bg-[#B9D9E1]/20 dark:text-[#83BDCF]',
  };

  return (
    <span className={`inline-flex items-center rounded-full transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
