'use client';

import { useCallback } from 'react';
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

  return { log, markCooked, undoLast, getEntry };
}
