import React, { useEffect, useState } from 'react';

export default function ScrollProgressIndicator({ progressRef }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let animId;
    const update = () => {
      if (progressRef && progressRef.current !== undefined) {
        setPercent(Math.round(progressRef.current * 100));
      }
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [progressRef]);

  // Generate 8 vertical tick marks
  const ticks = [0, 1, 2, 3, 4, 5, 6, 7];
  const activeCount = Math.min(8, Math.max(1, Math.round((percent / 100) * 8)));

  return (
    <div className="fixed left-6 sm:left-10 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center gap-2 select-none pointer-events-none">
      <span className="text-[#447F98] text-xs font-mono font-bold">[</span>
      <div className="flex flex-col gap-1 py-1">
        {ticks.map((idx) => {
          const isActive = idx < activeCount;
          return (
            <div
              key={idx}
              className={`w-1 transition-all duration-300 rounded-full ${
                isActive
                  ? 'h-3 bg-[#447F98] dark:bg-[#83BDCF] shadow-[0_0_8px_rgba(68,127,152,0.6)]'
                  : 'h-1.5 bg-[#B9D9E1]/50 dark:bg-[#365765]'
              }`}
            />
          );
        })}
      </div>
      <span className="text-[#447F98] dark:text-[#83BDCF] text-xs font-mono font-bold">]</span>
      <span className="text-[11px] font-mono tracking-wider font-bold text-[#243D49] dark:text-[#EAF4F7] pt-1">
        {percent}%
      </span>
    </div>
  );
}
