'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

/**
 * 검색 페이지(/search)로 이동하는 버튼.
 *
 * variant
 *  - icon (기본): 헤더용 검색 아이콘만
 *  - bar: 상단 큰 검색 바 형태
 *
 * 클릭 시 팝업이 아닌 별도 페이지로 전환 (모바일 검색 표준 패턴).
 */
interface PaletteButtonProps {
  className?: string;
  variant?:   'icon' | 'bar';
}

export default function PaletteButton({ className = '', variant = 'icon' }: PaletteButtonProps) {
  if (variant === 'bar') {
    return (
      <Link
        href="/search"
        aria-label="검색"
        className={`w-full flex items-center gap-2 px-4 h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors ${className}`}
      >
        <Search size={16} className="text-gray-400 shrink-0" />
        <span className="flex-1 text-sm text-gray-400 truncate text-left">
          레시피·제철·아이템 검색
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/search"
      aria-label="검색"
      title="검색"
      className={`w-10 h-10 text-brand-ink hover:text-brand-primary transition-colors flex items-center justify-center ${className}`}
    >
      <Search size={22} strokeWidth={2} />
    </Link>
  );
}
