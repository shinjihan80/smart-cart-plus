'use client';

import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

/**
 * 디자인 시스템 Step 5(docs/design-system-scope.md, P2-16) — `CARD`
 * 상수가 fridge/closet/mypage/home 4곳 `shared.ts`에 각각 복제돼
 * 있어, 한쪽을 고치면 나머지 세 곳은 그대로 남는 위험이 있었다(실측:
 * radius 32px+테두리 vs 24px+테두리 없음, 그림자도 서로 다름).
 *
 * 실제로는 두 가지 스타일이 공존한다 — `bordered`(fridge·closet,
 * 큰 모서리+옅은 테두리) / `plain`(mypage·home, 작은 모서리+테두리
 * 없음). 이 둘을 하나로 합치는 건 디자인 판단이라 이번엔 건드리지
 * 않고, "복제된 정의"만 여기 한 곳으로 모은다 — 4개 shared.ts는
 * 이 값을 재노출만 하도록 바꿔, 기존 `CARD`/`CARD_SHADOW` import
 * 경로를 쓰는 수십 곳의 호출부는 전혀 안 건드려도 된다.
 */
export type SurfaceVariant = 'bordered' | 'plain' | 'compact';

export const SURFACE_CLASS: Record<SurfaceVariant, string> = {
  bordered: 'bg-white rounded-card border border-gray-50 p-5',
  plain:    'bg-white rounded-panel p-5',
  compact:  'bg-white rounded-chip p-4',
};

const SHADOW_BORDERED: CSSProperties = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };
const SHADOW_PLAIN: CSSProperties = { boxShadow: '0 6px 16px -8px rgba(31, 31, 46, 0.08), 0 2px 4px -2px rgba(31, 31, 46, 0.04)' };

export const SURFACE_SHADOW: Record<SurfaceVariant, CSSProperties> = {
  bordered: SHADOW_BORDERED,
  plain:    SHADOW_PLAIN,
  compact:  SHADOW_PLAIN,
};

export const surfaceSpringTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };

interface SurfaceProps {
  variant?:   SurfaceVariant;
  className?: string;
  children:   ReactNode;
  /** false면 진입 애니메이션 없이 정적으로 렌더 */
  animate?:   boolean;
  index?:     number;
}

/** 새 코드에서 카드를 만들 때 쓸 컴포넌트. 기존 CARD 상수 호출부는 안 바꿔도 됨. */
export function Surface({ variant = 'plain', className = '', children, animate = true, index = 0 }: SurfaceProps) {
  const cls = `${SURFACE_CLASS[variant]} ${className}`;
  if (!animate) {
    return <div className={cls} style={SURFACE_SHADOW[variant]}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...surfaceSpringTransition, delay: index * 0.06 }}
      className={cls}
      style={SURFACE_SHADOW[variant]}
    >
      {children}
    </motion.div>
  );
}
