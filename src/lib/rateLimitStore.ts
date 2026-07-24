/**
 * Rate limit 카운터 저장소 추상화.
 *
 * 고정 윈도우(fixed window) + 원자적 증가(atomic incr) 방식.
 * 윈도우 ID(분/시 단위 타임스탬프)를 키에 포함시켜, "읽고 → 더하고 → 쓰기" 3단계 대신
 * 단일 원자 연산(Redis INCR)으로 처리한다 — 동시에 요청이 몰려도 카운트 누락이 없다.
 *
 * 현재 베이직: 인메모리 — 인스턴스 재시작 시 카운트 리셋, 다중 인스턴스 간 미공유 (단점)
 * Upstash Redis 연결 시(KV_REST_API_URL/TOKEN) 자동으로 영속 store로 전환된다.
 */

export interface RateLimitStore {
  /**
   * key를 원자적으로 1 증가시키고 새 값을 반환한다.
   * 이 윈도우에서 처음 생성된 키라면 ttlSeconds 후 자동 만료되도록 설정한다.
   */
  incr(key: string, ttlSeconds: number): Promise<number> | number;
  /** 메타데이터 — 영속/인메모리 여부 */
  readonly persistent: boolean;
}

/** 인메모리 어댑터 — 베이직 단계 기본. 단일 인스턴스 내에서는 JS가 단일 스레드라 완전히 원자적. */
export class InMemoryRateLimitStore implements RateLimitStore {
  readonly persistent = false;
  private readonly counters = new Map<string, { count: number; expiresAt: number }>();
  private readonly maxSize: number;

  constructor(maxSize = 10_000) {
    this.maxSize = maxSize;
  }

  incr(key: string, ttlSeconds: number): number {
    const now = Date.now();
    const existing = this.counters.get(key);
    if (existing && existing.expiresAt > now) {
      existing.count += 1;
      return existing.count;
    }
    this.counters.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
    // 메모리 누수 방지 — 크기 초과 시 가장 오래된 항목 제거
    if (this.counters.size > this.maxSize) {
      const oldestKey = this.counters.keys().next().value;
      if (oldestKey) this.counters.delete(oldestKey);
    }
    return 1;
  }
}

/**
 * Upstash Redis 어댑터 — INCR은 Redis가 단일 원자 명령으로 보장하므로
 * 동시에 수백 개 요청이 들어와도 서로 덮어쓰지 않고 정확히 누적된다.
 */
class UpstashRateLimitStore implements RateLimitStore {
  readonly persistent = true;
  private clientPromise: Promise<unknown> | null = null;

  private getClient(): Promise<unknown> {
    if (!this.clientPromise) {
      const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
      this.clientPromise = import('@upstash/redis').then(({ Redis }) => new Redis({ url: url!, token: token! }));
    }
    return this.clientPromise;
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    try {
      const client = await this.getClient() as {
        incr:   (k: string) => Promise<number>;
        expire: (k: string, sec: number) => Promise<unknown>;
      };
      const count = await client.incr(key);
      if (count === 1) {
        // 이 윈도우에서 처음 만들어진 키에만 TTL 설정 — 매 요청마다 갱신하면 윈도우가 계속 밀림
        await client.expire(key, ttlSeconds);
      }
      return count;
    } catch {
      // Redis 장애 시 fail-open — 한도 없이 통과시킨다 (가용성 우선)
      return 1;
    }
  }
}

/**
 * 어댑터 선택 — 환경변수에 따라 결정.
 * Vercel Marketplace의 Upstash KV가 자동 활성(KV_REST_API_*) 또는 UPSTASH_* 직접 설정 시 Upstash 사용.
 * 그 외엔 인메모리.
 */
export function createRateLimitStore(): RateLimitStore {
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
