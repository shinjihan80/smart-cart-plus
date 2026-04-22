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
    accent: 'text-brand-warning',
    cta:    'bg-brand-warning text-white',
    chip:   'bg-brand-warning/10 text-brand-warning',
    iconBg: 'bg-brand-warning/10 text-brand-warning',
  },
  insight: {
    accent: 'text-brand-primary',
    cta:    'bg-brand-primary text-white',
    chip:   'bg-brand-primary/10 text-brand-primary',
    iconBg: 'bg-brand-primary/10 text-brand-primary',
  },
  gentle: {
    accent: 'text-gray-600',
    cta:    'bg-gray-900 text-white',
    chip:   'bg-gray-100 text-gray-600',
    iconBg: 'bg-gray-100 text-gray-600',
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
      className="rounded-[24px] bg-white border border-gray-100 px-5 py-5"
      style={{ boxShadow: '0 4px 20px -8px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start gap-3 mb-4">
        <motion.span
          key={msg.priority}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center ${tone.iconBg}`}
        >
          <HeroIcon size={22} strokeWidth={2.2} aria-hidden />
        </motion.span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`text-xs font-semibold ${tone.accent}`}>
              {greeting.text}
            </span>
            {msg.priority === 'urgent' && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${tone.chip}`}>
                주의
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-relaxed">
            {msg.text}
          </p>
        </div>
      </div>

      {msg.cta && (
        msg.paletteQuery ? (
          <button
            onClick={handleCtaClick}
            className={`w-full flex items-center justify-center gap-1.5 ${tone.cta} rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all`}
          >
            <span>{msg.cta.label}</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <Link
            href={msg.cta.href}
            className={`w-full flex items-center justify-center gap-1.5 ${tone.cta} rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all`}
          >
            <span>{msg.cta.label}</span>
            <ArrowRight size={14} />
          </Link>
        )
      )}
    </motion.div>
  );
}
