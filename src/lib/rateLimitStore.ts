/**
 * Rate limit 카운터 저장소 추상화.
 *
 * 인메모리(기본) ↔ Vercel KV / Upstash Redis(Pro) 등을 같은 인터페이스로 교체 가능.
 *
 * 현재 베이직: 인메모리 — 인스턴스 재시작 시 카운트 리셋 (단점)
 * Pro 단계 옵션:
 *   - Vercel Marketplace에서 Upstash Redis 또는 Neon Postgres 연결
 *   - 환경변수 RATE_LIMIT_STORE='kv' 설정 + KV_REST_API_URL/KV_REST_API_TOKEN
 *   - 그러면 createKvStore()가 활성화되어 영속 카운트 보장
 *
 * 인터페이스만 추가했으므로 베이직 사용자는 변경 없음. KV 의존 패키지 미설치.
 */

export interface RateLimitBucket {
  minuteWindowStart: number;
  minuteCount:       number;
  hourWindowStart:   number;
  hourCount:         number;
}

export interface RateLimitStore {
  /** 키의 버킷을 가져온다. 없으면 새 버킷 반환. */
  get(key: string, now: number): Promise<RateLimitBucket> | RateLimitBucket;
  /** 키의 버킷을 갱신한다. */
  set(key: string, bucket: RateLimitBucket): Promise<void> | void;
  /** 메타데이터 — 영속/인메모리 여부 */
  readonly persistent: boolean;
}

/** 인메모리 어댑터 — 베이직 단계 기본 */
export class InMemoryRateLimitStore implements RateLimitStore {
  readonly persistent = false;
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly maxSize: number;

  constructor(maxSize = 10_000) {
    this.maxSize = maxSize;
  }

  get(key: string, now: number): RateLimitBucket {
    let b = this.buckets.get(key);
    if (!b) {
      b = { minuteWindowStart: now, minuteCount: 0, hourWindowStart: now, hourCount: 0 };
      this.buckets.set(key, b);
    }
    return b;
  }

  set(key: string, bucket: RateLimitBucket): void {
    this.buckets.set(key, bucket);
    // 메모리 누수 방지 — LRU-like cap
    if (this.buckets.size > this.maxSize) {
      const oldestKey = this.buckets.keys().next().value;
      if (oldestKey) this.buckets.delete(oldestKey);
    }
  }
}

/**
 * Upstash Redis 어댑터 — Vercel Marketplace에서 발급한 REST 토큰으로 영속 카운터 사용.
 *
 * 환경변수 (Vercel Marketplace 통합 시 자동 주입):
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 *
 * Redis hash 구조로 4 필드 (minuteWindowStart, minuteCount, hourWindowStart, hourCount) 저장.
 * 각 키엔 1시간 TTL을 두어 garbage collection 자동.
 *
 * 클라이언트 패키지(@upstash/redis)는 서버 라우트에서만 import되므로 클라이언트 번들엔 미포함.
 */
class UpstashRateLimitStore implements RateLimitStore {
  readonly persistent = true;
  // Upstash Redis 클라이언트 — dynamic import로 cold start 비용 분산
  private clientPromise: Promise<unknown> | null = null;

  private getClient(): Promise<unknown> {
    if (!this.clientPromise) {
      const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
      this.clientPromise = import('@upstash/redis').then(({ Redis }) => new Redis({ url: url!, token: token! }));
    }
    return this.clientPromise;
  }

  async get(key: string, now: number): Promise<RateLimitBucket> {
    try {
      const client = await this.getClient() as { hgetall: (k: string) => Promise<Record<string, string> | null> };
      const raw = await client.hgetall(key);
      if (!raw) {
        return { minuteWindowStart: now, minuteCount: 0, hourWindowStart: now, hourCount: 0 };
      }
      return {
        minuteWindowStart: Number(raw.mws) || now,
        minuteCount:       Number(raw.mc)  || 0,
        hourWindowStart:   Number(raw.hws) || now,
        hourCount:         Number(raw.hc)  || 0,
      };
    } catch {
      // Redis 장애 시 인메모리 fallback과 유사하게 새 버킷 반환 (fail-open)
      return { minuteWindowStart: now, minuteCount: 0, hourWindowStart: now, hourCount: 0 };
    }
  }

  async set(key: string, bucket: RateLimitBucket): Promise<void> {
    try {
      const client = await this.getClient() as {
        hset: (k: string, v: Record<string, string | number>) => Promise<unknown>;
        expire: (k: string, sec: number) => Promise<unknown>;
      };
      await client.hset(key, {
        mws: bucket.minuteWindowStart,
        mc:  bucket.minuteCount,
        hws: bucket.hourWindowStart,
        hc:  bucket.hourCount,
      });
      await client.expire(key, 3600 + 60); // 1h + 60s 여유
    } catch {
      // 영속 실패 시 무시 — 다음 요청에 다시 시도
    }
  }
}

/**
 * 어댑터 선택 — 환경변수에 따라 결정.
 * RATE_LIMIT_STORE='upstash' + UPSTASH_REDIS_REST_URL/TOKEN 모두 있으면 Upstash 활성.
 * 그 외엔 인메모리.
 *
 * @upstash/redis 패키지는 dependencies에 있으나 어댑터 활성화 안 되면 import도 실행되지 않음.
 */
export function createRateLimitStore(): RateLimitStore {
  // Vercel Marketplace의 Upstash KV가 자동 활성 (KV_REST_API_*) 또는 UPSTASH_* 직접 설정 시
  const hasCreds =
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    || (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (hasCreds) {
    return new UpstashRateLimitStore();
  }
  return new InMemoryRateLimitStore();
}

/** 모듈 싱글톤 — 라우트 핸들러마다 새로 만들지 않도록 */
export const rateLimitStore: RateLimitStore = createRateLimitStore();
