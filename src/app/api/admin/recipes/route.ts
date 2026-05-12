/**
 * 관리자 레시피 CRUD API.
 *
 * GET    — 현재 오버레이 (created/updated/deleted) 반환
 * POST   — 새 레시피 추가 (created에 push)
 * PUT    — 정적 또는 신규 레시피 수정 (updated에 patch 저장)
 * DELETE — 레시피 비활성화 (deleted에 id 추가)
 *
 * 인증: X-Admin-Token 헤더 (ADMIN_API_TOKEN 환경변수)
 * Rate limit: parser 한도
 *
 * 영속성:
 *   - CATALOG_STORE='upstash' 활성 시 Upstash Redis에 영속
 *   - 미설정 시 인메모리 — Vercel Function 재시작 시 손실 (운영자 인지 필요)
 */
import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { catalogStore } from '@/lib/catalogStore';
import { type RecipeOverlay, EMPTY_RECIPE_OVERLAY } from '@/lib/catalogTypes';
import { RECIPES, type Recipe } from '@/lib/recipes';

export const runtime = 'nodejs';

function checkAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return null; // 토큰 미설정 시 인증 생략 (개발 편의)
  const provided = req.headers.get('x-admin-token');
  if (provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}

async function loadOverlay(): Promise<RecipeOverlay> {
  const created = await catalogStore.get<Recipe[]>('recipes', 'created');
  const updated = await catalogStore.get<Record<string, Partial<Recipe>>>('recipes', 'updated');
  const deleted = await catalogStore.get<string[]>('recipes', 'deleted');
  return {
    created: created ?? EMPTY_RECIPE_OVERLAY.created,
    updated: updated ?? EMPTY_RECIPE_OVERLAY.updated,
    deleted: deleted ?? EMPTY_RECIPE_OVERLAY.deleted,
  };
}

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  // GET은 공개 — 모바일 앱(useMergedCatalog)이 오버레이를 읽어 정적 카탈로그와 merge하기 때문.
  // 정적 RECIPES는 어차피 클라이언트 번들에 포함되며, 오버레이만 추가 노출됨.

  const overlay = await loadOverlay();
  // 정적 카탈로그 + 오버레이를 한 번에 반환 — admin이 두 섹션을 표시할 수 있도록
  return NextResponse.json({
    overlay,
    static:     RECIPES, // 코드에 보관된 107종
    persistent: catalogStore.persistent,
    storeKind:  catalogStore.persistent ? 'upstash' : 'in-memory',
  }, {
    headers: {
      'Access-Control-Allow-Origin':  process.env.ADMIN_ORIGIN ?? '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Admin-Token, Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  process.env.ADMIN_ORIGIN ?? '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Admin-Token, Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAuth(req);
  if (auth) return auth;

  let body: Partial<Recipe>;
  try { body = await req.json() as Partial<Recipe>; }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  // 필수 필드 검증
  if (!body.name || !body.emoji || !Array.isArray(body.keywords) || !body.time || !body.difficulty || !Array.isArray(body.steps)) {
    return NextResponse.json({ error: '필수 필드 누락 (name, emoji, keywords, time, difficulty, steps)' }, { status: 400 });
  }

  const overlay = await loadOverlay();
  const id = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const recipe: Recipe = {
    id,
    name:       body.name,
    emoji:      body.emoji,
    keywords:   body.keywords,
    time:       body.time,
    difficulty: body.difficulty,
    steps:      body.steps,
    tags:       body.tags,
    blurb:      body.blurb,
    seasons:    body.seasons,
    chef:       body.chef,
    source:     body.source,
    imageUrl:   body.imageUrl,
    videoUrl:   body.videoUrl,
    videoLabel: body.videoLabel,
  };

  overlay.created.push(recipe);
  await catalogStore.set('recipes', 'created', overlay.created);

  return NextResponse.json({ ok: true, recipe });
}

export async function PUT(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAuth(req);
  if (auth) return auth;

  let body: { id: string; patch: Partial<Recipe> };
  try { body = await req.json() as { id: string; patch: Partial<Recipe> }; }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  if (!body.id || !body.patch) {
    return NextResponse.json({ error: 'id와 patch 필요' }, { status: 400 });
  }

  const overlay = await loadOverlay();
  // admin-* prefix는 created 배열의 객체 직접 수정
  if (body.id.startsWith('admin-')) {
    const idx = overlay.created.findIndex((r) => r.id === body.id);
    if (idx === -1) return NextResponse.json({ error: 'recipe not found' }, { status: 404 });
    overlay.created[idx] = { ...overlay.created[idx], ...body.patch };
    await catalogStore.set('recipes', 'created', overlay.created);
  } else {
    // 정적 레시피 — updated에 patch 저장
    overlay.updated[body.id] = { ...(overlay.updated[body.id] ?? {}), ...body.patch };
    await catalogStore.set('recipes', 'updated', overlay.updated);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAuth(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 쿼리 필요' }, { status: 400 });

  const overlay = await loadOverlay();
  if (id.startsWith('admin-')) {
    overlay.created = overlay.created.filter((r) => r.id !== id);
    await catalogStore.set('recipes', 'created', overlay.created);
  } else {
    if (!overlay.deleted.includes(id)) {
      overlay.deleted.push(id);
      await catalogStore.set('recipes', 'deleted', overlay.deleted);
    }
  }

  return NextResponse.json({ ok: true });
}
