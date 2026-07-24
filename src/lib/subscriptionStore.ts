/**
 * 구독(Pro) 상태 서버 저장소.
 *
 * 지금까지는 usePlan()이 localStorage에만 등급을 저장해서, 실제 결제를 받아도
 * 서버엔 아무 기록이 안 남았다(캐시 지우면 결제했는데도 Pro가 사라지는 문제).
 * 이 store는 deviceId(Toss customerKey와 동일값) 기준으로 구독 상태를 서버에 영속한다.
 *
 * 한계: 로그인이 없는 현재 구조상 deviceId 단위 저장이라, 기기를 바꾸거나
 * localStorage를 지우면 여전히 못 찾는다 — 완전한 크로스 디바이스 복구는
 * 계정(로그인) 도입 후 deviceId → userId 마이그레이션으로 해결 예정.
 *
 * 저장 어댑터는 rateLimitStore.ts·catalogStore.ts와 동일하게
 * Upstash Redis(KV_REST_API_URL/TOKEN) ↔ 인메모리를 자동 선택한다.
 */

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

export interface SubscriptionRecord {
  tier:            'pro_lite' | 'pro_max';
  billingCycle:    'monthly' | 'yearly';
  customerKey:     string;   // Toss customerKey — 지금은 deviceId와 동일
  billingKey:      string;   // Toss 발급 빌링키 — 정기 청구 시 사용
  status:          SubscriptionStatus;
  currentPeriodEnd: string;  // ISO — 이 시점까지 Pro 유지, 지나면 갱신 시도
  lastPaymentAt:   string;   // ISO
  lastOrderId?:    string;
  failedAttempts:  number;   // 연속 청구 실패 횟수 — 일정 횟수 넘으면 downgrade
}

const INDEX_KEY = 'nemoa:sub:active-index'; // 갱신 크론이 순회할 deviceId 목록(Set)

function recordKey(deviceId: string): string {
  return `nemoa:sub:${deviceId}`;
}

export interface SubscriptionStore {
  get(deviceId: string): Promise<SubscriptionRecord | null>;
  set(deviceId: string, record: SubscriptionRecord): Promise<void>;
  remove(deviceId: string): Promise<void>;
  /** 크론이 순회할 활성 구독(active + past_due) deviceId 목록 */
  listActiveDeviceIds(): Promise<string[]>;
  readonly persistent: boolean;
}

class InMemorySubscriptionStore implements SubscriptionStore {
  readonly persistent = false;
  private readonly records = new Map<string, SubscriptionRecord>();

  async get(deviceId: string): Promise<SubscriptionRecord | null> {
    return this.records.get(deviceId) ?? null;
  }
  async set(deviceId: string, record: SubscriptionRecord): Promise<void> {
    this.records.set(deviceId, record);
  }
  async remove(deviceId: string): Promise<void> {
    this.records.delete(deviceId);
  }
  async listActiveDeviceIds(): Promise<string[]> {
    return [...this.records.entries()]
      .filter(([, r]) => r.status === 'active' || r.status === 'past_due')
      .map(([id]) => id);
  }
}

class UpstashSubscriptionStore implements SubscriptionStore {
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

  async get(deviceId: string): Promise<SubscriptionRecord | null> {
    try {
      const client = await this.getClient() as { get: (k: string) => Promise<unknown> };
      const raw = await client.get(recordKey(deviceId));
      if (raw === null || raw === undefined) return null;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw) as SubscriptionRecord; } catch { return null; }
      }
      return raw as SubscriptionRecord;
    } catch {
      return null;
    }
  }

  async set(deviceId: string, record: SubscriptionRecord): Promise<void> {
    try {
      const client = await this.getClient() as {
        set:  (k: string, v: string) => Promise<unknown>;
        sadd: (k: string, ...members: string[]) => Promise<unknown>;
        srem: (k: string, ...members: string[]) => Promise<unknown>;
      };
      await client.set(recordKey(deviceId), JSON.stringify(record));
      if (record.status === 'active' || record.status === 'past_due') {
        await client.sadd(INDEX_KEY, deviceId);
      } else {
        await client.srem(INDEX_KEY, deviceId);
      }
    } catch {
      // 영속 실패 — 호출자가 필요 시 재시도
    }
  }

  async remove(deviceId: string): Promise<void> {
    try {
      const client = await this.getClient() as {
        del:  (k: string) => Promise<unknown>;
        srem: (k: string, ...members: string[]) => Promise<unknown>;
      };
      await client.del(recordKey(deviceId));
      await client.srem(INDEX_KEY, deviceId);
    } catch {
      // 무시
    }
  }

  async listActiveDeviceIds(): Promise<string[]> {
    try {
      const client = await this.getClient() as { smembers: (k: string) => Promise<string[]> };
      return await client.smembers(INDEX_KEY);
    } catch {
      return [];
    }
  }
}

function createSubscriptionStore(): SubscriptionStore {
  const hasCreds =
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    || (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (hasCreds) return new UpstashSubscriptionStore();
  return new InMemorySubscriptionStore();
}

export const subscriptionStore: SubscriptionStore = createSubscriptionStore();
