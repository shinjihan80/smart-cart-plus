/**
 * 간이 IP+디바이스 기반 rate limiter — Vercel Functions / Next.js API 라우트용.
 *
 * 베이직(무료) 단계에서 단일 IP·디바이스의 폭주(예: API 직접 호출·자동화 봇) 방어선.
 * 고정 윈도우(fixed window) 방식 — 분/시 단위 타임스탬프를 키에 포함시켜
 * `rateLimitStore.incr()` 단일 원자 연산으로 카운트한다. 동시 요청이 몰려도
 * "읽고 → 더하고 → 쓰기"처럼 중간에 값이 덮어써질 여지가 없다.
 *
 * 사용법:
 *   const limited = await applyRateLimit(req, 'parser');
 *   if (limited) return limited; // 429 NextResponse
 */
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitStore } from './rateLimitStore';

export type RateLimitKey = 'vision' | 'parser' | 'nutrition' | 'url' | 'image' | 'style' | 'fridgeSection';

/** 분당 최대 요청 수 (per IP·디바이스) — UI 정상 사용보다 넉넉, 폭주만 방어 */
const PER_MINUTE_LIMIT: Record<RateLimitKey, number> = {
  vision:        20,
  parser:        30,
  nutrition:     15,
  url:           20,
  image:         20,
  style:         30,
  fridgeSection: 30,
};

/** 시간당 최대 (per IP·디바이스) — 일일 한도 우회 봇 방어 */
const PER_HOUR_LIMIT: Record<RateLimitKey, number> = {
  vision:        60,
  parser:        100,
  nutrition:     40,
  url:           50,
  image:         60,
  style:         100,
  fridgeSection: 120,
};

const MINUTE_SEC = 60;
const HOUR_SEC   = 60 * 60;

/** Vercel·Cloudflare·표준 X-Forwarded-For에서 첫 번째 IP 추출 */
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri.trim();
  // Next.js Edge에선 req.ip 미제공일 수 있어 fallback
  return 'unknown';
}

/**
 * 디바이스 ID 쿠키 추출 — 클라이언트 측 deviceId.ts에서 발급한 nemoa-did 쿠키.
 * 쿠키 없으면 'no-did'로 폴백. 같은 IP라도 디바이스가 다르면 별도 카운트되고,
 * 같은 디바이스가 IP를 바꿔도 deviceId 카운트는 누적되므로 우회가 어려워진다.
 */
function getDeviceId(req: NextRequest): string {
  const did = req.cookies.get('nemoa-did')?.value;
  if (!did) return 'no-did';
  // 안전성 — 디바이스 ID가 비정상적으로 길거나 이상한 문자면 거부
  if (did.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(did)) return 'invalid-did';
  return did;
}

/**
 * 한 차원(ip: 또는 did:)의 분·시간 버킷을 원자적으로 증가시키고 한도 검사.
 * 초과하면 429 NextResponse, 아니면 null.
 */
async function checkDimension(
  dimensionKey: string,
  rlKey: RateLimitKey,
  now: number,
): Promise<NextResponse | null> {
  const minuteWindow = Math.floor(now / (MINUTE_SEC * 1000));
  const hourWindow   = Math.floor(now / (HOUR_SEC * 1000));

  const minuteKey = `rl:${dimensionKey}:${rlKey}:m:${minuteWindow}`;
  const hourKey   = `rl:${dimensionKey}:${rlKey}:h:${hourWindow}`;

  const minuteCount = await rateLimitStore.incr(minuteKey, MINUTE_SEC + 5);
  if (minuteCount > PER_MINUTE_LIMIT[rlKey]) {
    const retryAfterSec = MINUTE_SEC - (Math.floor(now / 1000) % MINUTE_SEC);
    return NextResponse.json(
      { error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.', retryAfter: retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    );
  }

  const hourCount = await rateLimitStore.incr(hourKey, HOUR_SEC + 60);
  if (hourCount > PER_HOUR_LIMIT[rlKey]) {
    const retryAfterSec = HOUR_SEC - (Math.floor(now / 1000) % HOUR_SEC);
    return NextResponse.json(
      { error: '시간당 요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.', retryAfter: retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    );
  }

  return null;
}

/**
 * 라우트 핸들러 시작부에서 호출. 한도 초과면 NextResponse 반환, 아니면 null.
 *
 * @example
 *   export async function POST(req: NextRequest) {
 *     const limited = await applyRateLimit(req, 'parser');
 *     if (limited) return limited;
 *     // ... 정상 처리
 *   }
 */
export async function applyRateLimit(req: NextRequest, key: RateLimitKey): Promise<NextResponse | null> {
  const ip  = getClientIp(req);
  const did = getDeviceId(req);
  const now = Date.now();

  // IP 차원 + deviceId 차원 둘 다 검사 — 어느 한쪽이라도 한도 초과면 차단
  const ipResult = await checkDimension(`ip:${ip}`, key, now);
  if (ipResult) return ipResult;

  if (did !== 'no-did' && did !== 'invalid-did') {
    const didResult = await checkDimension(`did:${did}`, key, now);
    if (didResult) return didResult;
  }

  return null;
}
