/**
 * 일별 사용량 집계 저장소 — AI 에이전트 호출 수·활성 기기 수 카운팅 전용.
 *
 * rateLimitStore(분/시 윈도우, 곧 만료)와는 목적이 다르다 — 여기는
 * "오늘 하루" 단위로 누적하고 관리자 콘솔 조회를 위해 며칠간 보관한다.
 *
 * 현재 베이직: 인메모리 — 인스턴스 재시작 시 리셋.
 * Upstash Redis 연결 시(KV_REST_API_URL/TOKEN) 자동으로 영속 store로 전환된다.
 */

export interface UsageStore {
  /** key를 원자적으로 1 증가시키고 새 값을 반환한다. 최초 생성 시 ttlSeconds 후 만료. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  /** key의 현재 카운트 값을 조회한다 (없으면 0). */
  get(key: string): Promise<number>;
  /** set에 member를 추가한다(중복 무시). 최초 생성 시 ttlSeconds 후 만료. */
  sadd(key: string, member: string, ttlSeconds: number): Promise<void>;
  /** set의 고유 원소 개수를 반환한다 (없으면 0). */
  scard(key: string): Promise<number>;
  readonly persistent: boolean;
}

class InMemoryUsageStore implements UsageStore {
  readonly persistent = false;
  private counters = new Map<string, { count: number; expiresAt: number }>();
  private sets = new Map<string, { members: Set<string>; expiresAt: number }>();

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const now = Date.now();
    const existing = this.counters.get(key);
    if (existing && existing.expiresAt > now) {
      existing.count += 1;
      return existing.count;
    }
    this.counters.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
    return 1;
  }

  async get(key: string): Promise<number> {
    const existing = this.counters.get(key);
    if (!existing || existing.expiresAt <= Date.now()) return 0;
    return existing.count;
  }

  async sadd(key: string, member: string, ttlSeconds: number): Promise<void> {
    const now = Date.now();
    const existing = this.sets.get(key);
    if (existing && existing.expiresAt > now) {
      existing.members.add(member);
      return;
    }
    this.sets.set(key, { members: new Set([member]), expiresAt: now + ttlSeconds * 1000 });
  }

  async scard(key: string): Promise<number> {
    const existing = this.sets.get(key);
    if (!existing || existing.expiresAt <= Date.now()) return 0;
    return existing.members.size;
  }
}

class UpstashUsageStore implements UsageStore {
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
      if (count === 1) await client.expire(key, ttlSeconds);
      return count;
    } catch {
      return 0; // 집계 실패는 fail-open — 서비스 동작에 영향 없음
    }
  }

  async get(key: string): Promise<number> {
    try {
      const client = await this.getClient() as { get: (k: string) => Promise<number | string | null> };
      const raw = await client.get(key);
      const n = typeof raw === 'string' ? parseInt(raw, 10) : raw;
      return typeof n === 'number' && Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }

  async sadd(key: string, member: string, ttlSeconds: number): Promise<void> {
    try {
      const client = await this.getClient() as {
        sadd:   (k: string, m: string) => Promise<number>;
        expire: (k: string, sec: number) => Promise<unknown>;
      };
      await client.sadd(key, member);
      await client.expire(key, ttlSeconds); // 매번 갱신 — 활동이 있는 날마다 보관기간 연장
    } catch {
      // 집계 실패는 무시
    }
  }

  async scard(key: string): Promise<number> {
    try {
      const client = await this.getClient() as { scard: (k: string) => Promise<number> };
      return await client.scard(key);
    } catch {
      return 0;
    }
  }
}

function createUsageStore(): UsageStore {
  const hasCreds =
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    || (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  return hasCreds ? new UpstashUsageStore() : new InMemoryUsageStore();
}

export const usageStore: UsageStore = createUsageStore();
