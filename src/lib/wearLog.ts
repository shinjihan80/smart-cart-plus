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

  return { log, markWorn, undoLast, getEntry, getAllEntries };
}
