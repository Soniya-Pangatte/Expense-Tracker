import React from 'react';
import { Html } from '@react-three/drei';

export default function SceneLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center gap-3 p-4 select-none pointer-events-none">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-[#C4DCE3]/30 rounded-xl" />
          <div className="absolute inset-0 border-2 border-t-[#447F98] border-r-[#629BB5] border-b-transparent border-l-transparent rounded-xl animate-spin" />
          <div className="w-3 h-3 rounded-xs bg-[#447F98] shadow-[0_0_12px_#447F98] animate-pulse" />
        </div>
        <div className="text-[11px] font-mono tracking-widest text-[#243D49] dark:text-[#EAF4F7] uppercase">
          Initializing 3D Engine...
        </div>
      </div>
    </Html>
  );
}

