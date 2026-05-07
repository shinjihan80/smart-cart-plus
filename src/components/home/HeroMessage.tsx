'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, Sparkles, Sun, Moon, Sunrise, Utensils, type LucideIcon } from 'lucide-react';
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
    accent:  'text-brand-accent',
    cta:     'bg-brand-accent text-white',
    chip:    'bg-brand-accent/10 text-brand-accent',
    iconBg:  'bg-brand-accent/10 text-brand-accent',
    cardBg:  'bg-gradient-to-br from-brand-accent/8 via-white to-white',
  },
  insight: {
    accent:  'text-brand-primary',
    cta:     'bg-brand-primary text-white',
    chip:    'bg-brand-primary/10 text-brand-primary',
    iconBg:  'bg-brand-primary/10 text-brand-primary',
    cardBg:  'bg-gradient-to-br from-brand-primary/8 via-white to-white',
  },
  gentle: {
    accent:  'text-brand-ink',
    cta:     'bg-brand-ink text-white',
    chip:    'bg-gray-100 text-brand-ink',
    iconBg:  'bg-gray-100 text-brand-ink',
    cardBg:  'bg-white',
  },
} as const;

/** 시간대별 아이콘 — gentle 메시지에 사용 */
function getGreetingMeta(): { Icon: LucideIcon; text: string } {
  const h = new Date().getHours();
  if (h < 6)  return { Icon: Moon,    text: '새벽이에요' };
  if (h < 12) return { Icon: Sunrise, text: '좋은 아침이에요' };
  if (h < 14) return { Icon: Utensils, text: '점심 시간이에요' };
  if (h < 18) return { Icon: Sun,     text: '오후도 힘내세요' };
  return { Icon: Moon, text: '오늘 하루 수고했어요' };
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
  const greeting = getGreetingMeta();

  // priority별 대표 아이콘 (이모지 대체)
  const HeroIcon: LucideIcon =
    msg.priority === 'urgent'  ? AlertTriangle :
    msg.priority === 'insight' ? Sparkles :
                                 greeting.Icon;

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
      className={`rounded-[28px] ${tone.cardBg} px-6 py-6 relative overflow-hidden`}
      style={{ boxShadow: '0 8px 24px -12px rgba(31, 31, 46, 0.12), 0 2px 6px -2px rgba(31, 31, 46, 0.04)' }}
    >
      {/* 우측 상단 큰 아이콘 — 워터마크처럼 */}
      <div className={`absolute -right-3 -top-3 w-24 h-24 rounded-3xl ${tone.iconBg} opacity-40 flex items-center justify-center`}>
        <HeroIcon size={56} strokeWidth={1.5} aria-hidden />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <motion.span
            key={msg.priority}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className={`w-9 h-9 rounded-2xl shrink-0 flex items-center justify-center ${tone.iconBg}`}
          >
            <HeroIcon size={18} strokeWidth={2.2} aria-hidden />
          </motion.span>
          <span className={`text-xs font-bold ${tone.accent} tracking-wide`}>
            {greeting.text}
          </span>
          {msg.priority === 'urgent' && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tone.chip}`}>
              주의
            </span>
          )}
        </div>
        <p className="text-base font-bold text-brand-ink leading-snug pr-12 mb-5">
          {msg.text}
        </p>

        {msg.cta && (
          msg.paletteQuery ? (
            <button
              onClick={handleCtaClick}
              className={`flex items-center gap-1.5 ${tone.cta} rounded-full pl-5 pr-4 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all`}
            >
              <span>{msg.cta.label}</span>
              <ArrowRight size={14} strokeWidth={2.4} />
            </button>
          ) : (
            <Link
              href={msg.cta.href}
              className={`inline-flex items-center gap-1.5 ${tone.cta} rounded-full pl-5 pr-4 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all`}
            >
              <span>{msg.cta.label}</span>
              <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
          )
        )}
      </div>
    </motion.div>
  );
}
