'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sun, Moon, Sunrise, CloudSun, CloudMoon, Check, type LucideIcon } from 'lucide-react';
import { isClothingItem, type CartItem } from '@/types';
import {
  fetchWeather, dressingTip,
  type WeatherSnapshot,
} from '@/lib/weather';
import { useWearLog } from '@/lib/wearLog';
import { useTodayOutfits } from '@/lib/useTodayOutfits';
import { outfitItemList } from '@/lib/outfitMatcher';
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

  // 옷장 코디 탭과 완전히 같은 훅 — 예전엔 이 위젯이 낱개 의류를 실시간
  // 기온으로 직접 매칭해, 코디 탭(완성 세트 기반)과 같은 날 서로 다른 옷을
  // "오늘 추천"으로 제시했다(P0-49). count=1은 1위 코디만 있으면 되므로.
  const [todayOutfit] = useTodayOutfits(clothes, weather, 1);
  const outfitItems = todayOutfit ? outfitItemList(todayOutfit) : [];

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

  return (
    <Link href="/closet?tab=outfit" className="block">
      <Widget index={0} className="relative overflow-hidden min-h-[130px]">
        <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${iconColor.bg} flex items-center justify-center opacity-60`}>
          <Icon size={60} strokeWidth={1.5} className={iconColor.text} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-8 h-8 rounded-xl ${iconColor.bg} flex items-center justify-center shrink-0`}>
              <Icon size={16} strokeWidth={2} className={iconColor.text} />
            </span>
            <p className="text-xs text-gray-400 font-medium">오늘 코디</p>
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

          {outfitItems.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1.5 truncate">
                탭하면 오늘 입었어요로 기록
                {todayOutfit!.reasons.length > 0 && ` — ${todayOutfit!.reasons.slice(0, 2).join(' · ')}`}
              </p>
              {/* 칩 폭을 max-w-[110px]로 고정하고 텍스트를 truncate했던 게
                  브랜드명 절반을 지웠고(예: "Nike"→"Nik"), 4번째 아이템은
                  잘려서 카드 밖으로 사라져 보였다(검토단 C1·C2 발견). 이 줄
                  자체가 가로 스크롤이라 칩을 접을 이유가 없다 — 내용만큼
                  넓히고 스와이프로 나머지를 보게 한다. */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
                {outfitItems.map((item) => {
                  const ItemIcon = FASHION_ICON[item.category] ?? FASHION_ICON['기타 액세서리'];
                  const today = new Date().toISOString().split('T')[0];
                  const wornToday = getEntry(item.id).lastWorn === today;
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (wornToday) {
                          showToast(`"${item.name}" 이미 오늘 기록됐어요`);
                          return;
                        }
                        markWorn(item.id);
                        haptic('toggle');
                        showToast(`"${item.name}" 오늘 입었어요 ✓`);
                      }}
                      aria-label={`${item.name} 오늘 입었어요${wornToday ? ' (이미 기록됨)' : ''}`}
                      className={`shrink-0 flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full border transition-colors active:scale-95 ${
                        wornToday
                          ? 'bg-brand-success/10 border-brand-success/30'
                          : 'bg-white/80 border-gray-100 hover:border-brand-primary/30 hover:bg-white'
                      }`}
                      title={wornToday ? '오늘 이미 기록됨' : '탭해서 오늘 입었어요로 기록'}
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                        {wornToday ? (
                          <Check size={11} strokeWidth={2.6} className="text-brand-success" />
                        ) : item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ItemIcon size={11} strokeWidth={2} className="text-gray-600" />
                        )}
                      </div>
                      <span className={`text-sm font-medium whitespace-nowrap ${wornToday ? 'text-brand-success' : 'text-gray-700'}`}>{item.name}</span>
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
