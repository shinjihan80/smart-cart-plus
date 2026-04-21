'use client';

import { useCallback, useMemo } from 'react';
import { createSharedStore } from './sharedStore';

const STORAGE_KEY = 'nemoa-cook-log';

/** recipe id → 조리 날짜(YYYY-MM-DD) 배열. 최신순 유지. */
export type CookLog = Record<string, string[]>;

const store = createSharedStore<CookLog>({
  storageKey: STORAGE_KEY,
  initial:    {},
  validate:   (raw) => (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as CookLog : null),
});

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export interface CookEntry {
  id:         string;
  count:      number;
  lastCooked?: string;
}

export function useCookLog() {
  const log = store.useStore();

  const markCooked = useCallback((id: string) => {
    store.setState((prev) => {
      const dates = prev[id] ?? [];
      const d = today();
      if (dates[0] === d) return prev;
      return { ...prev, [id]: [d, ...dates].slice(0, 365) };
    });
  }, []);

  const undoLast = useCallback((id: string) => {
    store.setState((prev) => {
      const dates = prev[id];
      if (!dates || dates.length === 0) return prev;
      return { ...prev, [id]: dates.slice(1) };
    });
  }, []);

  const getEntry = useCallback((id: string): CookEntry => {
    const dates = log[id] ?? [];
    return { id, count: dates.length, lastCooked: dates[0] };
  }, [log]);

  /** recipe id → 조리 횟수 맵. matchRecipes에 전달. */
  const cookCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [id, dates] of Object.entries(log)) map[id] = dates.length;
    return map;
  }, [log]);

  /**
   * 같은 날짜에 함께 조리된 다른 레시피 id 빈도 TOP N.
   * "파스타 만들 때 함께 만든 메뉴" 같은 조합 추천용.
   */
  const getCoCookedWith = useCallback((id: string, limit = 3): Array<{ id: string; count: number }> => {
    const targetDates = new Set(log[id] ?? []);
    if (targetDates.size === 0) return [];
    const coCount = new Map<string, number>();
    for (const [otherId, otherDates] of Object.entries(log)) {
      if (otherId === id) continue;
      for (const d of otherDates) {
        if (targetDates.has(d)) coCount.set(otherId, (coCount.get(otherId) ?? 0) + 1);
      }
    }
    return Array.from(coCount.entries())
      .map(([coId, count]) => ({ id: coId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }, [log]);

  return { log, cookCounts, markCooked, undoLast, getEntry, getCoCookedWith };
}
