/**
 * 간이 IP 기반 rate limiter — Vercel Functions / Next.js API 라우트용.
 *
 * 베이직(무료) 단계에서 단일 IP의 폭주(예: 토큰 탈취·자동화 봇) 방어선.
 * 인메모리 Map 기반이므로 Vercel 인스턴스가 재시작되면 카운트 리셋되며,
 * 다중 인스턴스에서는 일부 트래픽이 분산돼 한도가 약하게 적용된다.
 * Pro 단계에서 환경변수 RATE_LIMIT_STORE='kv'로 영속 store로 전환 가능.
 *
 * 사용법:
 *   const limited = await applyRateLimit(req, 'parser');
 *   if (limited) return limited; // 429 NextResponse
 */
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitStore } from './rateLimitStore';

export type RateLimitKey = 'vision' | 'parser' | 'nutrition' | 'url' | 'image' | 'style' | 'fridgeSection';

/** 분당 최대 요청 수 (per IP) — UI 정상 사용보다 넉넉, 폭주만 방어 */
const PER_MINUTE_LIMIT: Record<RateLimitKey, number> = {
  vision:        20,
  parser:        30,
  nutrition:     15,
  url:           20,
  image:         20,
  style:         30,
  fridgeSection: 30,
};

/** 시간당 최대 (per IP) — 일일 한도 우회 봇 방어 */
const PER_HOUR_LIMIT: Record<RateLimitKey, number> = {
  vision:        60,
  parser:        100,
  nutrition:     40,
  url:           50,
  image:         60,
  style:         100,
  fridgeSection: 120,
};

const MINUTE_MS = 60_000;
const HOUR_MS   = 60 * 60_000;

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
 * 라우트 핸들러 시작부에서 호출. 한도 초과면 NextResponse 반환, 아니면 null.
 *
 * @example
 *   export async function POST(req: NextRequest) {
 *     const limited = applyRateLimit(req, 'parser');
 *     if (limited) return limited;
 *     // ... 정상 처리
 *   }
 */
export async function applyRateLimit(req: NextRequest, key: RateLimitKey): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const did = getDeviceId(req);
  const now = Date.now();
  // IP·디바이스ID 두 차원으로 카운트해 단일 우회로 한계를 늘리지 못하게 한다.
  const ipBucketKey  = `ip:${ip}:${key}`;
  const didBucketKey = `did:${did}:${key}`;

  /** 한 키의 버킷을 진행 + 한도 검사. 초과하면 NextResponse 반환. */
  async function tickBucket(bk: string): Promise<NextResponse | null> {
    const b = await rateLimitStore.get(bk, now);
    if (now - b.minuteWindowStart >= MINUTE_MS) {
      b.minuteWindowStart = now;
      b.minuteCount = 0;
    }
    if (now - b.hourWindowStart >= HOUR_MS) {
      b.hourWindowStart = now;
      b.hourCount = 0;
    }
    b.minuteCount += 1;
    b.hourCount   += 1;
    await rateLimitStore.set(bk, b);

    const minLimit  = PER_MINUTE_LIMIT[key];
    const hourLimit = PER_HOUR_LIMIT[key];

    if (b.minuteCount > minLimit) {
      const retryAfterSec = Math.ceil((MINUTE_MS - (now - b.minuteWindowStart)) / 1000);
      return NextResponse.json(
        { error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.', retryAfter: retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }
    if (b.hourCount > hourLimit) {
      const retryAfterSec = Math.ceil((HOUR_MS - (now - b.hourWindowStart)) / 1000);
      return NextResponse.json(
        { error: '시간당 요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.', retryAfter: retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }
    return null;
  }

  // IP 차원 + deviceId 차원 둘 다 검사 — 어느 한쪽이라도 한도 초과면 차단
  const ipResult = await tickBucket(ipBucketKey);
  if (ipResult) return ipResult;
  if (did !== 'no-did' && did !== 'invalid-did') {
    const didResult = await tickBucket(didBucketKey);
    if (didResult) return didResult;
  }

  return null;
}
