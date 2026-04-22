import { test } from 'node:test';
import assert from 'node:assert/strict';

import { estimateCycles } from '../src/lib/purchaseCycle.ts';

const FOOD = '식품';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

test('estimateCycles — 1회만 소진된 품목은 제외 (기본 minOccurrences=2)', () => {
  const result = estimateCycles([
    { name: '우유', category: FOOD, date: daysAgo(5) },
  ]);
  assert.equal(result.length, 0);
});

test('estimateCycles — 식품 아닌 카테고리는 제외', () => {
  const result = estimateCycles([
    { name: '셔츠', category: '의류', date: daysAgo(10) },
    { name: '셔츠', category: '의류', date: daysAgo(2) },
  ]);
  assert.equal(result.length, 0);
});

test('estimateCycles — 2회 소진 시 평균 주기 계산', () => {
  // 10일 간격으로 2번 소진 → 주기 10일
  const result = estimateCycles([
    { name: '우유', category: FOOD, date: daysAgo(15) },
    { name: '우유', category: FOOD, date: daysAgo(5) },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, '우유');
  assert.equal(result[0].cycleDays, 10);
  assert.equal(result[0].occurrences, 2);
});

test('estimateCycles — dueInDays는 주기 - 마지막소진 이후 경과일', () => {
  // 10일 주기, 마지막 소진 5일 전 → 5일 뒤 다음 소진 예상
  const result = estimateCycles([
    { name: '우유', category: FOOD, date: daysAgo(15) },
    { name: '우유', category: FOOD, date: daysAgo(5) },
  ]);
  assert.equal(result[0].dueInDays, 5);
});

test('estimateCycles — 3회 이상도 평균으로 집계', () => {
  // 간격 5, 5, 5 → 평균 5
  const result = estimateCycles([
    { name: '달걀', category: FOOD, date: daysAgo(20) },
    { name: '달걀', category: FOOD, date: daysAgo(15) },
    { name: '달걀', category: FOOD, date: daysAgo(10) },
    { name: '달걀', category: FOOD, date: daysAgo(5) },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].cycleDays, 5);
  assert.equal(result[0].occurrences, 4);
});

test('estimateCycles — dueInDays 작은 순으로 정렬', () => {
  // 우유: 이미 3일 지남 / 달걀: 5일 남음
  const result = estimateCycles([
    { name: '우유', category: FOOD, date: daysAgo(23) },
    { name: '우유', category: FOOD, date: daysAgo(13) },   // 주기 10일, 13일 전 → -3
    { name: '달걀', category: FOOD, date: daysAgo(15) },
    { name: '달걀', category: FOOD, date: daysAgo(5) },    // 주기 10일, 5일 전 → 5
  ]);
  assert.equal(result[0].name, '우유');
  assert.equal(result[1].name, '달걀');
  assert.ok(result[0].dueInDays < result[1].dueInDays);
});

test('estimateCycles — date 없으면 제외', () => {
  const result = estimateCycles([
    { name: '우유', category: FOOD, date: '' },
    { name: '우유', category: FOOD, date: daysAgo(5) },
  ]);
  // date 있는 건 1건뿐 → minOccurrences 미달
  assert.equal(result.length, 0);
});

test('estimateCycles — minOccurrences 파라미터 동작', () => {
  // 2회 소진됐지만 min=3 이면 제외
  const result = estimateCycles(
    [
      { name: '우유', category: FOOD, date: daysAgo(15) },
      { name: '우유', category: FOOD, date: daysAgo(5) },
    ],
    3,
  );
  assert.equal(result.length, 0);
});
