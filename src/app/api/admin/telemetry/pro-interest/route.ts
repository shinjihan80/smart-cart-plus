/**
 * 익명 Pro 관심 표시 집계 텔레메트리.
 *
 * `ProPreviewCard`의 "관심 있어요" 버튼은 기기 localStorage에
 * `nemoa-pro-interest` 플래그만 남긴다(이번이 그 지역 저장은 그대로
 * 두고, "익명 사용 통계"에 opt-in한 기기에 한해 오늘 날짜 집계에
 * +1만 보태는 걸 추가한 것).
 *
 * 두 가지 메서드:
 *   POST — 사용자 기기에서 "오늘 1건 관심 표시" push (인증 없음,
 *          opt-in 클라이언트만 호출 — `isAnalyticsEnabled()` 게이트는
 *          호출부(ProPreviewCard)에서 건다)
 *   GET  — 관리자 콘솔에서 집계 fetch (X-Admin-Token 필수)
 *
 * 프라이버시
 *   - 개별 클릭·기기 식별자 ❌. 하루 단위 총 건수만 집계
 *   - KV 키: `telemetry:pro-interest:YYYY-MM-DD`
 */
import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { catalogStore } from '@/lib/catalogStore';
import { todayKstStr } from '@/lib/dateMath';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin':  process.env.ADMIN_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Admin-Token, Content-Type',
};

const TELEMETRY_NAMESPACE = 'telemetry';
const PRO_INTEREST_KEY    = 'pro-interest';

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
 * 사용자 기기 → 서버 push. 본문 없음 — 호출 자체가 "오늘 1건".
 * Rate limit: parser 그룹 재사용(분당 20회/사용자) — 버튼은 1회만
 * 눌리게 돼 있어 사실상 절대 안 걸림, 비정상 반복 호출 방지용.
 */
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;

  const today = todayKstStr();
  const key = `${PRO_INTEREST_KEY}:${today}`;
  const existing = await catalogStore.get<number>(TELEMETRY_NAMESPACE, key);
  await catalogStore.set(TELEMETRY_NAMESPACE, key, (existing ?? 0) + 1);

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

  const byDay: Record<string, number> = {};
  let total = 0;
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = todayKstStr(d);
    const count = await catalogStore.get<number>(TELEMETRY_NAMESPACE, `${PRO_INTEREST_KEY}:${dateStr}`);
    if (!count) continue;
    byDay[dateStr] = count;
    total += count;
  }

  return NextResponse.json({
    days,
    total,
    byDay,
    persistent: catalogStore.persistent,
    storeKind:  catalogStore.persistent ? 'upstash' : 'in-memory',
  }, { headers: corsHeaders });
}
