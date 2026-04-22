'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Card 시스템 — 커머스 앱 스타일 (롯데면세점·SSG·인터파크 참고)
 *
 * 원칙: 모든 카드는 흰 바탕·얇은 경계선·미묘한 그림자로 통일.
 * 강약은 카드가 아닌 "내부 콘텐츠"(이모지·색·폰트 크기)로 표현.
 *
 * variant는 padding·rounded 스케일만 조정:
 *   primary  → 기본 (p-5)
 *   compact  → 작은 padding (p-4, 그리드용)
 *   (accent·warning·ghost variant는 폐지 — 모두 primary로 흡수)
 */
export type CardVariant = 'primary' | 'accent' | 'warning' | 'ghost' | 'compact';

export const CARD_VARIANTS: Record<CardVariant, string> = {
  primary: 'bg-white border border-gray-100 rounded-[20px] p-5',
  compact: 'bg-white border border-gray-100 rounded-[16px] p-4',
  // 하위 호환: 아래 3종은 primary와 동일 스타일로 alias
  accent:  'bg-white border border-gray-100 rounded-[20px] p-5',
  warning: 'bg-white border border-gray-100 rounded-[20px] p-5',
  ghost:   'bg-white border border-gray-100 rounded-[20px] p-5',
};

const CARD_SHADOW_COMMON: React.CSSProperties = {
  boxShadow: '0 2px 12px -4px rgba(0,0,0,0.05)',
};

export const CARD_SHADOWS: Record<CardVariant, React.CSSProperties> = {
  primary: CARD_SHADOW_COMMON,
  compact: CARD_SHADOW_COMMON,
  accent:  CARD_SHADOW_COMMON,
  warning: CARD_SHADOW_COMMON,
  ghost:   CARD_SHADOW_COMMON,
};

// 하위 호환 — 기존 직접 사용처가 있을 수 있음 (primary와 동일)
export const CARD = CARD_VARIANTS.primary;
export const CARD_SHADOW = CARD_SHADOWS.primary;

export const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };

// ─── Widget 컴포넌트 ──────────────────────────────────────────────────────────

interface WidgetProps {
  children:   ReactNode;
  className?: string;
  index?:     number;
  variant?:   CardVariant;
  /** hover 시 살짝 확대 애니메이션. compact·ghost는 자동 off */
  interactive?: boolean;
}

export function Widget({
  children,
  className    = '',
  index        = 0,
  variant      = 'primary',
  interactive,
}: WidgetProps) {
  const isInteractive = interactive ?? (variant !== 'ghost' && variant !== 'compact');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: index * 0.06 }}
      {...(isInteractive && {
        whileHover: { scale: 1.015 },
        whileTap:   { scale: 0.985 },
      })}
      className={`${CARD_VARIANTS[variant]} ${className}`}
      style={CARD_SHADOWS[variant]}
    >
      {children}
    </motion.div>
  );
}

// ─── 스켈레톤 ────────────────────────────────────────────────────────────────

export function HomeSkeleton() {
  return (
    <div className="px-5 py-6 flex flex-col gap-4">
      <div className="h-[180px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[120px] rounded-[28px] bg-gray-100 animate-pulse" />
      <div className="h-[160px] rounded-[28px] bg-gray-100 animate-pulse" />
      <div className="h-[140px] rounded-[28px] bg-gray-100 animate-pulse" />
    </div>
  );
}
