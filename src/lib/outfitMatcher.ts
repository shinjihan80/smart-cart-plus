'use client';

/**
 * 옷장에서 자동으로 코디 N개를 생성한다.
 *
 * 한 코디 = 상의 + 하의 (또는 원피스) + 신발 + 선택적 액세서리.
 * 매칭 점수: 두께·시즌·로테이션(오래 안 입은 옷 가산점) 종합.
 *
 * 사용자가 옷을 다 등록하지 않아도 합리적 조합을 보여줘서
 * "코디 만들기"의 진입 장벽을 낮춘다.
 */

import { FASHION_GROUP, type ClothingItem } from '@/types';
import type { Season } from './season';

export interface Outfit {
  /** 생성 자체 id — slot 조합 시드로 만들어 같은 조합은 같은 id */
  id:    string;
  /** 코디 라벨 — '오늘 추천' / '봄 코디' / '비 오는 날' 등 */
  label: string;
  /** 슬롯별 의류 — top/bottom/shoes/accessory */
  slots: {
    top?:       ClothingItem;
    bottom?:    ClothingItem;
    onepiece?:  ClothingItem;
    outer?:     ClothingItem;
    shoes?:     ClothingItem;
    accessory?: ClothingItem;
  };
  /** 매칭 점수 — 정렬용 */
  score: number;
  /**
   * 추천 이유 — UI 에 작은 배지로 표시.
   * 예: ['🌸 봄 매칭', '💞 자주 입는 조합', '🌙 오랜만에']
   */
  reasons: string[];
}

interface MatchOptions {
  season?:       Season;
  /** 권장 두께 (날씨 기반) — ['보통', '두꺼움'] 등. 매치 시 가산점. */
  thickness?:    string[];
  /** 코디 개수 (기본 6) */
  count?:        number;
  /**
   * 사용자가 저장한 코디에서 추출한 함께 입은 쌍.
   *   key   = clothing id
   *   value = 같은 코디에 등장한 다른 clothing id 집합
   * 매칭 시 양쪽이 서로의 집합에 있으면 +1.5 (사용자 검증된 조합 우대).
   */
  coWornPairs?:  Map<string, Set<string>>;
}

/** 두 아이템이 사용자 저장 코디에서 함께 등장한 적 있는지 검사 */
function isCoWorn(a: string, b: string, pairs?: Map<string, Set<string>>): boolean {
  if (!pairs) return false;
  return pairs.get(a)?.has(b) ?? false;
}

function pickTopN<T extends { score: number }>(arr: T[], n: number): T[] {
  return [...arr].sort((a, b) => b.score - a.score).slice(0, n);
}

function scoreItem(item: ClothingItem, opts: MatchOptions, idleDays: number): number {
  let score = 0;
  // 시즌 매치 +2
  if (opts.season && item.weatherTags?.includes(opts.season)) score += 2;
  // 두께 매치 +1
  if (opts.thickness?.includes(item.thickness)) score += 1;
  // 오래 안 입은 옷 가산 (로테이션 유도) — 14일+ 마다 +0.5
  if (idleDays > 14) score += Math.min(2, (idleDays - 14) / 14);
  // 최근 3일 이내 착용한 옷 회피 — 같은 옷 연속 노출 방지 (−1.5)
  if (idleDays <= 3 && idleDays !== 9999) score -= 1.5;
  return score;
}

/**
 * 옷장 아이템 + 옵션을 받아 코디 N개를 생성.
 * idleByItem: { [itemId]: 마지막 착용 후 일수 } — 없으면 모두 0으로 간주.
 */
