'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Card Variant 시스템
 *
 * 모든 홈 카드가 같은 톤이면 시각 위계가 무너지므로 4단계 톤 차이:
 *   hero     → 브랜드 그라디언트, 시선 최우선 (전용 HeroMessage만 사용)
 *   primary  → 흰 배경, 중요 정보 (기본값)
 *   accent   → 브랜드 색 5% 틴트, 강조
 *   warning  → 경고 색 5% 틴트, 임박 정보
 *   ghost    → 투명, 경계선만, 보조 정보
 *   compact  → 작은 padding, 그리드 2열용
 */
export type CardVariant = 'primary' | 'accent' | 'warning' | 'ghost' | 'compact';

export const CARD_VARIANTS: Record<CardVariant, string> = {
  primary: 'bg-white border border-gray-50 rounded-[28px] p-5',
  accent:  'bg-brand-primary/5 border border-brand-primary/15 rounded-[28px] p-5',
  warning: 'bg-brand-warning/5 border border-brand-warning/15 rounded-[28px] p-5',
  ghost:   'bg-transparent border border-gray-100 rounded-[24px] p-4',
  compact: 'bg-white border border-gray-50 rounded-[20px] p-3',
};

export const CARD_SHADOWS: Record<CardVariant, React.CSSProperties> = {
  primary: { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' },
  accent:  { boxShadow: '0 10px 40px -10px rgba(79,70,229,0.10)' },
  warning: { boxShadow: '0 10px 40px -10px rgba(244,63,94,0.10)' },
  ghost:   {},
  compact: { boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)' },
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
