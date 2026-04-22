'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sun, Moon, Sunrise, CloudSun, CloudMoon, Sparkles as SparklesIcon, type LucideIcon } from 'lucide-react';
import { isClothingItem, FASHION_GROUP, type CartItem } from '@/types';
import {
  fetchWeather, dressingTip, clothingMatch,
  type WeatherSnapshot,
} from '@/lib/weather';
import { useWearLog, daysSince } from '@/lib/wearLog';
import { useToast } from '@/context/ToastContext';
import { haptic } from '@/lib/haptics';
import { FASHION_ICON, weatherIcon, WEATHER_COLOR } from '@/lib/iconMap';
import { Widget } from './shared';

function fallbackBriefing(): { Icon: LucideIcon; headline: string; tip: string } {
  const h = new Date().getHours();
  if (h < 6)  return { Icon: Moon,     headline: '새벽 공기가 상쾌해요',    tip: '따뜻한 차 한 잔 어떠세요?' };
  if (h < 9)  return { Icon: Sunrise,  headline: '상쾌한 아침이에요',       tip: '얇은 겉옷을 챙기세요.' };
  if (h < 12) return { Icon: CloudSun, headline: '활기찬 오전이에요',       tip: '오늘 하루 힘내세요.' };
  if (h < 15) return { Icon: Sun,      headline: '따뜻한 오후에요',         tip: '자외선 차단에 신경 쓰세요.' };
  if (h < 18) return { Icon: CloudSun, headline: '느긋한 늦은 오후에요',    tip: '잠깐 바람 쐬러 나가볼까요?' };
  if (h < 21) return { Icon: CloudMoon, headline: '해가 지는 저녁이에요',   tip: '저녁엔 가디건이 좋아요.' };
  return           { Icon: Moon,     headline: '포근한 밤이에요',           tip: '따뜻하게 입으세요.' };
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
  const fallback = fallbackBriefing();
  const Icon: LucideIcon = useLive ? weatherIcon(weather.condition, weather.isDay) : fallback.Icon;
  const iconColor = useLive ? WEATHER_COLOR[weather.condition] : { text: 'text-gray-600', bg: 'bg-gray-100' };
  const headline = useLive
    ? `현재 ${weather.tempC}°, ${weather.condition}`
    : fallback.headline;
  const tip      = useLive
    ? dressingTip(weather.tempC, weather.condition)
    : fallback.tip;

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
        <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${iconColor.bg} flex items-center justify-center opacity-60`}>
          <Icon size={60} strokeWidth={1.5} className={iconColor.text} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-8 h-8 rounded-xl ${iconColor.bg} flex items-center justify-center shrink-0`}>
              <Icon size={16} strokeWidth={2} className={iconColor.text} />
            </span>
            <p className="text-xs text-gray-400 font-medium">네모아의 오늘 브리핑</p>
            {useLive && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand-success/10">
                <span className="w-1 h-1 rounded-full bg-brand-success" />
                <span className="text-xs font-bold text-brand-success">LIVE</span>
              </span>
            )}
            {weatherFailed && !useLive && (
              <span className="text-xs text-gray-300">· 오프라인</span>
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
              <span className="text-sm text-gray-400 shrink-0">오늘의 추천</span>
              <div className="flex gap-1.5 overflow-hidden">
                {topMatches.map(({ item, match, idleDays }) => {
                  const ItemIcon = FASHION_ICON[item.category] ?? FASHION_ICON['기타 액세서리'];
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markWorn(item.id);
                        haptic('toggle');
                        showToast(`"${item.name}" 오늘 착용 기록 완료`);
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
                          <ItemIcon size={11} strokeWidth={2} className="text-gray-600" />
                        )}
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate">{item.name}</span>
                      {match.level === 'perfect' && <SparklesIcon size={10} strokeWidth={2.2} className="text-amber-500 shrink-0" />}
                      {idleDays >= 30 && idleDays < 9999 && <Moon size={10} strokeWidth={2} className="text-sky-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <ChevronRight size={16} className="absolute right-5 top-5 text-gray-300" />
      </Widget>
    </Link>
  );
}
