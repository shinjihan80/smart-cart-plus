/**
 * 일별 AI 사용량 집계 — 관리자 콘솔 "현재 사용자 통계"용.
 *
 * GET — 관리자 콘솔에서 집계 fetch (X-Admin-Token 필수)
 *
 * 프라이버시
 *   - 개별 요청 로그 ❌. 하루 단위 "에이전트별 총 호출 수"와
 *     "하루 동안 하나 이상 사용한 고유 deviceId 개수"만 집계
 *   - 원본 deviceId 목록은 응답에 절대 포함하지 않음 (개수만)
 *   - Redis 키 9일 후 자동 만료
 *
 * 데이터 출처: src/lib/usageTelemetry.ts (각 AI 에이전트 라우트에서 rate limit
 * 통과 직후 기록)
 */
import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { usageStore } from '@/lib/usageStore';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin':  process.env.ADMIN_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Admin-Token, Content-Type',
};

const AGENTS = ['vision', 'parser', 'nutrition', 'url', 'image', 'style', 'fridgeSection'] as const;

function checkAdminAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return null;
  const provided = req.headers.get('x-admin-token');
  if (provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  // 이 엔드포인트 자체는 AI 에이전트가 아니므로 usage 집계에는 안 잡히는
  // 별도 rate-limit 그룹(parser 버킷 재사용)만 통과시킨다 — recordAgentUsage는 호출 안 함.
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAdminAuth(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const days = Math.min(30, Math.max(1, parseInt(searchParams.get('days') ?? '7', 10)));

  const now = new Date();
  const dates: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const byDay: Record<string, { activeDevices: number; calls: Record<string, number>; totalCalls: number }> = {};
  const totalCallsByAgent: Record<string, number> = {};
  let totalCallsAll = 0;

  for (const date of dates) {
    const activeDevices = await usageStore.scard(`usage:devices:${date}`);
    const calls: Record<string, number> = {};
    let dayTotal = 0;
    for (const agent of AGENTS) {
      const count = await usageStore.get(`usage:calls:${agent}:${date}`);
      calls[agent] = count;
      dayTotal += count;
      totalCallsByAgent[agent] = (totalCallsByAgent[agent] ?? 0) + count;
    }
    totalCallsAll += dayTotal;
    byDay[date] = { activeDevices, calls, totalCalls: dayTotal };
  }

  return NextResponse.json({
    days,
    today: dates[0],
    todayActiveDevices: byDay[dates[0]]?.activeDevices ?? 0,
    todayTotalCalls:     byDay[dates[0]]?.totalCalls ?? 0,
    totalCallsAll,
    totalCallsByAgent,
    byDay,
    persistent: usageStore.persistent,
    storeKind:  usageStore.persistent ? 'upstash' : 'in-memory',
  }, { headers: corsHeaders });
}
