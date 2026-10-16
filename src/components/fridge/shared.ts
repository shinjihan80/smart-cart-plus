import { Snowflake, Thermometer, Package } from 'lucide-react';
import { SURFACE_CLASS, SURFACE_SHADOW } from '@/components/ui/Surface';

export const springTransition = { type: 'spring' as const, stiffness: 360, damping: 28 };
// 디자인 시스템 Step 5(P2-16) — 값 자체는 src/components/ui/Surface.tsx
// 한 곳에서만 관리. 이 재노출은 기존 호출부(`CARD`/`CARD_SHADOW` import)를
// 하나도 안 건드리려고 남겨둠.
export const CARD = SURFACE_CLASS.bordered;
export const CARD_SHADOW = SURFACE_SHADOW.bordered;

export const STORAGE_ICON = { 냉장: Snowflake, 냉동: Thermometer, 실온: Package } as const;
// P2-56 — "실온" 보관법 칩이 amber였는데, 이 카드 안 D배지(caution·
// expiry-soon)와 같은 따뜻한 색 계열이라 "보관법"과 "임박 상태"가
// 섞여 보였다. 범주 정보는 상태색을 침범하지 않는 중립으로.
export const STORAGE_STYLE = {
  냉장: { bg: 'bg-sky-50',    text: 'text-sky-600',    label: '냉장' },
  냉동: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: '냉동' },
  실온: { bg: 'bg-zinc-100',  text: 'text-zinc-600',   label: '실온' },
} as const;
