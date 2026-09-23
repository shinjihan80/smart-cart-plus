import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateOutfits, outfitItemIds } from '../src/lib/outfitMatcher.ts';
import type { ClothingItem } from '../src/types/index.ts';

function makeItem(overrides: Partial<ClothingItem> & Pick<ClothingItem, 'id' | 'name' | 'category'>): ClothingItem {
  return {
    size:      'M',
    thickness: '보통',
    material:  '면',
    ...overrides,
  };
}

// 상의2 · 하의5 · 신발3 — P0-48 회귀 테스트 재현 조건.
// 예전엔 신발·액세서리가 [0]으로 고정 대입되고, 이중 루프+early break가
// 상의 후보 1개로 count-1장을 채워 "오늘 입을 코디" 캐러셀 6장을 넘겨도
// 신발·액세서리가 전혀 안 바뀌던 버그(C2/C4/E1/E2 confirmed).
const tops = [
  makeItem({ id: 't1', name: '흰 티셔츠', category: '상의' }),
  makeItem({ id: 't2', name: '체크 셔츠', category: '상의' }),
];
const bottoms = [
  makeItem({ id: 'b1', name: '청바지',   category: '하의' }),
  makeItem({ id: 'b2', name: '슬랙스',   category: '하의' }),
  makeItem({ id: 'b3', name: '와이드팬츠', category: '하의' }),
  makeItem({ id: 'b4', name: '치노팬츠', category: '하의' }),
  makeItem({ id: 'b5', name: '조거팬츠', category: '하의' }),
];
const shoes = [
  makeItem({ id: 's1', name: '스니커즈', category: '신발' }),
  makeItem({ id: 's2', name: '로퍼',     category: '신발' }),
  makeItem({ id: 's3', name: '샌들',     category: '신발' }),
];

test('generateOutfits — 신발 다양성: count=6이면 shoes.id distinct >= 3', () => {
  const items = [...tops, ...bottoms, ...shoes];
  const idleByItem: Record<string, number> = {};
  for (const i of items) idleByItem[i.id] = 9999; // 콜드스타트(착용 로그 0건)

  const outfits = generateOutfits(items, idleByItem, { count: 6 });

  assert.equal(outfits.length, 6);
  const shoeIds = new Set(outfits.map((o) => o.slots.shoes?.id));
  assert.ok(shoeIds.size >= 3, `신발 종류가 ${shoeIds.size}개뿐 — 로테이션 안 됨`);
});

test('generateOutfits — 라벨 다양성: count=6이면 label distinct === 6', () => {
  const items = [...tops, ...bottoms, ...shoes];
  const idleByItem: Record<string, number> = {};
  for (const i of items) idleByItem[i.id] = 9999;

  const outfits = generateOutfits(items, idleByItem, { count: 6 });

  const labels = new Set(outfits.map((o) => o.label));
  assert.equal(labels.size, 6, `라벨이 중복됨: ${[...outfits.map((o) => o.label)].join(', ')}`);
});

test('generateOutfits — 상의 한 벌이 결과를 독점하지 않는다', () => {
  const items = [...tops, ...bottoms, ...shoes];
  const idleByItem: Record<string, number> = {};
  for (const i of items) idleByItem[i.id] = 9999;

  const outfits = generateOutfits(items, idleByItem, { count: 6 });

  const topCounts = new Map<string, number>();
  for (const o of outfits) {
    const id = o.slots.top?.id;
    if (id) topCounts.set(id, (topCounts.get(id) ?? 0) + 1);
  }
  for (const [, n] of topCounts) {
    assert.ok(n <= 4, `상의 하나가 ${n}/6장을 차지 — 여전히 편중`);
  }
  assert.ok(topCounts.size >= 2, '상의가 2벌 있는데 결과엔 1벌만 등장');
});

test('generateOutfits — 아이템이 부족하면 빈 배열이 아니라 가능한 만큼 반환', () => {
  const items = [
    makeItem({ id: 't1', name: '흰 티셔츠', category: '상의' }),
    makeItem({ id: 'b1', name: '청바지', category: '하의' }),
  ];
  const outfits = generateOutfits(items, {}, { count: 6 });
  assert.equal(outfits.length, 1);
  assert.deepEqual(outfitItemIds(outfits[0]).sort(), ['b1', 't1']);
});

// 신발·액세서리 라운드로빈이 "최근 3일 이내 착용 회피"(scoreItem의 −1.5 패널티)
// 를 무시하고 그냥 idx%length로 순환시키면, 어제 신은 신발도 다시 추천에
// 섞여 들어간다 — 라운드로빈 도입 전에는 항상 최고점 1개만 뽑아서 이런 일이
// 없었다. shoeRotation/accRotation이 score<0인 아이템을 걸러내는지 검증.
test('generateOutfits — 최근 3일 이내 착용한 신발은 라운드로빈에서 제외된다', () => {
  const tops2 = [
    makeItem({ id: 't1', name: '흰 티셔츠', category: '상의' }),
    makeItem({ id: 't2', name: '체크 셔츠', category: '상의' }),
  ];
  const bottoms2 = [
    makeItem({ id: 'b1', name: '청바지', category: '하의' }),
    makeItem({ id: 'b2', name: '슬랙스', category: '하의' }),
  ];
  const shoes2 = [
    makeItem({ id: 's1', name: '어제 신은 운동화', category: '신발' }),
    makeItem({ id: 's2', name: '로퍼',            category: '신발' }),
    makeItem({ id: 's3', name: '샌들',            category: '신발' }),
  ];
  const items = [...tops2, ...bottoms2, ...shoes2];
  const idleByItem: Record<string, number> = {
    t1: 20, t2: 20, b1: 20, b2: 20,
    s1: 1, // 어제 착용 — scoreItem에서 −1.5 패널티 대상 (idleDays<=3)
    s2: 20, s3: 20,
  };

  const outfits = generateOutfits(items, idleByItem, { count: 6 });

  const s1Count = outfits.filter((o) => o.slots.shoes?.id === 's1').length;
  assert.equal(s1Count, 0, '최근 3일 이내 착용한 신발이 라운드로빈으로 다시 추천됨');
});
