// 브라우저 전용 — 실제 에이전트 호출 로그를 localStorage에 누적

const LOG_KEY = 'smart-cart-agent-log';
const MAX_ENTRIES = 200; // 7일치 여유

export interface AgentCallLog {
  id:         string;
  agentId:    string;
  ok:         boolean;
  status:     number;
  latencyMs:  number;
  timestamp:  number;
  errorMsg?:  string;
}

function readAll(): AgentCallLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(logs: AgentCallLog[]) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, MAX_ENTRIES)));
  } catch {
    // 용량 초과 시 절반으로 정리 후 재시도
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, Math.floor(MAX_ENTRIES / 2))));
    } catch { /* 포기 */ }
  }
}

/** 에이전트 호출 결과를 기록한다. 조용히 실패하므로 호출자는 try/catch 불필요. */
export function recordAgentCall(entry: Omit<AgentCallLog, 'id' | 'timestamp'> & { timestamp?: number }) {
  if (typeof window === 'undefined') return;
  const log: AgentCallLog = {
    id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: entry.timestamp ?? Date.now(),
    agentId:   entry.agentId,
    ok:        entry.ok,
    status:    entry.status,
    latencyMs: entry.latencyMs,
    errorMsg:  entry.errorMsg,
  };
  const logs = readAll();
  logs.unshift(log);
  write(logs);
}

/** 최근 N시간 내 호출 로그 전체. */
export function getRecentLogs(hoursBack = 24): AgentCallLog[] {
  const since = Date.now() - hoursBack * 60 * 60 * 1000;
  return readAll().filter((l) => l.timestamp >= since);
}

export function clearAgentLogs() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(LOG_KEY); } catch { /* ignore */ }
}

/** 에이전트 ID별 집계 — 관리자 대시보드가 사용. */
export interface AgentCallAggregate {
  calls:        number;
  successes:    number;
  avgLatencyMs: number;
}

export function aggregateByAgent(logs: AgentCallLog[]): Record<string, AgentCallAggregate> {
  const out: Record<string, AgentCallAggregate & { _totalLatency: number }> = {};
  for (const log of logs) {
    const a = out[log.agentId] ??= { calls: 0, successes: 0, avgLatencyMs: 0, _totalLatency: 0 };
    a.calls += 1;
    if (log.ok) a.successes += 1;
    a._totalLatency += log.latencyMs;
  }
  const result: Record<string, AgentCallAggregate> = {};
  for (const [id, v] of Object.entries(out)) {
    result[id] = {
      calls:        v.calls,
      successes:    v.successes,
      avgLatencyMs: v.calls > 0 ? Math.round(v._totalLatency / v.calls) : 0,
    };
  }
  return result;
}

/** fetch 래퍼 — 엔드포인트와 요청을 받아 호출하고 자동으로 로깅한다. */
export async function loggedFetch(
  agentId: string,
  endpoint: string,
  init: RequestInit,
): Promise<Response> {
  const start = performance.now();
  try {
    const res = await fetch(endpoint, init);
    const latencyMs = Math.round(performance.now() - start);
    recordAgentCall({
      agentId,
      ok:        res.ok,
      status:    res.status,
      latencyMs,
      errorMsg:  res.ok ? undefined : `HTTP ${res.status}`,
    });
    return res;
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    recordAgentCall({
      agentId,
      ok:        false,
      status:    0,
      latencyMs,
      errorMsg:  err instanceof Error ? err.message : 'Network error',
    });
    throw err;
  }
}

/** 엔드포인트 URL에서 에이전트 ID 추론. */
export function agentIdFromEndpoint(endpoint: string): string {
  const match = endpoint.match(/\/api\/agents\/([^/?]+)/);
  return match ? match[1] : 'unknown';
}
