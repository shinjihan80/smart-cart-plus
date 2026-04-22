'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { currentSeasonByMonth } from '@/lib/season';
import { currentSeasonalProduce, isSeasonalProduce } from '@/lib/seasonalProduce';
import { SEASON_ICON, SEASON_COLOR } from '@/lib/iconMap';
import { Widget } from './shared';

/**
 * 홈 벤토에 들어가는 제철 힌트 카드.
 *
 * 3가지 상태 자동 분기:
 * 1) 제철 재료 보유 중 → 피크 배지 + '지금 제철 N개'
 * 2) 피크 재료 미보유 → 장보기 유도 (상위 3개 이름 노출)
 * 3) 계절 변동기 → 다음 계절 미리보기 (현재는 비노출)
 */
export default function SeasonalHintWidget({ items }: { items: CartItem[] }) {
  const season = currentSeasonByMonth();
  const foods = items.filter(isFoodItem);
  const haveNames = new Set(foods.map((f) => f.name));

  const ownedSeasonal = foods.filter((f) => isSeasonalProduce(f.name, season));
  const peakMissing = currentSeasonalProduce(season, 10)
    .filter((p) => p.peak === season && !haveNames.has(p.name))
    .slice(0, 3);

  const SeasonIcon = SEASON_ICON[season];
  const seasonColor = SEASON_COLOR[season];

  // 상태 1: 보유 중
  if (ownedSeasonal.length > 0) {
    const sample = ownedSeasonal.slice(0, 3).map((f) => f.name).join('·');
    return (
      <Link href="/fridge" className="col-span-2 block">
        <Widget index={2}>
          <div className="flex items-center gap-3">
            <span className={`w-11 h-11 rounded-2xl ${seasonColor.bg} flex items-center justify-center shrink-0`}>
              <SeasonIcon size={22} strokeWidth={2} className={seasonColor.text} />
            </span>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-xs text-gray-500 font-medium">지금 {season}철 식탁</p>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold tabular-nums">
                  {ownedSeasonal.length}개
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 truncate">{sample}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                가장 맛있을 때예요 — 이번 주 안에 드셔보세요
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </div>
        </Widget>
      </Link>
    );
  }

  // 상태 2: 피크 재료 미보유 → 장보기 유도
  if (peakMissing.length > 0) {
    const sample = peakMissing.map((p) => p.name).join(' · ');
    return (
      <Link href="/mypage" className="col-span-2 block">
        <Widget index={2}>
          <div className="flex items-center gap-3">
            <span className={`w-11 h-11 rounded-2xl ${seasonColor.bg} flex items-center justify-center shrink-0`}>
              <SeasonIcon size={22} strokeWidth={2} className={seasonColor.text} />
            </span>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-gray-400 font-medium mb-0.5">이번 {season} 놓치지 마세요</p>
              <p className="text-sm font-bold text-gray-900 truncate">{sample}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                피크 제철 {peakMissing.length}종이 기다려요
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </div>
        </Widget>
      </Link>
    );
  }

  return null;
}
