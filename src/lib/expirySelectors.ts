import { isFoodItem, type CartItem, type FoodItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { classifyExpiry, type ExpiryBucket } from './expiryThresholds';

/**
 * "임박" 개수 단일 소스.
 *
 * 화면마다 calcRemainingDays를 직접 불러 저마다 다른 경계(<=1, <=2, <=3, !=='fresh')로
 * 세다 보니 같은 냉장고를 두고 배지가 1·3·6·7개로 화면마다 갈리는 회귀가
 * 3회 연속(P0-30류) 재발했다. calcRemainingDays 직접 import는 ESLint
 * no-restricted-imports로 이 파일과 expiryThresholds.ts 밖에서는 막혀 있다 —
 * 개수·판정이 필요하면 반드시 이 파일을 거칠 것.
 */

export interface ExpiringEntry {
  item:   FoodItem;
  dDay:   number;
  bucket: ExpiryBucket;
}

export interface ExpirySelection {
  expired: ExpiringEntry[];
  today:   ExpiringEntry[];
  soon:    ExpiringEntry[];
  /**
   * 배지 통일 기준 — today + soon. 기한이 이미 지난(expired) 항목은
   * "곧 만료"가 아니라 별도 문구(치워야 할 것)로 안내해야 하므로 배지 총합에서 뺀다.
   */
  urgentTotal: number;
}

export function selectExpiring(items: readonly CartItem[]): ExpirySelection {
  const expired: ExpiringEntry[] = [];
  const today:   ExpiringEntry[] = [];
  const soon:    ExpiringEntry[] = [];

  for (const item of items) {
    if (!isFoodItem(item)) continue;
    const dDay   = calcRemainingDays(item.purchaseDate, item.baseShelfLifeDays);
    const bucket = classifyExpiry(dDay);
    const entry: ExpiringEntry = { item, dDay, bucket };
    if (bucket === 'expired') expired.push(entry);
    else if (bucket === 'today') today.push(entry);
    else if (bucket === 'soon') soon.push(entry);
  }

  return { expired, today, soon, urgentTotal: today.length + soon.length };
}

/** 분류가 아니라 단일 아이템의 D-Day 숫자만 필요한 화면(정렬·표시·알림 예약)용. */
export function getRemainingDays(item: FoodItem): number {
  return calcRemainingDays(item.purchaseDate, item.baseShelfLifeDays);
}
