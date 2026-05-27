import { test } from 'node:test';
import assert from 'node:assert/strict';

// aiQuota.ts는 'use client' + React hook을 포함 → 모듈 전체 import 불가.
// 대신 베이직 한도 상수가 기대치와 맞는지만 검증 (회귀 방지).
// Pro 출시 이전엔 이 한도가 비용 상한선이므로 실수 변경 시 테스트가 경고.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, '../src/lib/aiQuota.ts'),
  'utf8',
);

test('TIER_LIMITS.free — vision 5회', () => {
  assert.match(src, /vision:\s*5\b/);
});

test('TIER_LIMITS.free — parser 10회', () => {
  assert.match(src, /parser:\s*10\b/);
});

test('TIER_LIMITS.free — nutrition 2회', () => {
  assert.match(src, /nutrition:\s*2\b/);
});

test('TIER_LIMITS.free — url 2회', () => {
  assert.match(src, /url:\s*2\b/);
});

test('TIER_LIMITS.free — fridgeSection 5회 (Phase 8.0 Step 5)', () => {
  assert.match(src, /fridgeSection:\s*5\b/);
});

test('TIER_LIMITS.pro_lite — vision 30회', () => {
  assert.match(src, /vision:\s*30\b/);
});

test('TIER_LIMITS.pro_max — Infinity 정의', () => {
  assert.match(src, /Infinity/);
});

test('DAILY_LIMITS — free tier 별칭 존재', () => {
  assert.match(src, /DAILY_LIMITS\s*=\s*TIER_LIMITS\.free/);
});

test('aiQuota — 다섯 개 agent 타입 정의', () => {
  assert.match(
    src,
    /'vision'\s*\|\s*'parser'\s*\|\s*'nutrition'\s*\|\s*'url'\s*\|\s*'fridgeSection'/,
  );
});

test('aiQuota — localStorage key는 nemoa-ai-quota', () => {
  assert.match(src, /STORAGE_KEY\s*=\s*['"]nemoa-ai-quota['"]/);
});

test('aiQuota — 자정 리셋 로직 존재 (todayStr 비교)', () => {
  assert.match(src, /state\.date\s*!==\s*todayStr\(\)/);
});
