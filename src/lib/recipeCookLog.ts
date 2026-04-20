'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'nemoa-cook-log';

/** recipe id → 조리 날짜(YYYY-MM-DD) 배열. 최신순 유지. */
export type CookLog = Record<string, string[]>;

function readLog(): CookLog {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

function writeLog(log: CookLog) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)); }
  catch { /* quota */ }
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export interface CookEntry {
  id:         string;
  count:      number;
  lastCooked?: string;
}

export function useCookLog() {
  const [log, setLog] = useState<CookLog>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLog(readLog());
    setHydrated(true);
  }, []);

  const markCooked = useCallback((id: string) => {
    setLog((prev) => {
      const dates = prev[id] ?? [];
      const d = today();
      // 같은 날 중복 방지
      if (dates[0] === d) return prev;
      const next = { ...prev, [id]: [d, ...dates].slice(0, 365) };
      writeLog(next);
      return next;
    });
  }, []);

  const undoLast = useCallback((id: string) => {
    setLog((prev) => {
      const dates = prev[id];
      if (!dates || dates.length === 0) return prev;
      const next = { ...prev, [id]: dates.slice(1) };
      writeLog(next);
      return next;
    });
  }, []);

  const getEntry = useCallback((id: string): CookEntry => {
    const dates = log[id] ?? [];
    return { id, count: dates.length, lastCooked: dates[0] };
  }, [log]);

  return { log, markCooked, undoLast, getEntry, hydrated };
}
