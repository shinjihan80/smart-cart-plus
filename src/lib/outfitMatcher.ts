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

import { FASHION_GROUP, type ClothingItem } from '../types/index.ts';
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
  // 두께 매치 +2 — 실시간 기온(recommendedThickness) 기반이라 계절보다
  // 우선한다. 예전엔 시즌 매치가 더 높은 가산(+2)을 받아, 체감 25°에도
  // "가을" 태그가 붙은 두꺼운 액세서리(울 머플러 등)가 얇은 옷보다 높은
  // 점수로 뽑혔다(검토단 C2·C4 발견 — "체감 25°인데 울 머플러 추천").
  // 시즌은 달력 월 기준의 느슨한 신호일 뿐이라 실시간 기온 신호보다
  // 낮게 둔다.
  if (opts.thickness?.includes(item.thickness)) score += 2;
  // 시즌 매치 +1
  if (opts.season && item.weatherTags?.includes(opts.season)) score += 1;
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

  // 카테고리별 분류
  const tops      = items.filter((i) => i.category === '상의');
  const bottoms   = items.filter((i) => i.category === '하의');
  const onepieces = items.filter((i) => i.category === '원피스');
  const outers    = items.filter((i) => i.category === '아우터');
  const shoes     = items.filter((i) => FASHION_GROUP[i.category] === '신발');
  const accs      = items.filter((i) => FASHION_GROUP[i.category] === '액세서리');

  // 콜드스타트(착용 로그 0건, 호출부가 idleDays=9999로 균일 전달) 감지 —
  // 9999는 scoreItem에서 이미 전원 동일(+2 상한)로 취급돼 순위엔 영향 없지만,
  // "오랜만에" 배지(idle>14)는 모든 카드에 찍혀 노이즈가 된다. 점수 계산은
  // 그대로 두고(시즌/두께 매치가 유일한 변별 요인), 배지만 콜드스타트에서 끈다
  // — 다양성은 아래 라운드로빈 슬롯 배정에 맡긴다("카테고리 커버리지 우선").
  const coldStart = [...tops, ...bottoms, ...onepieces].every((i) => (idleByItem[i.id] ?? 9999) === 9999);

  const scoredTops      = tops.map((i)      => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));
  const scoredBottoms   = bottoms.map((i)   => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));
  const scoredOnepieces = onepieces.map((i) => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));
  const scoredOuters    = outers.map((i)    => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) }));
  const scoredShoes     = pickTopN(shoes.map((i) => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) })), shoes.length);
  const scoredAccs      = pickTopN(accs.map((i)  => ({ item: i, score: scoreItem(i, opts, idleByItem[i.id] ?? 0) })), accs.length);

  // 신발·액세서리 라운드로빈 대상 풀 — score<0(예: 최근 3일 이내 착용 회피
  // 패널티가 걸린 아이템)은 제외한다. 안 그러면 "어제 신은 신발"도 그냥
  // idx%length로 균등 순환에 끼어 다시 추천되어 버려, scoreItem()의 회피
  // 의도가 라운드로빈 도입으로 무력화된다. 전부 음수면(옵션 없음) 어쩔 수
  // 없이 전체 풀로 폴백.
  const shoePool = scoredShoes.filter((s) => s.score >= 0);
  const accPool  = scoredAccs.filter((s) => s.score >= 0);
  const shoeRotation = shoePool.length > 0 ? shoePool : scoredShoes;
  const accRotation  = accPool.length  > 0 ? accPool  : scoredAccs;

  const result: Outfit[] = [];
  const seenSig = new Set<string>(); // 중복 조합 방지

  // 상의×하의 전체 조합에 점수를 매겨 정렬한 뒤, 슬롯별 최대 등장 횟수(cap)를
  // 넘는 조합은 건너뛴다 — 예전엔 이중 루프+early break라 상의 후보 1개가
  // count-1장을 독점했다(신발·액세서리도 매번 [0]으로 고정이라 더 심했다).
  // cap은 후보 풀 크기에 맞춰 동적으로(옷이 적을수록 완화) 계산해 MMR과
  // 비슷하게 "한 아이템이 결과 집합을 과점하면 후보에서 제외"를 흉내낸다.
  const topCandidates    = pickTopN(scoredTops, Math.min(5, scoredTops.length));
  const bottomCandidates = pickTopN(scoredBottoms, Math.min(5, scoredBottoms.length));
  const capFor = (n: number) => Math.max(1, Math.ceil(count / Math.max(1, n)));
  const topCap    = capFor(topCandidates.length);
  const bottomCap = capFor(bottomCandidates.length);

  const combos = topCandidates.flatMap((t) => bottomCandidates.map((b) => ({ t, b, score: t.score + b.score })));
  combos.sort((a, b) => b.score - a.score);

  const topUsed    = new Map<string, number>();
  const bottomUsed = new Map<string, number>();
  const chosen: typeof combos = [];
  for (const c of combos) {
    if (chosen.length >= count) break;
    if ((topUsed.get(c.t.item.id) ?? 0) >= topCap) continue;
    if ((bottomUsed.get(c.b.item.id) ?? 0) >= bottomCap) continue;
    chosen.push(c);
    topUsed.set(c.t.item.id, (topUsed.get(c.t.item.id) ?? 0) + 1);
    bottomUsed.set(c.b.item.id, (bottomUsed.get(c.b.item.id) ?? 0) + 1);
  }
  // cap 때문에 count를 못 채웠으면(후보 풀이 아주 얇을 때) 점수순으로 보충 —
  // 이땐 cap을 넘기더라도 결과를 count장 채우는 쪽이 우선.
  if (chosen.length < count) {
    for (const c of combos) {
      if (chosen.length >= count) break;
      if (chosen.includes(c)) continue;
      chosen.push(c);
    }
  }

  chosen.forEach(({ t, b, score: tbScore }, idx) => {
    // 신발·액세서리도 결과 인덱스 기준 라운드로빈 — 예전엔 항상 [0]으로
    // 고정 대입해 캐러셀을 몇 장 넘겨도 신발·액세서리가 절대 안 바뀌었다.
    const sh = shoeRotation.length > 0 ? shoeRotation[idx % shoeRotation.length].item : undefined;
    const ac = accRotation.length  > 0 ? accRotation[idx  % accRotation.length].item  : undefined;
    const ou = (opts.thickness && opts.thickness.includes('두꺼움')) ? scoredOuters[0]?.item : undefined;

    const sig = [t.item.id, b.item.id, sh?.id, ou?.id].join('|');
    if (seenSig.has(sig)) return;
    seenSig.add(sig);

    // co-worn 보너스 — 사용자가 저장한 코디에서 본 조합이면 가산.
    // "자주 입는 조합" 라벨은 상의+하의가 실제로 함께 저장된 경우만 붙인다 —
    // 신발 하나가 여러 저장 코디에 공통으로 들어있으면(자주 신는 신발) 그
    // 신발이 낀 모든 조합이 "자주 입는 조합"으로 오염되던 버그(C2 발견,
    // P1-37) — 신발만 겹치는 약한 신호는 점수 가산에만 반영하고 라벨엔 안 씀.
    const topBottomCoWorn = isCoWorn(t.item.id, b.item.id, opts.coWornPairs);
    let coBoost = 0;
    if (topBottomCoWorn) coBoost += 1.5;
    if (sh && isCoWorn(t.item.id, sh.id, opts.coWornPairs)) coBoost += 0.75;
    if (sh && isCoWorn(b.item.id, sh.id, opts.coWornPairs)) coBoost += 0.75;

    // 추천 이유 수집
    const reasons: string[] = [];
    if (topBottomCoWorn) reasons.push('💞 자주 입는 조합');
    if (opts.season && (t.item.weatherTags?.includes(opts.season) || b.item.weatherTags?.includes(opts.season))) {
      const seasonEmoji = { 봄: '🌸', 여름: '☀️', 가을: '🍂', 겨울: '❄️' }[opts.season];
      reasons.push(`${seasonEmoji} ${opts.season} 매칭`);
    }
    if (ou) reasons.push('🧥 추울 때');
    const tIdle = idleByItem[t.item.id] ?? 0;
    const bIdle = idleByItem[b.item.id] ?? 0;
    if (!coldStart && (tIdle > 14 || bIdle > 14)) reasons.push('🌙 오랜만에');

    const total = tbScore + (ou ? 1 : 0) + coBoost;
    result.push({
      id:    `o-${sig}`,
      // label은 상의+하의 이름 조합 — 예전엔 상의 이름만 써서 상의가 고정된
      // 카드끼리는 라벨도 똑같았다(C2: "코디는 이름으로 기억하는데 다 같은
      // 이름이면 저장해도 못 찾는다"). reasons 배지와는 절대 안 겹치게.
      label: `${t.item.name} × ${b.item.name}`,
      slots: { top: t.item, bottom: b.item, outer: ou, shoes: sh, accessory: ac },
      score: total,
      reasons,
    });
  });

  // 원피스 조합 (남는 자리) — 신발·액세서리는 여기도 인덱스 기준 라운드로빈.
  pickTopN(scoredOnepieces, count - result.length).forEach((op, idx) => {
    const sh = shoeRotation.length > 0 ? shoeRotation[idx % shoeRotation.length].item : undefined;
    const ac = accRotation.length  > 0 ? accRotation[idx  % accRotation.length].item  : undefined;
    const sig = [op.item.id, sh?.id].join('|');
    if (seenSig.has(sig)) return;
    seenSig.add(sig);

    const reasons: string[] = [];
    if (opts.season && op.item.weatherTags?.includes(opts.season)) {
      const seasonEmoji = { 봄: '🌸', 여름: '☀️', 가을: '🍂', 겨울: '❄️' }[opts.season];
      reasons.push(`${seasonEmoji} ${opts.season} 매칭`);
    }
    if (!coldStart && (idleByItem[op.item.id] ?? 0) > 14) reasons.push('🌙 오랜만에');

    result.push({
      id:    `o-${sig}`,
      label: `${op.item.name} 코디`,
      slots: { onepiece: op.item, shoes: sh, accessory: ac },
      score: op.score,
      reasons,
    });
  });

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
