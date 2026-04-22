'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { isClothingItem, FASHION_GROUP, FASHION_EMOJI, type CartItem } from '@/types';
import {
  fetchWeather, weatherEmoji, dressingTip, clothingMatch,
  type WeatherSnapshot,
} from '@/lib/weather';
import { useWearLog, daysSince } from '@/lib/wearLog';
import { useToast } from '@/context/ToastContext';
import { haptic } from '@/lib/haptics';
import { Widget } from './shared';

function fallbackBriefing(): { emoji: string; headline: string; tip: string } {
  const h = new Date().getHours();
  if (h < 6)  return { emoji: '🌙', headline: '새벽 공기가 상쾌해요',        tip: '따뜻한 차 한 잔 어떠세요?' };
  if (h < 9)  return { emoji: '🌅', headline: '상쾌한 아침이에요',            tip: '얇은 겉옷을 챙기세요.' };
  if (h < 12) return { emoji: '🌤️', headline: '활기찬 오전이에요',            tip: '오늘 하루 힘내세요.' };
  if (h < 15) return { emoji: '☀️', headline: '따뜻한 오후에요',              tip: '자외선 차단에 신경 쓰세요.' };
  if (h < 18) return { emoji: '🌤️', headline: '느긋한 늦은 오후에요',         tip: '잠깐 바람 쐬러 나가볼까요?' };
  if (h < 21) return { emoji: '🌆', headline: '해가 지는 저녁이에요',          tip: '저녁엔 가디건이 좋아요.' };
  return           { emoji: '🌙', headline: '포근한 밤이에요',               tip: '따뜻하게 입으세요.' };
}

export default function DailyBriefing({ items }: { items: CartItem[] }) {
  const clothes = items.filter(isClothingItem);
  const { getEntry, markWorn } = useWearLog();
  const { showToast } = useToast();

  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchWeather()
      .then((w) => {
        if (cancelled) return;
        if (w) setWeather(w);
        else setWeatherFailed(true);
      })
      .catch(() => {
        if (!cancelled) setWeatherFailed(true);
      });
    return () => { cancelled = true; };
  }, []);

  const useLive = weather !== null;
  const emoji    = useLive ? weatherEmoji(weather.condition, weather.isDay) : fallbackBriefing().emoji;
  const headline = useLive
    ? `현재 ${weather.tempC}°, ${weather.condition}`
    : fallbackBriefing().headline;
  const tip      = useLive
    ? dressingTip(weather.tempC, weather.condition)
    : fallbackBriefing().tip;

  // 매칭 등급(perfect > good) + 로테이션 선호(오래 안 입은 옷 우선)
  const topMatches = useLive
    ? clothes
        .filter((c) => FASHION_GROUP[c.category] === '의류')
        .map((c) => {
          const entry = getEntry(c.id);
          const idleDays = entry.lastWorn ? daysSince(entry.lastWorn) : 9999;
          return { item: c, match: clothingMatch(c.thickness, c.weatherTags, weather.tempC), idleDays };
        })
        .filter((x) => x.match.level !== 'mismatch')
        .sort((a, b) => {
          // 1순위: match 등급 (perfect > good)
          if (a.match.level !== b.match.level) return a.match.level === 'perfect' ? -1 : 1;
          // 2순위: 오래 안 입은 옷 우선 (idleDays 내림차순)
          return b.idleDays - a.idleDays;
        })
        .slice(0, 3)
    : [];

  return (
    <Link href="/closet" className="col-span-2 block">
      <Widget index={0} className="relative overflow-hidden min-h-[130px]">
        <div className="absolute -right-4 -top-2 opacity-30 select-none pointer-events-none">
          <div className="text-[80px] leading-none">{emoji}</div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs text-gray-400 font-medium">네모아의 오늘 브리핑</p>
            {useLive && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand-success/10">
                <span className="w-1 h-1 rounded-full bg-brand-success" />
                <span className="text-[10px] font-bold text-brand-success">LIVE</span>
              </span>
            )}
            {weatherFailed && !useLive && (
              <span className="text-[10px] text-gray-300">· 오프라인</span>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900 leading-snug">
            {headline}
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {tip}
            {useLive && weather.feelsLikeC !== weather.tempC && (
              <span className="text-xs text-gray-400 ml-1">(체감 {weather.feelsLikeC}°)</span>
            )}
          </p>

          {topMatches.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-gray-400 shrink-0">오늘의 추천</span>
              <div className="flex gap-1.5 overflow-hidden">
                {topMatches.map(({ item, match, idleDays }) => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markWorn(item.id);
                      haptic('toggle');
                      showToast(`"${item.name}" 오늘 착용 기록 완료 👕`);
                    }}
                    aria-label={`${item.name} 오늘 입었어요`}
                    className="shrink-0 flex items-center gap-1 max-w-[96px] pl-1 pr-2 py-0.5 rounded-full bg-white/80 border border-gray-100 hover:border-brand-primary/30 hover:bg-white transition-colors active:scale-95"
                    title={idleDays >= 30 ? `${idleDays}일째 안 입은 옷 · 탭해서 기록` : '탭해서 오늘 착용 기록'}
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px]">{FASHION_EMOJI[item.category] ?? '👕'}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-700 font-medium truncate">{item.name}</span>
                    {match.level === 'perfect' && <span className="text-[10px]">✨</span>}
                    {idleDays >= 30 && idleDays < 9999 && <span className="text-[10px]">🌙</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <ChevronRight size={16} className="absolute right-5 top-5 text-gray-300" />
      </Widget>
    </Link>
  );
}
