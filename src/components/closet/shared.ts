import { Wind, Thermometer, Droplets } from 'lucide-react';
import { SEASON_COLOR } from '@/lib/iconMap';

export const springTransition = { type: 'spring' as const, stiffness: 360, damping: 28 };
export const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
export const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

export const THICKNESS_STYLE = {
  얇음:   { bg: 'bg-sky-50',    text: 'text-sky-600',    icon: Wind },
  보통:   { bg: 'bg-slate-100', text: 'text-slate-600',  icon: Thermometer },
  두꺼움: { bg: 'bg-purple-50', text: 'text-purple-600', icon: Droplets },
} as const;

// SEASON_COLOR(lib/iconMap.ts) 하나로만 정의 — 예전엔 여기 따로 값을
// 하드코딩해서 겨울이 화면마다 sky/blue로 다르게 보이는 등 같은 태그가
// 화면 이동만으로 색이 바뀌는 문제가 있었다(C6, P2-26).
export const SEASON_TAG_STYLE: Record<string, string> = {
  봄:   `${SEASON_COLOR.봄.bg} ${SEASON_COLOR.봄.text}`,
  여름: `${SEASON_COLOR.여름.bg} ${SEASON_COLOR.여름.text}`,
  가을: `${SEASON_COLOR.가을.bg} ${SEASON_COLOR.가을.text}`,
  겨울: `${SEASON_COLOR.겨울.bg} ${SEASON_COLOR.겨울.text}`,
};

export const MATCH_STYLE = {
  perfect:  'bg-brand-success/10 text-brand-success',
  good:     'bg-brand-primary/10 text-brand-primary',
  mismatch: 'bg-gray-100 text-gray-400',
} as const;
