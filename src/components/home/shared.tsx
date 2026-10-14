'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { SURFACE_CLASS, SURFACE_SHADOW } from '@/components/ui/Surface';

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
 *
 * 디자인 시스템 Step 5(P2-16) — 값 자체는 src/components/ui/Surface.tsx
 * 한 곳에서만 관리(이 파일의 'plain'='panel', 'compact'='chip'에 대응).
 * `Widget`/`CardVariant` API는 home/ 전역에서 이미 널리 쓰여 그대로
 * 유지 — 재노출만 Surface 기준으로 바꿔 복제를 없앤다.
 */
export type CardVariant = 'primary' | 'accent' | 'warning' | 'ghost' | 'compact';

export const CARD_VARIANTS: Record<CardVariant, string> = {
  primary: SURFACE_CLASS.plain,
  compact: SURFACE_CLASS.compact,
  accent:  SURFACE_CLASS.plain,
  warning: SURFACE_CLASS.plain,
  ghost:   SURFACE_CLASS.plain,
};

export const CARD_SHADOWS: Record<CardVariant, React.CSSProperties> = {
  primary: SURFACE_SHADOW.plain,
  compact: SURFACE_SHADOW.compact,
  accent:  SURFACE_SHADOW.plain,
  warning: SURFACE_SHADOW.plain,
  ghost:   SURFACE_SHADOW.plain,
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
      <div className="h-[180px] rounded-card bg-gray-100 animate-pulse" />
      <div className="h-[120px] rounded-card bg-gray-100 animate-pulse" />
      <div className="h-[160px] rounded-card bg-gray-100 animate-pulse" />
      <div className="h-[140px] rounded-card bg-gray-100 animate-pulse" />
    </div>
  );
}
