import { test } from 'node:test';
import assert from 'node:assert/strict';

import { expiryLabel, groupExpiryPhrase } from '../src/lib/expiryThresholds.ts';

// P0-68(P0-53 재발) 회귀 테스트 — D-1(내일까지) 품목을 "오늘"로 잘못
// 말하는 패턴이 5곳에서 반복됐다. 소비처들이 공유하는 이 두 함수가
// 모든 경계에서 정확한 문구를 내는지 고정해 재발을 막는다.

test('expiryLabel — D-0은 "오늘까지", D-1은 "내일까지"(혼동 금지)', () => {
  assert.equal(expiryLabel(0), '오늘까지');
  assert.equal(expiryLabel(1), '내일까지');
  assert.equal(expiryLabel(2), '2일 남음');
  assert.equal(expiryLabel(-1), '기한 초과');
});

test('groupExpiryPhrase — 전부 D-0이면 "오늘까지"', () => {
  assert.equal(groupExpiryPhrase([0, 0]), '오늘까지');
});

test('groupExpiryPhrase — 전부 D-1이면 "내일까지"(D-0으로 오인 금지)', () => {
  assert.equal(groupExpiryPhrase([1, 1, 1]), '내일까지');
  assert.equal(groupExpiryPhrase([1]), '내일까지');
});

test('groupExpiryPhrase — D-0과 D-1이 섞이면 "오늘·내일"', () => {
  assert.equal(groupExpiryPhrase([0, 1]), '오늘·내일');
});

test('groupExpiryPhrase — 빈 배열은 빈 문자열', () => {
  assert.equal(groupExpiryPhrase([]), '');
});
