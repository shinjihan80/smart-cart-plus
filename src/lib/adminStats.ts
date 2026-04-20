import { CartItem, isFoodItem, isClothingItem, isEnrichedClothingItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { getRecentLogs, aggregateByAgent, type AgentCallLog } from '@/lib/agentLogger';

// ─── 타입 정의 ────────────────────────────────────────────────────────────────
export type AgentHealth = 'healthy' | 'degraded' | 'idle';

export interface AgentStatus {
  id:           string;
  label:        string;
  emoji:        string;
  description:  string;
  calls24h:     number;
  avgLatencyMs: number;
  successRate:  number;
  health:       AgentHealth;
}

export interface DataMetrics {
  total:             number;
  food:              number;
  clothing:          number;
  withImage:         number;
  withImagePct:      number;
  withMemo:          number;
  withMemoPct:       number;
  visionEnriched:    number;
  visionEnrichedPct: number;
  nutritionTagged:   number;
  urgent:            number;
  expired:           number;
}

export interface TokenUsage {
  inputTokens:  number;
  outputTokens: number;
  cachedHits:   number;
  cachedMisses: number;
  estimatedKRW: number;
}

export interface ActivityLog {
  id:        string;
  agent:     string;
  emoji:     string;
  message:   string;
  timeLabel: string;
  status:    'success' | 'warning' | 'error';
}

// ─── 에이전트 카탈로그 (하네스 구성 기반) ─────────────────────────────────────
const AGENTS: Omit<AgentStatus, 'calls24h' | 'avgLatencyMs' | 'successRate' | 'health'>[] = [
  { id: 'vision-parser',    label: 'Vision 파서',    emoji: '🔮', description: '이미지 → 멀티모달 분석' },
  { id: 'parser-agent',     label: '영수증 파서',    emoji: '📝', description: '텍스트 → 구조화 JSON' },
  { id: 'nutrition-agent',  label: '영양사 에이전트', emoji: '🥗', description: '식품 영양소 분석' },
  { id: 'style-agent',      label: '스타일리스트',   emoji: '👗', description: '날씨·코디 추천' },
  { id: 'url-agent',        label: 'URL 추출기',     emoji: '🔗', description: 'OG 메타 파싱' },
  { id: 'image-agent',      label: '이미지 수집기',  emoji: '📸', description: 'Unsplash 썸네일' },
];

// ─── 시드 기반 의사난수 (SSR ↔ CSR 일관성) ────────────────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ─── 에이전트 상태 생성 ───────────────────────────────────────────────────────
/**
 * 실제 호출 로그가 있으면 우선 사용하고, 없는 에이전트는 목업 값으로 채운다.
 * 실 로그 1건이라도 있는 에이전트는 `health`를 실측 기반으로 계산한다.
 */
export function buildAgentStatuses(totalItems: number, realLogs: AgentCallLog[] = []): AgentStatus[] {
  const rnd = seededRandom(totalItems + 1);
  const baseLoad = Math.max(5, Math.min(40, Math.round(totalItems * 1.2)));
  const agg = aggregateByAgent(realLogs);

  return AGENTS.map((a, i) => {
    const real = agg[a.id];
    if (real && real.calls > 0) {
      const successRate = Math.round((real.successes / real.calls) * 1000) / 10;
      const health: AgentHealth =
        successRate >= 98 ? 'healthy' :
        successRate >= 80 ? 'degraded' : 'idle';
      return { ...a, calls24h: real.calls, avgLatencyMs: real.avgLatencyMs, successRate, health };
    }
    const calls24h     = Math.round(baseLoad * (0.6 + rnd() * 1.2) + i * 3);
    const avgLatencyMs = Math.round(800 + rnd() * 2400);
    const successRate  = Math.round((0.94 + rnd() * 0.055) * 1000) / 10;
    const health: AgentHealth =
      successRate >= 98 ? 'healthy' :
      successRate >= 95 ? 'degraded' : 'idle';
    return { ...a, calls24h, avgLatencyMs, successRate, health };
  });
}

export function hasRealLogs(realLogs: AgentCallLog[]): boolean {
  return realLogs.length > 0;
}

// ─── 데이터 품질 메트릭 ───────────────────────────────────────────────────────
export function buildDataMetrics(items: CartItem[]): DataMetrics {
  const food      = items.filter(isFoodItem);
  const clothing  = items.filter(isClothingItem);

  const withImage       = items.filter((i) => !!i.imageUrl).length;
  const withMemo        = items.filter((i) => !!i.memo && i.memo.trim().length > 0).length;
  const visionEnriched  = clothing.filter(isEnrichedClothingItem).length;
  const nutritionTagged = food.filter((f) => !!f.nutritionFacts).length;

  const urgent  = food.filter((f) => {
    const d = calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays);
    return d >= 0 && d <= 3;
  }).length;
  const expired = food.filter((f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) < 0).length;

  const safePct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

  return {
    total:             items.length,
    food:              food.length,
    clothing:          clothing.length,
    withImage,
    withImagePct:      safePct(withImage, items.length),
    withMemo,
    withMemoPct:       safePct(withMemo, items.length),
    visionEnriched,
    visionEnrichedPct: safePct(visionEnriched, clothing.length),
    nutritionTagged,
    urgent,
    expired,
  };
}

