import { test } from 'node:test';
import assert from 'node:assert/strict';

import { localMidnight, daysBetween, todayLocalStr, expiryDateStr, expiryDateLabel } from '../src/lib/dateMath.ts';

test('localMidnight — "YYYY-MM-DD"를 로컬 자정으로 파싱', () => {
  const d = localMidnight('2026-09-27');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 8); // 0-indexed
  assert.equal(d.getDate(), 27);
  assert.equal(d.getHours(), 0);
});

test('daysBetween — 두 자정 사이 정수 일수 차이', () => {
  assert.equal(daysBetween(localMidnight('2026-09-27'), localMidnight('2026-09-28')), 1);
  assert.equal(daysBetween(localMidnight('2026-09-27'), localMidnight('2026-09-27')), 0);
  assert.equal(daysBetween(localMidnight('2026-09-28'), localMidnight('2026-09-27')), -1);
});

test('daysBetween — 윤년(2028) 2/29 경계', () => {
  assert.equal(daysBetween(localMidnight('2028-02-28'), localMidnight('2028-03-01')), 2);
});

test('expiryDateStr — 구매일 + 보관일수 = 만료일', () => {
  assert.equal(expiryDateStr({ purchaseDate: '2026-09-17', baseShelfLifeDays: 10 }), '2026-09-27');
});

test('expiryDateStr — 730일(2년) 보관 시 해를 두 번 넘김', () => {
  assert.equal(expiryDateStr({ purchaseDate: '2026-09-27', baseShelfLifeDays: 730 }), '2028-09-26');
});

test('expiryDateLabel — 올해 만료면 연도 생략(MM/DD)', () => {
  const today = new Date(2026, 8, 27); // 2026-09-27
  const label = expiryDateLabel({ purchaseDate: '2026-09-20', baseShelfLifeDays: 10 }, today);
  assert.equal(label, '09/30');
});

test('expiryDateLabel — 해가 바뀌면 연도 포함(YYYY.MM.DD) — P0-55', () => {
  // 오늘 2026-09-27 기준, 365일 보관 식품(간장류)은 2027-09-27 만료
  const today = new Date(2026, 8, 27);
  const label = expiryDateLabel({ purchaseDate: '2026-09-27', baseShelfLifeDays: 365 }, today);
  assert.equal(label, '2027.09.27');
});

test('expiryDateLabel — 730일 보관도 연도 포함', () => {
  const today = new Date(2026, 8, 27);
  const label = expiryDateLabel({ purchaseDate: '2026-09-27', baseShelfLifeDays: 730 }, today);
  assert.equal(label, '2028.09.26');
});

test('expiryDateLabel — 기한 지난 품목(expired)도 라벨 형식 동일', () => {
  const today = new Date(2026, 8, 27);
  const label = expiryDateLabel({ purchaseDate: '2026-09-01', baseShelfLifeDays: 5 }, today);
  assert.equal(label, '09/06');
});

test('todayLocalStr — 로컬 자정 기준 YYYY-MM-DD', () => {
  assert.equal(todayLocalStr(new Date(2026, 8, 27, 23, 59)), '2026-09-27');
  assert.equal(todayLocalStr(new Date(2026, 8, 27, 0, 1)), '2026-09-27');
});
