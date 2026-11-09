import React from 'react';
import { Twitter, Linkedin, Github } from 'lucide-react';

export default function SocialDock() {
  return (
    <div className="fixed right-6 sm:right-10 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center gap-2.5">
      <a
        href="https://twitter.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Twitter / X"
        className="w-9 h-9 rounded-xl bg-white/85 dark:bg-[#203D49]/85 hover:bg-[#B9D9E1] dark:hover:bg-[#365765] border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] flex items-center justify-center text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-white shadow-2xs hover:shadow-xs transition-all"
      >
        <Twitter className="w-3.5 h-3.5" />
      </a>
      <a
        href="https://linkedin.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        className="w-9 h-9 rounded-xl bg-white/85 dark:bg-[#203D49]/85 hover:bg-[#B9D9E1] dark:hover:bg-[#365765] border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] flex items-center justify-center text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-white shadow-2xs hover:shadow-xs transition-all"
      >
        <Linkedin className="w-3.5 h-3.5" />
      </a>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className="w-9 h-9 rounded-xl bg-white/85 dark:bg-[#203D49]/85 hover:bg-[#B9D9E1] dark:hover:bg-[#365765] border border-[#C4DCE3] dark:border-[#365765] hover:border-[#C4DCE3] flex items-center justify-center text-[#526C78] dark:text-[#83BDCF] hover:text-[#243D49] dark:hover:text-white shadow-2xs hover:shadow-xs transition-all"
      >
        <Github className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
