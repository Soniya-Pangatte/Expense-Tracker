import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#447F98] hover:bg-[#36687D] text-[#FFFFFF] font-semibold dark:bg-[#83BDCF] dark:hover:bg-[#95CCDC] dark:text-[#152B35] focus:ring-[#447F98] dark:focus:ring-[#83BDCF] shadow-sm',
    secondary:
      'bg-[#B9D9E1]/40 hover:bg-[#B9D9E1]/70 text-[#243D49] font-medium border border-[#C4DCE3] dark:bg-[#345968]/50 dark:hover:bg-[#345968]/80 dark:text-[#EAF4F7] dark:border-[#365765] focus:ring-[#629BB5]',
    outline:
      'border border-[#C4DCE3] dark:border-[#365765] bg-transparent hover:bg-[#B9D9E1]/30 dark:hover:bg-[#284956]/50 text-[#243D49] dark:text-[#EAF4F7] focus:ring-[#447F98] dark:focus:ring-[#83BDCF]',
    ghost:
      'bg-transparent hover:bg-[#B9D9E1]/30 dark:hover:bg-[#284956]/40 text-[#526C78] hover:text-[#243D49] dark:text-[#C0D5DC] dark:hover:text-[#EAF4F7] focus:ring-transparent',
    danger:
      'bg-[#C87575]/10 hover:bg-[#C87575]/20 text-[#C87575] dark:text-[#C87575] border border-[#C87575]/30 dark:border-[#C87575]/40 focus:ring-[#C87575]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
        </>
      )}
    </button>
  );
}
