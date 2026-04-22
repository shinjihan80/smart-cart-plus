'use client';

import { Search } from 'lucide-react';

/**
 * 페이지 헤더에 놓는 명령 팔레트 트리거.
 * 데스크탑에선 ⌘K kbd 힌트 함께 노출.
 */
export default function PaletteButton({ className = '' }: { className?: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('nemoa:open-palette'))}
      aria-label="빠른 탐색 열기 (⌘K)"
      title="빠른 탐색 (⌘K)"
      className={`relative flex items-center gap-1 pl-2 pr-2.5 h-8 rounded-full bg-gray-100 hover:bg-brand-primary/10 text-gray-500 hover:text-brand-primary transition-colors shrink-0 ${className}`}
    >
      <Search size={14} />
      <kbd className="hidden sm:inline-flex items-center text-xs text-gray-400 bg-white border border-gray-200 rounded px-1 py-0 font-mono pointer-events-none">⌘K</kbd>
    </button>
  );
}
