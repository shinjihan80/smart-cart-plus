import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  currentSeasonByMonth,
  matchesSeason,
  seasonStart,
  hasSeasonCycled,
} from '../src/lib/season.ts';

test('currentSeasonByMonth — 12월, 1월, 2월 → 겨울', () => {
  assert.equal(currentSeasonByMonth(new Date('2026-12-15')), '겨울');
  assert.equal(currentSeasonByMonth(new Date('2026-01-01')), '겨울');
  assert.equal(currentSeasonByMonth(new Date('2026-02-28')), '겨울');
});

test('currentSeasonByMonth — 3~5월 → 봄', () => {
  assert.equal(currentSeasonByMonth(new Date('2026-03-01')), '봄');
  assert.equal(currentSeasonByMonth(new Date('2026-04-15')), '봄');
  assert.equal(currentSeasonByMonth(new Date('2026-05-31')), '봄');
});

test('currentSeasonByMonth — 6~8월 → 여름', () => {
  assert.equal(currentSeasonByMonth(new Date('2026-06-01')), '여름');
  assert.equal(currentSeasonByMonth(new Date('2026-07-15')), '여름');
  assert.equal(currentSeasonByMonth(new Date('2026-08-31')), '여름');
});

test('currentSeasonByMonth — 9~11월 → 가을', () => {
  assert.equal(currentSeasonByMonth(new Date('2026-09-01')), '가을');
  assert.equal(currentSeasonByMonth(new Date('2026-10-15')), '가을');
  assert.equal(currentSeasonByMonth(new Date('2026-11-30')), '가을');
});

test('matchesSeason — 태그 비면 null', () => {
  assert.equal(matchesSeason(undefined, '봄'), null);
  assert.equal(matchesSeason([], '봄'), null);
});

test('matchesSeason — 태그 있고 계절 일치 → true', () => {
  assert.equal(matchesSeason(['봄', '가을'], '봄'), true);
  assert.equal(matchesSeason(['겨울'], '겨울'), true);
});

test('matchesSeason — 태그 있고 계절 불일치 → false', () => {
  assert.equal(matchesSeason(['봄'], '겨울'), false);
  assert.equal(matchesSeason(['여름', '가을'], '봄'), false);
});

test('seasonStart — 각 계절의 시작월 1일', () => {
  assert.equal(seasonStart('봄',   2026), '2026-03-01');
  assert.equal(seasonStart('여름', 2026), '2026-06-01');
  assert.equal(seasonStart('가을', 2026), '2026-09-01');
  assert.equal(seasonStart('겨울', 2026), '2026-12-01');
});

test('seasonStart — year 미지정 시 올해', () => {
  const currentYear = new Date().getFullYear();
  assert.ok(seasonStart('봄').startsWith(String(currentYear)));
});

test('hasSeasonCycled — 등록일 없는 레거시 아이템은 항상 true', () => {
  assert.equal(hasSeasonCycled(['겨울'], undefined, new Date('2026-09-29')), true);
});

test('hasSeasonCycled — 계절 태그 없는 옷은 항상 true', () => {
  assert.equal(hasSeasonCycled(undefined, '2026-09-01', new Date('2026-09-29')), true);
  assert.equal(hasSeasonCycled([], '2026-09-01', new Date('2026-09-29')), true);
  assert.equal(hasSeasonCycled(['우천', '맑음'], '2026-09-01', new Date('2026-09-29')), true);
});

test('hasSeasonCycled — 지금이 이미 그 옷의 계절이면 true', () => {
  // 가을 옷을 가을에 등록 — 등록일 직후라도 바로 입을 기회가 있었음
  assert.equal(hasSeasonCycled(['가을'], '2026-09-25', new Date('2026-09-29')), true);
});

test('hasSeasonCycled — 다른 계절 등록 후 그 계절이 아직 안 왔으면 false', () => {
  // 겨울 코트를 여름(2026-07-01)에 등록, 아직 가을 초입(2026-09-29) — 겨울 시작(12/1) 전
  assert.equal(hasSeasonCycled(['겨울'], '2026-07-01', new Date('2026-09-29')), false);
});

test('hasSeasonCycled — 등록 이후 그 계절 시작일이 지났으면 true', () => {
  // 겨울 코트를 작년 여름(2025-07-01)에 등록, 지금은 2026-09-29 — 그사이 겨울(2025-12-01)이 지났음
  assert.equal(hasSeasonCycled(['겨울'], '2025-07-01', new Date('2026-09-29')), true);
});
