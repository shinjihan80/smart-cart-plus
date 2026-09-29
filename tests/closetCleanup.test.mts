import { test } from 'node:test';
import assert from 'node:assert/strict';

import { findCleanupCandidates } from '../src/lib/closetCleanup.ts';
import { hasSeasonCycled } from '../src/lib/season.ts';
import { todayLocalStr } from '../src/lib/dateMath.ts';
import type { ClothingItem } from '../src/types/index.ts';

// daysAgo — 로컬 기준 "오늘로부터 n일 전" (P0-53 배경과 동일한 이유로
// toISOString() 대신 todayLocalStr 사용, purchaseCycle.test.mts 참고).
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayLocalStr(d);
}

function clothingItem(overrides: Partial<ClothingItem> = {}): ClothingItem {
  return {
    id:        'c1',
    name:      '테스트 상의',
    category:  '상의',
    size:      'M',
    thickness: '보통',
    material:  '면',
    ...overrides,
  };
}

test('findCleanupCandidates — 오늘 등록해 착용 로그 없는 옷은 후보에서 제외', () => {
  const item = clothingItem({ registeredAt: todayLocalStr() });
  const candidates = findCleanupCandidates([item], {});
  assert.deepEqual(candidates, []);
});

test('findCleanupCandidates — 등록 90일+ & 계절 무관 옷(태그 없음)은 후보', () => {
  const item = clothingItem({ registeredAt: daysAgo(100) });
  const candidates = findCleanupCandidates([item], {});
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].item.id, 'c1');
});

test('findCleanupCandidates — 90일 게이트를 통과해도 계절 게이트(hasSeasonCycled)를 따른다', () => {
  // 실제 프로덕션 로직(hasSeasonCycled)으로 기대값을 계산해, 테스트를 어떤
  // 날짜에 돌리든(계절 무관) 안정적으로 검증한다.
  const registeredAt = daysAgo(95);
  const weatherTags: ClothingItem['weatherTags'] = ['겨울'];
  const item = clothingItem({ registeredAt, weatherTags });
  const candidates = findCleanupCandidates([item], {});
  const expected = hasSeasonCycled(weatherTags, registeredAt, new Date());
  assert.equal(candidates.length, expected ? 1 : 0);
});

test('findCleanupCandidates — registeredAt 없는 레거시 아이템은 게이트 미적용(기존 동작 유지)', () => {
  const item = clothingItem(); // registeredAt 없음
  const candidates = findCleanupCandidates([item], {});
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].reason, '아직 한 번도 안 입었어요');
});

test('findCleanupCandidates — 게이트 통과한 옷은 기존 미착용/유휴 규칙 그대로 적용', () => {
  const worn = clothingItem({ id: 'c2', registeredAt: daysAgo(200) });
  const candidates = findCleanupCandidates([worn], { c2: [daysAgo(70)] });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].idleDays, 70);
});
