'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'nemoa-wear-log';

/** clothing id → 착용 날짜(YYYY-MM-DD) 배열. 최신순 유지. */
export type WearLog = Record<string, string[]>;

function readLog(): WearLog {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

function writeLog(log: WearLog) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)); }
  catch { /* quota */ }
}

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
  lastWorn?: string; // YYYY-MM-DD
}

export function useWearLog() {
  const [log, setLog] = useState<WearLog>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLog(readLog());
    setHydrated(true);
  }, []);

  const markWorn = useCallback((id: string) => {
    setLog((prev) => {
      const dates = prev[id] ?? [];
      const d = today();
      if (dates[0] === d) return prev; // 같은 날 중복 기록 방지
      const next = { ...prev, [id]: [d, ...dates].slice(0, 365) }; // 1년치만 보관
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

  const getEntry = useCallback((id: string): WearEntry => {
    const dates = log[id] ?? [];
    return { id, count: dates.length, lastWorn: dates[0] };
  }, [log]);

  const getAllEntries = useCallback((): WearEntry[] => {
    return Object.entries(log).map(([id, dates]) => ({
      id, count: dates.length, lastWorn: dates[0],
    }));
  }, [log]);

  return { log, markWorn, undoLast, getEntry, getAllEntries, hydrated };
}
