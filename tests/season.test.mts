import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  currentSeasonByMonth,
  matchesSeason,
  seasonStart,
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
