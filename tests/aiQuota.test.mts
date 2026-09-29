import { test } from 'node:test';
import assert from 'node:assert/strict';

// TIER_LIMITS 상수는 aiQuotaConstants.ts (서버/클라이언트 공유)로 분리.
// aiQuota.ts는 'use client' hook만 남기고 re-export.
// 한도가 비용 상한선이므로 실수 변경 시 테스트가 경고.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const src = readFileSync(
  resolve(__dirname, '../src/lib/aiQuota.ts'),
  'utf8',
);

const constants = readFileSync(
  resolve(__dirname, '../src/lib/aiQuotaConstants.ts'),
  'utf8',
);

// ── aiQuotaConstants.ts — TIER_LIMITS 값 검증 ───────────────────────────────

test('TIER_LIMITS.free — vision 5회', () => {
  assert.match(constants, /vision:\s*5\b/);
});

test('TIER_LIMITS.free — parser 5회 (v2.2, 10회에서 축소)', () => {
  assert.match(constants, /parser:\s*5\b/);
});

test('TIER_LIMITS.free — nutrition 2회', () => {
  assert.match(constants, /nutrition:\s*2\b/);
});

// url은 등록 시트(proOnly 잠금)·비교표("Pro 전용")와는 반대로 여기만 2가
// 남아있어 AI 한도 카드가 무료 사용자에게 "URL 분석 2/2"로 보였다(P0-14,
// 검토단/전문단 4회 독립 재확인 — 한 화면에서 3가지 다른 상태). 0으로
// 교정해 실제로 Pro 전용인 상태와 일치시킴.
test('TIER_LIMITS.free — url 0회 (Pro 전용, 등록 시트 잠금과 일치)', () => {
  assert.match(constants, /url:\s*0\b/);
});

test('TIER_LIMITS.free — fridgeSection 5회 (Phase 8.0 Step 5)', () => {
  assert.match(constants, /fridgeSection:\s*5\b/);
});

test('TIER_LIMITS.pro_lite — vision 30회', () => {
  assert.match(constants, /vision:\s*30\b/);
});

test('TIER_LIMITS.pro_max — 소프트캡(비정상 반복 호출 방지) + 마케팅상 무제한 표시', () => {
  assert.match(constants, /pro_max:\s*\{[\s\S]*?parser:\s*200/);
  assert.match(constants, /isMarketedUnlimited/);
});

test('aiQuotaConstants — 다섯 개 agent 타입 정의', () => {
  assert.match(
    constants,
    /'vision'\s*\|\s*'parser'\s*\|\s*'nutrition'\s*\|\s*'url'\s*\|\s*'fridgeSection'/,
  );
});

// ── aiQuota.ts — hook 파일 구조 검증 ─────────────────────────────────────────

test('DAILY_LIMITS — free tier 별칭 존재', () => {
  assert.match(src, /DAILY_LIMITS\s*=\s*TIER_LIMITS\.free/);
});

test('aiQuota — localStorage key는 nemoa-ai-quota', () => {
  assert.match(src, /STORAGE_KEY\s*=\s*['"]nemoa-ai-quota['"]/);
});

test('aiQuota — 자정 리셋 로직 존재 (todayStr 비교)', () => {
  assert.match(src, /state\.date\s*!==\s*todayStr\(\)/);
});
