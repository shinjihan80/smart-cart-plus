/**
 * 관리자 제철 재료 CRUD API.
 *
 * GET    — 오버레이 반환
 * POST   — 새 제철 재료 추가
 * DELETE — 제철 재료 비활성화 (name 기준)
 *
 * 인증: X-Admin-Token + parser rate limit
 */
import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { catalogStore } from '@/lib/catalogStore';
import { type SeasonalOverlay } from '@/lib/catalogTypes';
import { SEASONAL_PRODUCE, type SeasonalProduce } from '@/lib/seasonalProduce';

export const runtime = 'nodejs';

function checkAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return null;
  const provided = req.headers.get('x-admin-token');
  if (provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}

async function loadOverlay(): Promise<SeasonalOverlay> {
  const created = await catalogStore.get<SeasonalProduce[]>('seasonal', 'created');
  const updated = await catalogStore.get<Record<string, Partial<SeasonalProduce>>>('seasonal', 'updated');
  const deleted = await catalogStore.get<string[]>('seasonal', 'deleted');
  return {
    created: created ?? [],
    updated: updated ?? {},
    deleted: deleted ?? [],
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin':  process.env.ADMIN_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Admin-Token, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  // GET은 공개 — useMergedCatalog가 정적 카탈로그와 merge.

  const overlay = await loadOverlay();
  return NextResponse.json({
    overlay,
    static:     SEASONAL_PRODUCE, // 코드에 보관된 48종
    persistent: catalogStore.persistent,
  }, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAuth(req);
  if (auth) return auth;

  let body: Partial<SeasonalProduce>;
  try { body = await req.json() as Partial<SeasonalProduce>; }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  if (!body.name || !body.emoji || !Array.isArray(body.seasons) || !body.foodCategory) {
    return NextResponse.json({ error: '필수 필드 누락 (name, emoji, seasons, foodCategory)' }, { status: 400 });
  }

  const overlay = await loadOverlay();
  // 중복 체크
  if (overlay.created.some((p) => p.name === body.name)) {
    return NextResponse.json({ error: '같은 이름 이미 존재' }, { status: 409 });
  }

  overlay.created.push(body as SeasonalProduce);
  await catalogStore.set('seasonal', 'created', overlay.created);
  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}

export async function PUT(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAuth(req);
  if (auth) return auth;

  let body: { name: string; patch: Partial<SeasonalProduce> };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  if (!body.name || !body.patch) {
    return NextResponse.json({ error: 'name과 patch 필요' }, { status: 400 });
  }

  const overlay = await loadOverlay();
  // created에 있으면 직접 patch
  const idx = overlay.created.findIndex((p) => p.name === body.name);
  if (idx !== -1) {
    overlay.created[idx] = { ...overlay.created[idx], ...body.patch };
    await catalogStore.set('seasonal', 'created', overlay.created);
  } else {
    // 정적 데이터 — updated에 patch 누적
    overlay.updated[body.name] = { ...(overlay.updated[body.name] ?? {}), ...body.patch };
    await catalogStore.set('seasonal', 'updated', overlay.updated);
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}

export async function DELETE(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAuth(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  if (!name) return NextResponse.json({ error: 'name 쿼리 필요' }, { status: 400 });

  const overlay = await loadOverlay();
  // created에 있으면 제거
  const beforeLen = overlay.created.length;
  overlay.created = overlay.created.filter((p) => p.name !== name);
  if (overlay.created.length !== beforeLen) {
    await catalogStore.set('seasonal', 'created', overlay.created);
  } else if (!overlay.deleted.includes(name)) {
    // 정적 데이터 비활성화
    overlay.deleted.push(name);
    await catalogStore.set('seasonal', 'deleted', overlay.deleted);
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}
