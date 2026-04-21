'use client';

import { useCallback } from 'react';
import { createSharedStore } from './sharedStore';

const STORAGE_KEY = 'nemoa-wear-log';

/** clothing id → 착용 날짜(YYYY-MM-DD) 배열. 최신순 유지. */
export type WearLog = Record<string, string[]>;

const store = createSharedStore<WearLog>({
  storageKey: STORAGE_KEY,
  initial:    {},
  validate:   (raw) => (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as WearLog : null),
});

function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** 두 ISO 날짜 문자열 간의 일 단위 차이 (양수 = 과거, 음수 = 미래). */
export function daysSince(iso: string): number {
  const a = new Date(iso);
  const b = new Date();
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

export interface WearEntry {
  id:        string;
  count:     number;
  lastWorn?: string;
}

export function useWearLog() {
  const log = store.useStore();

  const markWorn = useCallback((id: string) => {
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

  const getEntry = useCallback((id: string): WearEntry => {
    const dates = log[id] ?? [];
    return { id, count: dates.length, lastWorn: dates[0] };
  }, [log]);

  const getAllEntries = useCallback((): WearEntry[] => {
    return Object.entries(log).map(([id, dates]) => ({
      id, count: dates.length, lastWorn: dates[0],
    }));
  }, [log]);

  /**
   * 주어진 아이템 id와 같은 날짜에 함께 입힌 다른 아이템 id의 빈도 랭킹.
   * TOP N 반환 (기본 3개).
   */
  const getCoWornWith = useCallback((id: string, limit = 3): Array<{ id: string; count: number }> => {
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

  return { log, markWorn, undoLast, getEntry, getAllEntries, getCoWornWith };
}
