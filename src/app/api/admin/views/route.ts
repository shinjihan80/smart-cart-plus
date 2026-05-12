/**
 * 레시피 조회수 누적 API.
 *
 * POST — 한 레시피 조회 +1 (모바일 앱에서 호출, 사용자 동의 시)
 * GET  — 전체 카운트 + TOP N (관리자 콘솔용)
 *
 * 저장:
 *   - Upstash Redis HSET (키: nemoa:views:recipes, 필드: recipeId, 값: count)
 *   - 미설정 시 인메모리 fallback
 *
 * 보안:
 *   - POST는 사용자 동의 표식만 검증 (PII 미포함, 인증 불필요)
 *   - GET은 ADMIN_API_TOKEN 헤더 필수
 *   - rate limit (parser 한도)
 */
import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const KV_KEY = 'nemoa:views:recipes';

// 인메모리 fallback
const memoryCounts = new Map<string, number>();

interface RedisClient {
  hincrby: (key: string, field: string, increment: number) => Promise<number>;
  hgetall: (key: string) => Promise<Record<string, string> | null>;
}

let redisPromise: Promise<RedisClient | null> | null = null;
function getRedis(): Promise<RedisClient | null> {
  if (redisPromise) return redisPromise;
  const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) {
    redisPromise = import('@upstash/redis').then(({ Redis }) =>
      new Redis({ url, token }) as unknown as RedisClient,
    );
  } else {
    redisPromise = Promise.resolve(null);
  }
  return redisPromise;
}

async function increment(recipeId: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try { await redis.hincrby(KV_KEY, recipeId, 1); return; }
    catch { /* fallback */ }
  }
  memoryCounts.set(recipeId, (memoryCounts.get(recipeId) ?? 0) + 1);
}

async function getAll(): Promise<Record<string, number>> {
  const redis = await getRedis();
  if (redis) {
    try {
      const raw = await redis.hgetall(KV_KEY);
      if (!raw) return {};
      const result: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw)) {
        const n = typeof v === 'number' ? v : parseInt(v as string, 10);
        if (!isNaN(n)) result[k] = n;
      }
      return result;
    } catch { /* fallback */ }
  }
  const result: Record<string, number> = {};
  for (const [k, v] of memoryCounts.entries()) result[k] = v;
  return result;
}

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*', // 모바일 앱이 발행하므로 광역 허용
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Admin-Token, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;

  let body: { recipeId?: string };
  try { body = await req.json() as { recipeId?: string }; }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const recipeId = body.recipeId;
  if (!recipeId || typeof recipeId !== 'string' || recipeId.length > 64) {
    return NextResponse.json({ error: 'invalid recipeId' }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(recipeId)) {
    return NextResponse.json({ error: 'recipeId must be alphanumeric+_-' }, { status: 400 });
  }

  await increment(recipeId);

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;

  // 관리자 인증
  const expected = process.env.ADMIN_API_TOKEN;
  if (expected) {
    const provided = req.headers.get('x-admin-token');
    if (provided !== expected) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const counts = await getAll();
  // TOP 정렬
  const top = Object.entries(counts)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  const total = top.reduce((sum, x) => sum + x.count, 0);

  return NextResponse.json({
    total,
    uniqueRecipes: top.length,
    top:           top.slice(0, 50),
    persistent:    !!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL),
  }, { headers: corsHeaders });
}
