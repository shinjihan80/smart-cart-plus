/**
 * 클라이언트 에러 리포트 — 관리자 콘솔 "오류 현황"용.
 *
 * 두 가지 메서드:
 *   POST — 사용자 기기에서 에러 발생 시 push (인증 없음, opt-in 클라이언트만 호출)
 *   GET  — 관리자 콘솔에서 조회 (X-Admin-Token 필수)
 *
 * 프라이버시
 *   - errorLog.ts와 동일한 필드만 전송: message, stack(최대 10줄), source, url, userAgent
 *   - 사용자 식별자 없음 (deviceId·IP 등 저장 안 함)
 *   - KV 키: `telemetry:errors:YYYY-MM-DD`, 하루 최대 200건, 90일 후 자동 만료
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
const ERRORS_KEY = 'errors';
const MAX_PER_DAY = 200;

interface ErrorReport {
  message:   string;
  stack?:    string;
  source?:   string;
  url?:      string;
  userAgent?: string;
  ts:        number;
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

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * 사용자 기기 → 서버 push. 인증 없음 (opt-in 사용자만 호출).
 * Rate limit: parser 그룹 재사용.
 */
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;

  let body: Partial<ErrorReport>;
  try { body = await req.json() as Partial<ErrorReport>; }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  if (!body.message || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'message 필수' }, { status: 400 });
  }

  const entry: ErrorReport = {
    message:   body.message.slice(0, 500),
    stack:     typeof body.stack === 'string' ? body.stack.slice(0, 2000) : undefined,
    source:    typeof body.source === 'string' ? body.source.slice(0, 30) : undefined,
    url:       typeof body.url === 'string' ? body.url.slice(0, 300) : undefined,
    userAgent: typeof body.userAgent === 'string' ? body.userAgent.slice(0, 200) : undefined,
    ts:        Date.now(),
  };

  const date = todayStr();
  const key  = `${ERRORS_KEY}:${date}`;
  const existing = await catalogStore.get<ErrorReport[]>(TELEMETRY_NAMESPACE, key) ?? [];
  const next = [entry, ...existing].slice(0, MAX_PER_DAY);
  await catalogStore.set(TELEMETRY_NAMESPACE, key, next);

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}

/**
 * 관리자 콘솔에서 조회 — X-Admin-Token 필수.
 */
export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAdminAuth(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const days  = Math.min(14, Math.max(1, parseInt(searchParams.get('days') ?? '3', 10)));
  const limit = Math.min(300, Math.max(1, parseInt(searchParams.get('limit') ?? '100', 10)));

  const now = new Date();
  const all: ErrorReport[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayEntries = await catalogStore.get<ErrorReport[]>(TELEMETRY_NAMESPACE, `${ERRORS_KEY}:${dateStr}`);
    if (dayEntries) all.push(...dayEntries);
  }

  all.sort((a, b) => b.ts - a.ts);

  const countByMessage: Record<string, number> = {};
  for (const e of all) countByMessage[e.message] = (countByMessage[e.message] ?? 0) + 1;
  const topMessages = Object.entries(countByMessage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, count]) => ({ message, count }));

  return NextResponse.json({
    days,
    totalErrors: all.length,
    topMessages,
    entries: all.slice(0, limit),
    persistent: catalogStore.persistent,
    storeKind:  catalogStore.persistent ? 'upstash' : 'in-memory',
  }, { headers: corsHeaders });
}
