'use client';

import { useMemo } from 'react';
import type { ClothingItem } from '@/types';
import { generateOutfits, type Outfit } from './outfitMatcher';
import { useWearLog, daysSince } from './wearLog';
import { useSavedOutfits } from './savedOutfits';
import { currentSeasonByMonth } from './season';
import { recommendedThickness, type WeatherSnapshot } from './weather';

/**
 * "오늘 추천 코디" 단일 진실원 — 예전엔 홈 위젯(DailyBriefing)이 낱개 의류를
 * 실시간 기온으로 직접 매칭하고, 옷장 코디 탭(OutfitGrid)은 generateOutfits로
 * 완성된 세트를 따로 골라, 같은 날 두 화면이 겹치는 옷 0벌을 추천하는 일이
 * 흔했다(P0-49, 전문단 E1/E2). 두 화면 모두 이 훅 하나만 불러 입력(계절·
 * 두께·착용 로그·저장 코디)과 출력(코디 세트)을 반드시 일치시킨다.
 */
export function useTodayOutfits(items: ClothingItem[], weather: WeatherSnapshot | null, count = 6): Outfit[] {
  const { log } = useWearLog();
  const { outfits: saved } = useSavedOutfits();

  // 저장 코디에서 함께 입은 쌍 추출
  const coWornPairs = useMemo(() => {
    const pairs = new Map<string, Set<string>>();
    for (const o of saved) {
      const ids = Object.values(o.slots).filter((id): id is string => !!id);
      for (let i = 0; i < ids.length; i += 1) {
        for (let j = i + 1; j < ids.length; j += 1) {
          if (!pairs.has(ids[i])) pairs.set(ids[i], new Set());
          if (!pairs.has(ids[j])) pairs.set(ids[j], new Set());
          pairs.get(ids[i])!.add(ids[j]);
          pairs.get(ids[j])!.add(ids[i]);
        }
      }
    }
    return pairs;
  }, [saved]);

  const season    = useMemo(() => currentSeasonByMonth(), []);
  const thickness = useMemo(() => (weather ? recommendedThickness(weather.tempC) : undefined), [weather]);

  return useMemo(() => {
    if (items.length < 3) return [];
    const idleByItem: Record<string, number> = {};
    for (const item of items) {
      const dates = log[item.id] ?? [];
      idleByItem[item.id] = dates.length > 0 ? daysSince(dates[0]) : 9999;
    }
    return generateOutfits(items, idleByItem, { season, thickness, count, coWornPairs });
  }, [items, log, season, thickness, count, coWornPairs]);
}
