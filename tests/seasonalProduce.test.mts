import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SEASONAL_PRODUCE,
  currentSeasonalProduce,
  isSeasonalProduce,
  lookupSeasonalEmoji,
} from '../src/lib/seasonalProduce.ts';

test('SEASONAL_PRODUCE — 최소 30종 이상 보유', () => {
  assert.ok(SEASONAL_PRODUCE.length >= 30, `got ${SEASONAL_PRODUCE.length}`);
});

test('SEASONAL_PRODUCE — 모든 항목에 seasons 비어있지 않음', () => {
  for (const p of SEASONAL_PRODUCE) {
    assert.ok(p.seasons.length > 0, `${p.name} has empty seasons`);
    assert.ok(p.baseShelfLifeDays > 0, `${p.name} has invalid shelf life`);
    assert.ok(p.emoji.length > 0, `${p.name} missing emoji`);
  }
});

test('SEASONAL_PRODUCE — peak 값이 있으면 seasons 안에 포함', () => {
  for (const p of SEASONAL_PRODUCE) {
    if (p.peak) {
      assert.ok(
        p.seasons.includes(p.peak),
        `${p.name} peak=${p.peak} not in seasons=${p.seasons.join(',')}`,
      );
    }
  }
});

test('currentSeasonalProduce — 봄에 딸기 포함', () => {
  const spring = currentSeasonalProduce('봄', 20);
  const names  = spring.map((p) => p.name);
  assert.ok(names.includes('딸기'));
});

test('currentSeasonalProduce — 겨울에 귤·굴 포함', () => {
  const winter = currentSeasonalProduce('겨울', 20);
  const names  = winter.map((p) => p.name);
  assert.ok(names.includes('귤'));
  assert.ok(names.includes('굴'));
});

test('currentSeasonalProduce — limit 파라미터 존중', () => {
  const result = currentSeasonalProduce('봄', 3);
  assert.equal(result.length, 3);
});

test('currentSeasonalProduce — peak이 해당 계절인 항목이 앞에 정렬', () => {
  const fall = currentSeasonalProduce('가을', 20);
  // peak이 가을인 건 모두 peak 아닌 것보다 앞에 와야 함
  let seenNonPeak = false;
  for (const p of fall) {
    if (p.peak === '가을') {
      assert.equal(seenNonPeak, false, `${p.name} is peak but appears after non-peak`);
    } else {
      seenNonPeak = true;
    }
  }
});

test('isSeasonalProduce — 정확한 이름 매칭', () => {
  assert.equal(isSeasonalProduce('딸기', '봄'),   true);
  assert.equal(isSeasonalProduce('딸기', '여름'), false);
  assert.equal(isSeasonalProduce('굴',   '겨울'), true);
});

test('isSeasonalProduce — 부분 문자열 매칭 (예: "신선한 딸기")', () => {
  assert.equal(isSeasonalProduce('신선한 딸기', '봄'), true);
  assert.equal(isSeasonalProduce('제주 귤',     '겨울'), true);
});

test('isSeasonalProduce — 등록되지 않은 품목은 false', () => {
  assert.equal(isSeasonalProduce('햄버거', '봄'), false);
  assert.equal(isSeasonalProduce('치즈',   '여름'), false);
});

test('lookupSeasonalEmoji — 매칭 성공 시 이모지 반환', () => {
  assert.equal(lookupSeasonalEmoji('딸기'),       '🍓');
  assert.equal(lookupSeasonalEmoji('수박'),       '🍉');
  assert.equal(lookupSeasonalEmoji('신선한 딸기'), '🍓');
});

test('lookupSeasonalEmoji — 매칭 실패 시 null', () => {
  assert.equal(lookupSeasonalEmoji('햄버거'), null);
  assert.equal(lookupSeasonalEmoji(''),      null);
});
