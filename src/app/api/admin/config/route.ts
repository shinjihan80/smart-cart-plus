import { NextResponse, type NextRequest } from 'next/server';
import { TIER_LIMITS, RATE_LIMITS } from '@/lib/aiQuotaConstants';

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

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Admin-Token, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  const tierLimitsJson = Object.fromEntries(
    Object.entries(TIER_LIMITS).map(([tier, limits]) => [
      tier,
      Object.fromEntries(
        Object.entries(limits).map(([agent, n]) => [agent, isFinite(n) ? n : null]),
      ),
    ]),
  );

  return NextResponse.json(
    { tierLimits: tierLimitsJson, rateLimits: RATE_LIMITS },
    { headers: { ...CORS, 'Cache-Control': 'public, max-age=3600' } },
  );
}
