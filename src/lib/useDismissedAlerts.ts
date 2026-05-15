'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * 홈 알림 배너 "오늘 안 보기" 상태 관리.
 *
 * 동작
 *   - dismiss 시 localStorage 에 `nemoa-dismissed-alerts` 키로 저장
 *   - 값: { [alertKey]: 'YYYY-MM-DD' } — 오늘 dismiss 한 날짜
 *   - 다음 날이 되면 자동 무효 → 다시 노출
 *
 * alertKey 예시
 *   - 'rebuy'        — RebuyAlert
 *   - 'season-2026Q2' — SeasonChangeAlert (시즌별 별도)
 *   - 'urgent'       — UrgentAlert (선택, 임박 식품은 매일 다를 수 있음)
 */

const STORAGE_KEY = 'nemoa-dismissed-alerts';

interface DismissedMap {
  [alertKey: string]: string; // YYYY-MM-DD
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function load(): DismissedMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DismissedMap;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function save(map: DismissedMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* storage full — 조용히 실패 */ }
}

export function useDismissedAlerts() {
  const [map, setMap] = useState<DismissedMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 하이드레이션 시 1회 — 한 주 이상 지난 항목 자동 GC
    const loaded = load();
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0];
    const filtered: DismissedMap = {};
    let changed = false;
    for (const [key, date] of Object.entries(loaded)) {
      if (date >= weekAgo) filtered[key] = date;
      else changed = true;
    }
    setMap(filtered);
    if (changed) save(filtered);
    setHydrated(true);
  }, []);

  /** 오늘 dismiss 했는지 확인 */
  const isDismissedToday = useCallback((alertKey: string): boolean => {
    // 하이드레이션 전엔 false 반환 — SSR 일관성
    if (!hydrated) return false;
    return map[alertKey] === today();
  }, [map, hydrated]);

  /** dismiss 처리 */
  const dismiss = useCallback((alertKey: string) => {
    setMap((prev) => {
      const next = { ...prev, [alertKey]: today() };
      save(next);
      return next;
    });
  }, []);

  return { isDismissedToday, dismiss };
}
