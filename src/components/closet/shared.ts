import { Wind, Thermometer, Droplets } from 'lucide-react';

export const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
export const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
export const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

export const THICKNESS_STYLE = {
  얇음:   { bg: 'bg-sky-50',    text: 'text-sky-600',    icon: Wind },
  보통:   { bg: 'bg-slate-100', text: 'text-slate-600',  icon: Thermometer },
  두꺼움: { bg: 'bg-purple-50', text: 'text-purple-600', icon: Droplets },
} as const;

export const SEASON_TAG_STYLE: Record<string, string> = {
  봄:   'bg-pink-50 text-pink-500',
  여름: 'bg-amber-50 text-amber-500',
  가을: 'bg-orange-50 text-orange-500',
  겨울: 'bg-blue-50 text-blue-500',
};

export const MATCH_STYLE = {
  perfect:  'bg-brand-success/10 text-brand-success',
  good:     'bg-brand-primary/10 text-brand-primary',
  mismatch: 'bg-gray-100 text-gray-400',
} as const;
