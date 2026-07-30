/**
 * AI 에이전트 호출 일별 집계 — 관리자 콘솔 "현재 사용 통계"용.
 *
 * rate limiter의 분/시 윈도우 키(rl:*)는 곧 만료되어 하루 총량·고유 기기 수를
 * 복원할 수 없으므로, 별도로 하루 단위 카운터를 쌓는다.
 *
 * 수집 항목 (전부 익명):
 *   - usage:calls:<agent>:<date>   — 에이전트별 하루 총 호출 수
 *   - usage:devices:<date>         — 하루 동안 하나 이상의 AI 기능을 쓴 고유 deviceId 집합
 *
 * deviceId는 nemoa-did 쿠키(광고/개인정보 식별자 아님, 클라이언트가 로컬 생성)이며
 * 9일 후 자동 만료 — 개별 사용자 추적이 아니라 그날의 "몇 명이 썼는지"만 남긴다.
 */
import type { NextRequest } from 'next/server';
import { usageStore } from './usageStore';

export type UsageAgent = 'vision' | 'parser' | 'nutrition' | 'url' | 'image' | 'style' | 'fridgeSection';

const RETENTION_SEC = 9 * 24 * 60 * 60; // 9일 — 관리자 콘솔 최근 7일 조회 여유분 포함

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getDeviceIdFromReq(req: NextRequest): string | null {
  const did = req.cookies.get('nemoa-did')?.value;
  if (!did) return null;
  if (did.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(did)) return null;
  return did;
}

/** 에이전트 라우트 핸들러에서 rate limit 통과 직후 호출. 실패해도 무시(fail-open). */
export async function recordAgentUsage(agent: UsageAgent, req: NextRequest): Promise<void> {
  const date = todayStr();
  const did  = getDeviceIdFromReq(req);

  await Promise.all([
    usageStore.incr(`usage:calls:${agent}:${date}`, RETENTION_SEC),
    did ? usageStore.sadd(`usage:devices:${date}`, did, RETENTION_SEC) : Promise.resolve(),
  ]);
}