export function generateOutfits(
  items: ClothingItem[],
  idleByItem: Record<string, number>,
  opts: MatchOptions = {},
): Outfit[] {
  const count = opts.count ?? 6;

  // 카테고리별 분류 + 점수
  const tops      = items.filter((i) => i.category === '상의');
  const bottoms   = items.filter((i) => i.category === '하의');
  const onepieces = items.filter((i) => i.category === '원피스');
  const outers    = items.filter((i) => i.category === '아우터');
  const shoes     = items.filter((i) => FASHION_GROUP[i.category] === '신발');
  const accs      = items.filter((i) => FASHION_GROUP[i.category] === '액세서리');

  const scoredTops      = tops.map((i)      => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));
  const scoredBottoms   = bottoms.map((i)   => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));
  const scoredOnepieces = onepieces.map((i) => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));
  const scoredOuters    = outers.map((i)    => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));
  const scoredShoes     = shoes.map((i)     => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));
  const scoredAccs      = accs.map((i)      => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));

  const result: Outfit[] = [];
  const seenSig = new Set<string>(); // 중복 조합 방지

  // 상의+하의 조합
  const topCandidates    = pickTopN(scoredTops, Math.min(5, scoredTops.length));
  const bottomCandidates = pickTopN(scoredBottoms, Math.min(5, scoredBottoms.length));
  for (const t of topCandidates) {
    for (const b of bottomCandidates) {
      const sh = scoredShoes[0]?.item;
      const ac = scoredAccs[0]?.item;
      const ou = (opts.thickness && opts.thickness.includes('두꺼움')) ? scoredOuters[0]?.item : undefined;

      const sig = [t.item.id, b.item.id, sh?.id, ou?.id].join('|');
      if (seenSig.has(sig)) continue;
      seenSig.add(sig);

      // co-worn 보너스 — 사용자가 저장한 코디에서 본 조합이면 가산
      let coBoost = 0;
      if (isCoWorn(t.item.id, b.item.id, opts.coWornPairs)) coBoost += 1.5;
      if (sh && isCoWorn(t.item.id, sh.id, opts.coWornPairs)) coBoost += 0.75;
      if (sh && isCoWorn(b.item.id, sh.id, opts.coWornPairs)) coBoost += 0.75;

      // 추천 이유 수집
      const reasons: string[] = [];
      if (coBoost > 0) reasons.push('💞 자주 입는 조합');
      if (opts.season && (t.item.weatherTags?.includes(opts.season) || b.item.weatherTags?.includes(opts.season))) {
        const seasonEmoji = { 봄: '🌸', 여름: '☀️', 가을: '🍂', 겨울: '❄️' }[opts.season];
        reasons.push(`${seasonEmoji} ${opts.season} 매칭`);
      }
      if (ou) reasons.push('🧥 추울 때');
      const tIdle = idleByItem[t.item.id] ?? 0;
      const bIdle = idleByItem[b.item.id] ?? 0;
      if (tIdle > 14 || bIdle > 14) reasons.push('🌙 오랜만에');

      const total = t.score + b.score + (ou ? 1 : 0) + coBoost;
      result.push({
        id:    `o-${sig}`,
        label: coBoost > 0
          ? '💞 자주 입는 조합'
          : (`${opts.season ?? ''} 코디`.trim() || '추천 코디'),
        slots: { top: t.item, bottom: b.item, outer: ou, shoes: sh, accessory: ac },
        score: total,
        reasons,
      });
      if (result.length >= count) break;
    }
    if (result.length >= count) break;
  }

  // 원피스 조합 (남는 자리)
  for (const op of pickTopN(scoredOnepieces, count - result.length)) {
    const sh = scoredShoes[0]?.item;
    const ac = scoredAccs[0]?.item;
    const sig = [op.item.id, sh?.id].join('|');
    if (seenSig.has(sig)) continue;
    seenSig.add(sig);

    const reasons: string[] = [];
    if (opts.season && op.item.weatherTags?.includes(opts.season)) {
      const seasonEmoji = { 봄: '🌸', 여름: '☀️', 가을: '🍂', 겨울: '❄️' }[opts.season];
      reasons.push(`${seasonEmoji} ${opts.season} 매칭`);
    }
    if ((idleByItem[op.item.id] ?? 0) > 14) reasons.push('🌙 오랜만에');

    result.push({
      id:    `o-${sig}`,
      label: '원피스 코디',
      slots: { onepiece: op.item, shoes: sh, accessory: ac },
      score: op.score,
      reasons,
    });
    if (result.length >= count) break;
  }

  return pickTopN(result, count);
}

/** 코디 안의 의류 id 목록 (markWorn 일괄 호출용) */
export function outfitItemIds(outfit: Outfit): string[] {
  return Object.values(outfit.slots).filter((i): i is ClothingItem => !!i).map((i) => i.id);
}

/** 콜라주 표시용 — 슬롯에 있는 아이템들을 정해진 우선순위로 배열 */
export function outfitItemList(outfit: Outfit): ClothingItem[] {
  const order = ['outer', 'top', 'onepiece', 'bottom', 'shoes', 'accessory'] as const;
  const list: ClothingItem[] = [];
  for (const slot of order) {
    const item = outfit.slots[slot];
    if (item) list.push(item);
  }
  return list;
}
