import { SURFACE_CLASS, SURFACE_SHADOW } from '@/components/ui/Surface';

export const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
// 디자인 시스템 Step 5(P2-16) — 값 자체는 src/components/ui/Surface.tsx
// 한 곳에서만 관리(MG·우리페이 스타일 — border 없음, 그림자만). 이
// 재노출은 기존 호출부(`CARD`/`CARD_SHADOW` import)를 하나도 안
// 건드리려고 남겨둠.
export const CARD = SURFACE_CLASS.plain;
export const CARD_SHADOW: React.CSSProperties = SURFACE_SHADOW.plain;
