'use client';

import { useEffect, useState, useCallback } from 'react';
import { isAnalyticsEnabled } from './analytics';

/**
 * 파트너 클릭 로그 (localStorage 기반).
 *
 * 사용자가 파트너 칩/카드를 탭하면 기록 → 마이페이지에서 "내가 자주 쓰는 곳" 인사이트.
 *
 * 수익 전략 (memory/partner_integrations_monetization.md):
 *   - 사용자 본인의 클릭 패턴을 보여줘서 행동 강화
 *   - 향후 opt-in 익명 집계로 admin 대시보드에 인기 파트너 노출 → 제휴 협상 데이터
 *
 * 보관 방식
 *   - 최근 200건만 유지 (오버플로우 시 오래된 것부터 제거)
 *   - localStorage 키: `nemoa-partner-clicks`
 *   - 30일 이상 된 기록은 자동 정리 (다음 hydration 때)
 */

const STORAGE_KEY = 'nemoa-partner-clicks';
const FLUSH_KEY   = 'nemoa-partner-clicks-flush'; // 마지막 텔레메트리 전송 날짜
const MAX_ENTRIES = 200;
const RETENTION_DAYS = 30;

export interface PartnerClick {
  /** Partner.id */
  partnerId: string;
  /** Partner.domain */
  domain:    string;
  /** ISO timestamp */
  ts:        number;
  /** 검색 쿼리가 같이 전달됐다면 (Phase 7 — 옷 이름 자동 검색 등) */
  query?:    string;
}

function loadInitial(): PartnerClick[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PartnerClick[];
    if (!Array.isArray(parsed)) return [];
    // 30일 이상 된 기록 정리
    const cutoff = Date.now() - RETENTION_DAYS * 86_400_000;
    return parsed.filter((c) => typeof c.ts === 'number' && c.ts >= cutoff);
  } catch {
    return [];
  }
}

/**
 * 단건 클릭 기록 — 컴포넌트 외부에서 직접 호출 가능
 * (PartnerChip 의 onClick 에서 사용)
 */
export function logPartnerClick(entry: Omit<PartnerClick, 'ts'>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadInitial();
    const next: PartnerClick = { ...entry, ts: Date.now() };
    const merged = [next, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    // 상태 동기화용 커스텀 이벤트 — 같은 탭의 다른 컴포넌트에서 감지
    window.dispatchEvent(new CustomEvent('nemoa:partner-click', { detail: next }));
  } catch { /* storage full — 조용히 실패 */ }
}

/**
 * 클릭 로그 훅 — 통계 카드용
 */
export function usePartnerClicks() {
  const [clicks, setClicks] = useState<PartnerClick[]>([]);

  useEffect(() => {
    setClicks(loadInitial());

    function refresh() {
      setClicks(loadInitial());
    }
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) refresh();
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('nemoa:partner-click', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('nemoa:partner-click', refresh);
    };
  }, []);

  /** 사용 빈도 상위 N개 파트너 (id 기준) */
  const topPartners = useCallback((n: number = 5) => {
    const counts = new Map<string, { partnerId: string; domain: string; count: number; lastTs: number }>();
    for (const c of clicks) {
      const existing = counts.get(c.partnerId);
      if (existing) {
        existing.count += 1;
        existing.lastTs = Math.max(existing.lastTs, c.ts);
      } else {
        counts.set(c.partnerId, { partnerId: c.partnerId, domain: c.domain, count: 1, lastTs: c.ts });
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, n);
  }, [clicks]);

  /** 도메인별 클릭 합계 */
  const byDomain = useCallback(() => {
    const counts = new Map<string, number>();
    for (const c of clicks) {
      counts.set(c.domain, (counts.get(c.domain) ?? 0) + 1);
    }
    return [...counts.entries()].map(([domain, count]) => ({ domain, count }));
  }, [clicks]);

  /** 전체 정리 (사용자 옵션) */
  function clearAll() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      setClicks([]);
    } catch { /* 조용히 실패 */ }
  }

  return {
    clicks,
    total:        clicks.length,
    topPartners,
    byDomain,
    clearAll,
  };
}

/**
 * 일일 텔레메트리 배치 flush.
 *
 * 조건
 *  1. `isAnalyticsEnabled()` 가 true (opt-in)
 *  2. 오늘 아직 flush 안 함 (`nemoa-partner-clicks-flush` 가 오늘과 다름)
 *  3. 클릭 기록 1건 이상
 *
 * 전송 내용: `{ date: 'YYYY-MM-DD', counts: { partnerId: N } }`
 *   - 개별 클릭 ❌, 일별 집계 ⭕
 *   - 사용자 식별자 없음
 *
 * 실패해도 조용히 무시 — 다음 세션에서 재시도.
 */
export async function flushPartnerClicksIfDue(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!isAnalyticsEnabled()) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const lastFlush = localStorage.getItem(FLUSH_KEY);
    if (lastFlush === today) return; // 오늘 이미 보냄

    const clicks = loadInitial();
    if (clicks.length === 0) return;

    // 어제와 그제 클릭만 집계 (오늘 데이터는 다음 날 보냄 — 완성된 1일치만)
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
    const yesterdayClicks = clicks.filter((c) => {
      const d = new Date(c.ts).toISOString().split('T')[0];
      return d === yesterday;
    });
    if (yesterdayClicks.length === 0) {
      // 어제 클릭 없으면 flush 날짜만 갱신
      localStorage.setItem(FLUSH_KEY, today);
      return;
    }

    const counts: Record<string, number> = {};
    for (const c of yesterdayClicks) {
      counts[c.partnerId] = (counts[c.partnerId] ?? 0) + 1;
    }

    const res = await fetch('/api/admin/telemetry/clicks', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: yesterday, counts }),
    });

    if (res.ok) {
      localStorage.setItem(FLUSH_KEY, today);
    }
  } catch {
    // 실패해도 조용히 — 다음 세션에서 재시도
  }
}
