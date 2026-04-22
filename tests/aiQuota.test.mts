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

test('DAILY_LIMITS — vision 10회', () => {
  assert.match(src, /vision:\s*10\b/);
});

test('DAILY_LIMITS — parser 20회', () => {
  assert.match(src, /parser:\s*20\b/);
});

test('DAILY_LIMITS — nutrition 5회', () => {
  assert.match(src, /nutrition:\s*5\b/);
});

test('DAILY_LIMITS — url 5회', () => {
  assert.match(src, /url:\s*5\b/);
});

test('aiQuota — 네 개 agent 타입 정의', () => {
  assert.match(src, /'vision'\s*\|\s*'parser'\s*\|\s*'nutrition'\s*\|\s*'url'/);
});

test('aiQuota — localStorage key는 nemoa-ai-quota', () => {
  assert.match(src, /STORAGE_KEY\s*=\s*['"]nemoa-ai-quota['"]/);
});

test('aiQuota — 자정 리셋 로직 존재 (todayStr 비교)', () => {
  assert.match(src, /state\.date\s*!==\s*todayStr\(\)/);
});
