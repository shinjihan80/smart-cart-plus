'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FASHION_GROUP, type ClothingItem } from '@/types';
import {
  fetchWeather, weatherEmoji, recommendedThickness, seasonFromTemp,
  type WeatherSnapshot,
} from '@/lib/weather';
import { springTransition, CARD, CARD_SHADOW } from './shared';

export default function OutfitSection({ items }: { items: ClothingItem[] }) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWeather()
      .then((w) => { if (!cancelled && w) setWeather(w); })
      .catch(() => { /* 폴백은 아래 계절 기반 */ });
    return () => { cancelled = true; };
  }, []);

  const useLive = weather !== null;
  const season  = useLive
    ? seasonFromTemp(weather.tempC)
    : (() => {
        const month = new Date().getMonth() + 1;
        return month <= 2 || month === 12 ? '겨울' : month <= 5 ? '봄' : month <= 8 ? '여름' : '가을';
      })();
  const thickOK = useLive ? recommendedThickness(weather.tempC) : null;

  const scored = items
    .filter((c) => FASHION_GROUP[c.category] === '의류')
    .map((c) => {
      let score = 0;
      if (c.weatherTags?.includes(season)) score += 2;
      if (thickOK && thickOK.includes(c.thickness)) score += 1;
      return { item: c, score };
    })
    .sort((a, b) => b.score - a.score);

  const topMatches = scored.filter((s) => s.score > 0).slice(0, 3).map((s) => s.item);
  if (topMatches.length === 0) return null;

  const outfits: { name: string; items: string[]; tip: string }[] = [];
  outfits.push({
    name:  useLive ? `${weather.tempC}°C 추천` : '오늘의 추천',
    items: topMatches.slice(0, 2).map((i) => i.name),
    tip:   useLive
      ? `${season} 기온(${weather.tempC}°)에 어울려요`
      : `${season} 날씨에 딱 맞는 조합이에요`,
  });

  if (topMatches.length >= 3) {
    outfits.push({
      name: '레이어드 코디',
      items: [topMatches[0].name, topMatches[2].name],
      tip:   useLive && weather.tempC < 18
        ? '쌀쌀한 날씨엔 겹쳐 입기가 좋아요'
        : '얇은 옷 위에 겹쳐 입기 좋아요',
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.12 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">👗</span>
          <span className="text-xs text-gray-400 font-medium">네모아가 추천하는 오늘의 코디</span>
        </div>
        {useLive && (
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
            <span>{weatherEmoji(weather.condition, weather.isDay)}</span>
            <span className="tabular-nums">{weather.tempC}°</span>
            <span className="text-gray-300">·</span>
            <span>{weather.condition}</span>
          </span>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {outfits.map((outfit) => (
          <div key={outfit.name} className="shrink-0 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 px-3.5 py-2.5 min-w-[150px]">
            <p className="text-xs font-semibold text-gray-800">{outfit.name}</p>
            <div className="flex flex-col gap-0.5 mt-1.5">
              {outfit.items.map((name) => (
                <span key={name} className="text-[10px] text-brand-primary truncate">
                  • {name}
                </span>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5">{outfit.tip}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
