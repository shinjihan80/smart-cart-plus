import type { FoodItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { classifyExpiry } from './expiryThresholds';

export interface FoodStats {
  total:  number;
  cold:   number;
  frozen: number;
  room:   number;
  soon:   number;
}

/**
 * 식품 목록 요약 — 냉장고 요약 카드·마이페이지 보관 현황·칸 배지가 전부
 * 이 함수 하나로만 집계해야 한다. 예전엔 화면마다 손으로 따로 세다가
 * storageType 3종 중 실온이 빠지거나(P0-29/P0-20), 만료 판정 경계가
 * 제각각이라(P0-30) "냉장+냉동≠전체" 같은 불일치가 재발했다.
 */
export function summarizeFoods(foods: readonly FoodItem[]): FoodStats {
  let cold = 0;
  let frozen = 0;
  let room = 0;
  let soon = 0;
  for (const f of foods) {
    if (f.storageType === '냉장') cold += 1;
    else if (f.storageType === '냉동') frozen += 1;
    else if (f.storageType === '실온') room += 1;

    const bucket = classifyExpiry(calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays));
    if (bucket === 'today' || bucket === 'soon') soon += 1;
  }
  return { total: foods.length, cold, frozen, room, soon };
}
