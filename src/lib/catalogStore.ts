/**
 * 카탈로그 오버레이 저장소.
 *
 * 정적 카탈로그(코드의 RECIPES·SEASONAL_PRODUCE·PARTNERS) 위에
 * 관리자가 추가/수정/삭제한 변경분만 저장하는 레이어.
 *
 * 저장 형태:
 *   - `catalog:recipes:created`    — 관리자가 새로 추가한 레시피 (id 충돌 시 무시)
 *   - `catalog:recipes:updated`    — 정적 레시피의 부분 덮어쓰기 (id별 patch)
 *   - `catalog:recipes:deleted`    — 정적 레시피의 비활성화 (id 배열)
 *   - `catalog:seasonal:created`   — 동상
 *   - `catalog:partners:overrides` — 파트너 활성화 + URL 등록 (id별 부분 패치)
 *
 * 우선순위 (NEMOA 모바일 merge 시):
 *   - deleted에 있는 id → 결과에서 제외
 *   - updated에 있는 id → 정적 + patch
 *   - created → 결과 끝에 추가
 *
 * 어댑터:
 *   - Upstash Redis (CATALOG_STORE='upstash' + UPSTASH_REDIS_REST_URL/TOKEN)
 *   - 인메모리 fallback (개발용 — Vercel Function 재시작 시 손실)
 *
 * 베이직 단계: 인메모리만 → 관리자 CRUD 변경분이 영속 안 됨 (안내 표시)
 * Pro 단계:    Upstash 연결 → 관리자 CRUD 변경분이 즉시 모든 사용자에게 반영
 */

export type CatalogResource = 'recipes' | 'seasonal' | 'partners' | 'telemetry';
// operation: 'partner-clicks:YYYY-MM-DD' 같은 동적 키도 telemetry 용으로 허용
export type CatalogOperation = string;

export interface CatalogStore {
  /** 키별 JSON 저장. value는 직렬화 가능한 객체. */
  set(resource: CatalogResource, operation: CatalogOperation, value: unknown): Promise<void>;
  /** 키별 JSON 조회. 없으면 null. */
  get<T>(resource: CatalogResource, operation: CatalogOperation): Promise<T | null>;
  readonly persistent: boolean;
}

class InMemoryCatalogStore implements CatalogStore {
  readonly persistent = false;
  private cache = new Map<string, unknown>();

  private key(resource: CatalogResource, operation: CatalogOperation): string {
    return `catalog:${resource}:${operation}`;
  }

  async set(resource: CatalogResource, operation: CatalogOperation, value: unknown): Promise<void> {
    this.cache.set(this.key(resource, operation), value);
  }

  async get<T>(resource: CatalogResource, operation: CatalogOperation): Promise<T | null> {
    const v = this.cache.get(this.key(resource, operation));
    return (v as T | undefined) ?? null;
  }
}

class UpstashCatalogStore implements CatalogStore {
  readonly persistent = true;
  private clientPromise: Promise<unknown> | null = null;

  private getClient(): Promise<unknown> {
    if (!this.clientPromise) {
      // UPSTASH_REDIS_REST_URL 또는 KV_REST_API_URL (Vercel Marketplace 통합 시 자동 주입) 둘 다 지원
      const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
      this.clientPromise = import('@upstash/redis').then(({ Redis }) => new Redis({ url: url!, token: token! }));
    }
    return this.clientPromise;
  }

  private key(resource: CatalogResource, operation: CatalogOperation): string {
    return `nemoa:catalog:${resource}:${operation}`;
  }

  async set(resource: CatalogResource, operation: CatalogOperation, value: unknown): Promise<void> {
    try {
      const client = await this.getClient() as { set: (k: string, v: string) => Promise<unknown> };
      await client.set(this.key(resource, operation), JSON.stringify(value));
    } catch {
      // 영속 실패 — 호출자가 graceful degradation
    }
  }

  async get<T>(resource: CatalogResource, operation: CatalogOperation): Promise<T | null> {
    try {
      const client = await this.getClient() as { get: (k: string) => Promise<unknown> };
      const raw = await client.get(this.key(resource, operation));
      if (raw === null || raw === undefined) return null;
      // Upstash REST는 자동 deserialize도 하지만, set에서 JSON.stringify해놨으니 string일 수 있음
      if (typeof raw === 'string') {
        try { return JSON.parse(raw) as T; }
        catch { return null; }
      }
      return raw as T;
    } catch {
      return null;
    }
  }
}

function createCatalogStore(): CatalogStore {
  // UPSTASH_REDIS_REST_URL/TOKEN 또는 Vercel KV (KV_REST_API_URL/TOKEN) 자동 감지
  const hasUpstashCreds =
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    || (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (hasUpstashCreds) {
    return new UpstashCatalogStore();
  }
  return new InMemoryCatalogStore();
}

export const catalogStore: CatalogStore = createCatalogStore();
