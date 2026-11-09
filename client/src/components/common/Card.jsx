import React from 'react';

export default function Card({ children, className = '', title, subtitle, action, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-card transition-all duration-200 ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4DCE3] dark:border-[#365765]">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-[#243D49] dark:text-[#EAF4F7]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#526C78] dark:text-[#C0D5DC] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
