'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { CartItem } from '@/types';
import { fetchWeather, type WeatherSnapshot } from '@/lib/weather';
import { useWearLog } from '@/lib/wearLog';
import { useCookLog } from '@/lib/recipeCookLog';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { useShoppingList } from '@/lib/shoppingList';
import { pickDailyMessage } from '@/lib/dailyMessage';

/**
 * 홈 최상단 Hero 영역.
 * 기존 작은 DailyMessage 배너를 "시선 잡는 메인 카드"로 격상.
 *
 * 디자인 원칙:
 *  - urgent → 브랜드 경고 색 강조
 *  - insight → 브랜드 primary 색 강조
 *  - gentle  → 은은한 그라디언트
 * 모두 본문 텍스트 크게, CTA 크게, 화이트 스페이스 넉넉.
 */

const TONE = {
  urgent: {
    bg:     'bg-gradient-to-br from-brand-warning/15 to-brand-warning/5',
    border: 'border-brand-warning/20',
    cta:    'bg-brand-warning text-white',
    label:  '지금 바로',
  },
  insight: {
    bg:     'bg-gradient-to-br from-brand-primary/12 to-brand-primary/5',
    border: 'border-brand-primary/20',
    cta:    'bg-brand-primary text-white',
    label:  '오늘 한 마디',
  },
  gentle: {
    bg:     'bg-gradient-to-br from-gray-50 to-white',
    border: 'border-gray-100',
    cta:    'bg-gray-900 text-white',
    label:  '오늘 한 마디',
  },
} as const;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return '새벽이에요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '오후도 힘내세요';
  return '오늘 하루 수고했어요';
}

export default function HeroMessage({ items }: { items: CartItem[] }) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const { log: wearLog } = useWearLog();
  const { log: cookLog } = useCookLog();
  const { favorites }    = useRecipeFavorites();
  const { list: shopping } = useShoppingList();

  useEffect(() => {
    let cancelled = false;
    fetchWeather()
      .then((w) => { if (!cancelled && w) setWeather(w); })
      .catch(() => { /* weather 없이도 동작 */ });
    return () => { cancelled = true; };
  }, []);

  const msg  = pickDailyMessage(items, weather, wearLog, cookLog, favorites, shopping.length);
  const tone = TONE[msg.priority];

  function handleCtaClick() {
    if (msg.paletteQuery) {
      window.dispatchEvent(new CustomEvent('nemoa:open-palette', { detail: { query: msg.paletteQuery } }));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`rounded-[32px] border ${tone.bg} ${tone.border} px-6 py-7`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {tone.label}
        </span>
        {msg.priority === 'urgent' && (
          <span className="text-xs font-bold text-brand-warning bg-white/60 px-2 py-0.5 rounded-full">
            ⚠️ 주의
          </span>
        )}
      </div>

      <div className="flex items-start gap-4 mb-5">
        <motion.span
          key={msg.emoji}
          initial={{ scale: 0.6, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 16 }}
          className="text-5xl shrink-0 leading-none"
        >
          {msg.emoji}
        </motion.span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1">
            {getGreeting()} · 네모아가 알려드려요
          </p>
          <p className="text-base font-bold text-gray-900 leading-snug tracking-tight">
            {msg.text}
          </p>
        </div>
      </div>

      {msg.cta && (
        msg.paletteQuery ? (
          <button
            onClick={handleCtaClick}
            className={`w-full flex items-center justify-center gap-2 ${tone.cta} rounded-2xl py-3 text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all`}
          >
            <span>{msg.cta.label}</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <Link
            href={msg.cta.href}
            className={`w-full flex items-center justify-center gap-2 ${tone.cta} rounded-2xl py-3 text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all`}
          >
            <span>{msg.cta.label}</span>
            <ArrowRight size={16} />
          </Link>
        )
      )}
    </motion.div>
  );
}
