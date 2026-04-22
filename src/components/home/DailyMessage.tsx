'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CartItem } from '@/types';
import { fetchWeather, type WeatherSnapshot } from '@/lib/weather';
import { useWearLog } from '@/lib/wearLog';
import { useCookLog } from '@/lib/recipeCookLog';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { useShoppingList } from '@/lib/shoppingList';
import { pickDailyMessage } from '@/lib/dailyMessage';

const TONE = {
  urgent:  { bg: 'bg-brand-warning/10 border-brand-warning/20', text: 'text-brand-warning' },
  insight: { bg: 'bg-brand-primary/10 border-brand-primary/20', text: 'text-brand-primary' },
  gentle:  { bg: 'bg-gray-50 border-gray-100',                   text: 'text-gray-500' },
} as const;

export default function DailyMessage({ items }: { items: CartItem[] }) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const { log: wearLog } = useWearLog();
  const { log: cookLog } = useCookLog();
  const { favorites }    = useRecipeFavorites();
  const { list: shopping } = useShoppingList();

  useEffect(() => {
    let cancelled = false;
    fetchWeather()
      .then((w) => { if (!cancelled && w) setWeather(w); })
      .catch(() => { /* weather 없이도 메시지 생성 가능 */ });
    return () => { cancelled = true; };
  }, []);

  const msg = pickDailyMessage(items, weather, wearLog, cookLog, favorites, shopping.length);
  const tone = TONE[msg.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`rounded-[24px] border px-4 py-3 flex items-center gap-3 ${tone.bg}`}
    >
      <motion.span
        key={msg.emoji}
        initial={{ scale: 0.7, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
        className="text-2xl shrink-0"
      >
        {msg.emoji}
      </motion.span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 mb-0.5">
          네모아의 오늘 한 마디
          {msg.priority === 'urgent' && <span className={`ml-1 ${tone.text}`}>· 주의</span>}
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">{msg.text}</p>
      </div>
      {msg.cta && (
        msg.paletteQuery ? (
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent('nemoa:open-palette', { detail: { query: msg.paletteQuery } }))
            }
            className={`shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-white border border-gray-100 hover:bg-gray-50 transition-colors ${tone.text}`}
          >
            {msg.cta.label} →
          </button>
        ) : (
          <Link
            href={msg.cta.href}
            className={`shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-white border border-gray-100 hover:bg-gray-50 transition-colors ${tone.text}`}
          >
            {msg.cta.label} →
          </Link>
        )
      )}
    </motion.div>
  );
}
