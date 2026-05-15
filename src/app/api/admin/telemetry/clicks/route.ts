/**
 * 익명 파트너 클릭 집계 텔레메트리.
 *
 * 두 가지 메서드:
 *   POST — 사용자 기기에서 일별 집계 push (인증 없음, opt-in 클라이언트만 호출)
 *   GET  — 관리자 콘솔에서 집계 fetch (X-Admin-Token 필수)
 *
 * 프라이버시
 *   - 개별 클릭 ❌. 일별 `{ partnerId: count }` 만 수집
 *   - 사용자 식별자 없음 (`nemoa-analytics`의 day-level dayToken 도 저장 안 함)
 *   - KV 키: `telemetry:partner-clicks:YYYY-MM-DD`
 *   - 90일 후 자동 만료 (KV TTL)
 *
 * 활용
 *   - 어떤 파트너 인기인지 → 협상 우선순위 선정
 *   - 도메인 트래픽 추이 → 사용자 행동 변화 분석
 */
import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { catalogStore } from '@/lib/catalogStore';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin':  process.env.ADMIN_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Admin-Token, Content-Type',
};

const TELEMETRY_NAMESPACE = 'telemetry';
const PARTNER_CLICKS_KEY  = 'partner-clicks';

interface PartnerClickAggregate {
  /** YYYY-MM-DD */
  date:   string;
  /** { partnerId: clickCount } */
  counts: Record<string, number>;
}

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

/**
 * 사용자 기기 → 서버 push.
 * 인증 없음 (opt-in 사용자만 호출하는 패턴).
 * Rate limit: parser 그룹 (분당 20회 / 사용자)
 */
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;

  let body: PartnerClickAggregate;
  try { body = await req.json() as PartnerClickAggregate; }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  // 입력 검증 — 날짜 형식, counts 객체, 클릭 수 정상 범위
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: 'date format YYYY-MM-DD 필수' }, { status: 400 });
  }
  if (!body.counts || typeof body.counts !== 'object' || Array.isArray(body.counts)) {
    return NextResponse.json({ error: 'counts 객체 필요' }, { status: 400 });
  }

  // 비정상 클릭 수 차단 (1일 partner당 최대 1000회 추정)
  for (const [partnerId, count] of Object.entries(body.counts)) {
    if (typeof count !== 'number' || count < 0 || count > 1000) {
      return NextResponse.json({ error: `${partnerId} 클릭 수 비정상` }, { status: 400 });
    }
  }

  // 같은 날짜 누적 — 다른 사용자의 집계 합산
  const existingKey = `${PARTNER_CLICKS_KEY}:${body.date}`;
  const existing = await catalogStore.get<Record<string, number>>(TELEMETRY_NAMESPACE, existingKey);
  const merged: Record<string, number> = { ...(existing ?? {}) };
  for (const [partnerId, count] of Object.entries(body.counts)) {
    merged[partnerId] = (merged[partnerId] ?? 0) + count;
  }
  await catalogStore.set(TELEMETRY_NAMESPACE, existingKey, merged);

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}

/**
 * 관리자 콘솔에서 집계 fetch — X-Admin-Token 필수
 */
export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAdminAuth(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') ?? '30', 10)));

  // 최근 N일치 누적
  const total: Record<string, number> = {};
  const byDay: Record<string, Record<string, number>> = {};
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const key = `${PARTNER_CLICKS_KEY}:${dateStr}`;
    const dayCounts = await catalogStore.get<Record<string, number>>(TELEMETRY_NAMESPACE, key);
    if (!dayCounts) continue;
    byDay[dateStr] = dayCounts;
    for (const [partnerId, count] of Object.entries(dayCounts)) {
      total[partnerId] = (total[partnerId] ?? 0) + count;
    }
  }

  const topPartners = Object.entries(total)
    .sort((a, b) => b[1] - a[1])
    .map(([partnerId, count]) => ({ partnerId, count }));

  return NextResponse.json({
    days,
    total,
    topPartners,
    byDay,
    persistent: catalogStore.persistent,
    storeKind:  catalogStore.persistent ? 'upstash' : 'in-memory',
  }, { headers: corsHeaders });
}
