/**
 * 관리자 파트너 CRUD API.
 *
 * GET — 현재 오버레이 (overrides) 반환
 * PUT — 파트너 활성화 + URL 등록 (overrides에 patch 저장)
 *
 * 활성화 흐름 (사용자 요청):
 *   관리자가 admin 콘솔에서 파트너의 buildUrlTemplate (예: 'https://...{query}')과 enabled=true를
 *   PUT 호출 → NEMOA 모바일이 mergedPartners()로 fetch → buildUrl 함수 자동 생성 → 즉시 연결.
 *
 * 인증: X-Admin-Token + parser rate limit
 */
import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { catalogStore } from '@/lib/catalogStore';
import { type PartnerOverlay } from '@/lib/catalogTypes';
import { PARTNERS } from '@/lib/partnerLinks';

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

async function loadOverlay(): Promise<PartnerOverlay> {
  const overrides = await catalogStore.get<PartnerOverlay['overrides']>('partners', 'overrides');
  return { overrides: overrides ?? {} };
}

const corsHeaders = {
  'Access-Control-Allow-Origin':  process.env.ADMIN_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
  // 정적 PARTNERS는 Record 형태이므로 array로 변환해 반환
  // (admin이 enabled·buildUrl 함수를 직렬화 가능 형태로 받게)
  const staticArr = Object.values(PARTNERS).map((p) => ({
    id:         p.id,
    label:      p.label,
    emoji:      p.emoji,
    domain:     p.domain,
    enabled:    p.enabled,
    comingSoon: p.comingSoon,
  }));
  return NextResponse.json({
    overlay,
    static:     staticArr,
    persistent: catalogStore.persistent,
    storeKind:  catalogStore.persistent ? 'upstash' : 'in-memory',
  }, { headers: corsHeaders });
}

export async function PUT(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;
  const auth = checkAuth(req);
  if (auth) return auth;

  let body: { id: string; patch: Record<string, unknown> };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  if (!body.id || !body.patch) {
    return NextResponse.json({ error: 'id와 patch 필요' }, { status: 400 });
  }

  // buildUrlTemplate 검증 — 빈 문자열 또는 https URL만 허용
  if ('buildUrlTemplate' in body.patch) {
    const tpl = body.patch.buildUrlTemplate;
    if (tpl !== undefined && tpl !== null && typeof tpl !== 'string') {
      return NextResponse.json({ error: 'buildUrlTemplate은 문자열이어야 합니다' }, { status: 400 });
    }
    if (typeof tpl === 'string' && tpl.length > 0 && !tpl.startsWith('https://')) {
      return NextResponse.json({ error: 'buildUrlTemplate은 https://로 시작해야 합니다' }, { status: 400 });
    }
  }

  const overlay = await loadOverlay();
  overlay.overrides[body.id] = { ...(overlay.overrides[body.id] ?? {}), ...body.patch };
  await catalogStore.set('partners', 'overrides', overlay.overrides);

  return NextResponse.json({ ok: true, overrides: overlay.overrides[body.id] }, { headers: corsHeaders });
}
