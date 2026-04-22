'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 홈 페이지의 섹션 그룹 헤더.
 * 시선 계층: 큰 이모지 + 굵은 제목 + 얇은 부제.
 *
 * 두 가지 모드:
 *  - 항상 펼침 (기본)
 *  - 접기 가능 (`collapsible`)
 *
 * 시각적 강약을 만들기 위해 페이지 내 섹션 수는 3~4개로 제한.
 */

/**
 * tone — 섹션 이모지·제목 컬러. 섹션의 역할에 따라 선택.
 *   default → 중립 회색
 *   warning → 긴급·임박 (경고 강조)
 *   accent  → 브랜드 강조 (추천·인사이트)
 *   muted   → 톤 다운 (보조 정보·기록)
 */
type SectionTone = 'default' | 'warning' | 'accent' | 'muted';

const TONE_STYLES: Record<SectionTone, { title: string; icon: string }> = {
  default: { title: 'text-gray-900',       icon: '' },
  warning: { title: 'text-brand-warning',  icon: 'drop-shadow-[0_0_12px_rgba(244,63,94,0.25)]' },
  accent:  { title: 'text-brand-primary',  icon: '' },
  muted:   { title: 'text-gray-500',       icon: 'grayscale opacity-80' },
};

interface SectionHeaderProps {
  icon:         string;        // 이모지 (한 글자 권장)
  title:        string;        // 섹션 이름 — text-lg font-bold
  subtitle?:    string;        // 부제 — text-sm text-gray-500
  children:     ReactNode;
  collapsible?: boolean;       // 접기 가능
  defaultOpen?: boolean;       // collapsible 시 기본 열림 상태
  tone?:        SectionTone;   // 시선 톤
}

export default function SectionHeader({
  icon,
  title,
  subtitle,
  children,
  collapsible = false,
  defaultOpen = true,
  tone        = 'default',
}: SectionHeaderProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toneStyle = TONE_STYLES[tone];

  const header = (
    <div className="flex items-center gap-3 mb-4">
      <span className={`text-2xl leading-none shrink-0 ${toneStyle.icon}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <h2 className={`text-lg font-bold tracking-tight leading-none ${toneStyle.title}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {collapsible && (
        <ChevronDown
          size={18}
          className={`text-gray-300 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      )}
    </div>
  );

  if (!collapsible) {
    return (
      <section className="mt-8 first:mt-4">
        {header}
        <div className="flex flex-col gap-4">{children}</div>
      </section>
    );
  }

  return (
    <section className="mt-8 first:mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left hover:bg-gray-50/50 rounded-2xl -mx-2 px-2 py-1 transition-colors"
        aria-expanded={open}
      >
        {header}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