// ─── 토큰 사용량 (호출 수 기반 추정치) ────────────────────────────────────────
export function buildTokenUsage(agents: AgentStatus[]): TokenUsage {
  const totalCalls = agents.reduce((s, a) => s + a.calls24h, 0);
  const rnd = seededRandom(totalCalls + 7);

  const inputTokens  = totalCalls * Math.round(1200 + rnd() * 800);
  const outputTokens = totalCalls * Math.round(420 + rnd() * 300);
  const cachedHits   = Math.round(totalCalls * (0.58 + rnd() * 0.1));
  const cachedMisses = totalCalls - cachedHits;

  // Claude Opus 4.6 기준 대략치: input $15/1M, output $75/1M, 1 USD ≈ 1380 KRW
  const usd = (inputTokens * 15 + outputTokens * 75) / 1_000_000;
  const estimatedKRW = Math.round(usd * 1380);

  return { inputTokens, outputTokens, cachedHits, cachedMisses, estimatedKRW };
}

// ─── 최근 활동 로그 ───────────────────────────────────────────────────────────
const AGENT_META: Record<string, { label: string; emoji: string }> = {
  'vision-parser':    { label: 'Vision 파서',    emoji: '🔮' },
  'parser-agent':     { label: '영수증 파서',    emoji: '📝' },
  'nutrition-agent':  { label: '영양사',         emoji: '🥗' },
  'style-agent':      { label: '스타일리스트',   emoji: '👗' },
  'url-agent':        { label: 'URL 추출기',     emoji: '🔗' },
  'image-agent':      { label: '이미지 수집기',  emoji: '📸' },
};

function relativeTime(msAgo: number): string {
  if (msAgo < 60_000) return '방금 전';
  const min = Math.floor(msAgo / 60_000);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

/**
 * 실제 호출 로그가 있으면 그걸 사용, 없으면 아이템 기반 목업.
 */
export function buildActivityLog(items: CartItem[], realLogs: AgentCallLog[] = []): ActivityLog[] {
  if (realLogs.length > 0) {
    const now = Date.now();
    return realLogs.slice(0, 12).map((log) => {
      const meta = AGENT_META[log.agentId] ?? { label: log.agentId, emoji: '🤖' };
      const status: ActivityLog['status'] = log.ok ? 'success' : 'error';
      const message = log.ok
        ? `${meta.label} 호출 · ${log.latencyMs}ms`
        : `${meta.label} 실패 · ${log.errorMsg ?? `HTTP ${log.status}`}`;
      return {
        id:        log.id,
        agent:     meta.label,
        emoji:     meta.emoji,
        message,
        timeLabel: relativeTime(now - log.timestamp),
        status,
      };
    });
  }

  if (items.length === 0) return [];
  const recent = items.slice(-10).reverse();
  const rnd = seededRandom(items.length * 31);

  const templates: { agent: string; emoji: string; verb: (n: string) => string; status: ActivityLog['status'] }[] = [
    { agent: 'Vision 파서',    emoji: '🔮', verb: (n) => `${n} 이미지 분석 완료`,       status: 'success' },
    { agent: '영수증 파서',    emoji: '📝', verb: (n) => `${n} 파싱 결과 확정`,          status: 'success' },
    { agent: '스키마 검증자', emoji: '🛡️', verb: (n) => `${n} 필드 보완 (1건)`,          status: 'warning' },
    { agent: '영양사',         emoji: '🥗', verb: (n) => `${n} 영양 분석 응답`,          status: 'success' },
    { agent: '스타일리스트',   emoji: '👗', verb: (n) => `${n} 코디 매칭 제안`,          status: 'success' },
    { agent: 'URL 추출기',     emoji: '🔗', verb: (n) => `${n} 상세 페이지 메타 수집`,   status: 'success' },
  ];

  return recent.map((it, i) => {
    const t = templates[Math.floor(rnd() * templates.length)];
    const minutes = Math.round(3 + rnd() * 180 + i * 7);
    const timeLabel = minutes < 60
      ? `${minutes}분 전`
      : `${Math.floor(minutes / 60)}시간 전`;
    return {
      id:        `log-${it.id}-${i}`,
      agent:     t.agent,
      emoji:     t.emoji,
      message:   t.verb(it.name),
      timeLabel,
      status:    t.status,
    };
  });
}

export { getRecentLogs };

// ─── localStorage 용량 측정 (브라우저 전용) ───────────────────────────────────
export function measureStorageBytes(): number {
  if (typeof window === 'undefined') return 0;
  let bytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? '';
    bytes += key.length + value.length;
  }
  return bytes * 2; // UTF-16
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
