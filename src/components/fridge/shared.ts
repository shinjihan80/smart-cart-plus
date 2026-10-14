import { Snowflake, Thermometer, Package } from 'lucide-react';
import { SURFACE_CLASS, SURFACE_SHADOW } from '@/components/ui/Surface';

export const springTransition = { type: 'spring' as const, stiffness: 360, damping: 28 };
// 디자인 시스템 Step 5(P2-16) — 값 자체는 src/components/ui/Surface.tsx
// 한 곳에서만 관리. 이 재노출은 기존 호출부(`CARD`/`CARD_SHADOW` import)를
// 하나도 안 건드리려고 남겨둠.
export const CARD = SURFACE_CLASS.bordered;
export const CARD_SHADOW = SURFACE_SHADOW.bordered;

export const STORAGE_ICON = { 냉장: Snowflake, 냉동: Thermometer, 실온: Package } as const;
export const STORAGE_STYLE = {
  냉장: { bg: 'bg-sky-50',    text: 'text-sky-600',    label: '냉장' },
  냉동: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: '냉동' },
  실온: { bg: 'bg-amber-50',  text: 'text-amber-600',  label: '실온' },
} as const;
