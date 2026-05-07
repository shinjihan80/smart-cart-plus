import { Snowflake, Thermometer, Package } from 'lucide-react';

export const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
export const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
export const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

export const STORAGE_ICON = { 냉장: Snowflake, 냉동: Thermometer, 실온: Package } as const;
export const STORAGE_STYLE = {
  냉장: { bg: 'bg-sky-50',    text: 'text-sky-600',    label: '냉장' },
  냉동: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: '냉동' },
  실온: { bg: 'bg-amber-50',  text: 'text-amber-600',  label: '실온' },
} as const;
