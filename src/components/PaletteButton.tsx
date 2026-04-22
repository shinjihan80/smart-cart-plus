'use client';

import { Search } from 'lucide-react';

/**
 * 페이지 헤더에 놓는 명령 팔레트 트리거.
 *
 * variant
 *  - icon (기본): 둥근 사각형 아이콘 버튼 — 최소한의 공간
 *  - bar: 상단 큰 검색 바 형태 — 홈에서 시선 유도
 */
interface PaletteButtonProps {
  className?: string;
  variant?:   'icon' | 'bar';
}

export default function PaletteButton({ className = '', variant = 'icon' }: PaletteButtonProps) {
  function open() {
    window.dispatchEvent(new CustomEvent('nemoa:open-palette'));
  }

  if (variant === 'bar') {
    return (
      <button
        onClick={open}
        aria-label="검색 (⌘K)"
        className={`w-full flex items-center gap-2 px-4 h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors text-left ${className}`}
      >
        <Search size={16} className="text-gray-400 shrink-0" />
        <span className="flex-1 text-sm text-gray-400 truncate">
          레시피·제철·아이템 검색
        </span>
        <kbd className="hidden sm:inline-flex items-center text-xs text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono pointer-events-none">⌘K</kbd>
      </button>
    );
  }

  return (
    <button
      onClick={open}
      aria-label="검색 (⌘K)"
      title="검색 (⌘K)"
      className={`w-10 h-10 text-gray-900 hover:text-brand-primary transition-colors shrink-0 flex items-center justify-center ${className}`}
    >
      <Search size={22} strokeWidth={2} />
    </button>
  );
}
