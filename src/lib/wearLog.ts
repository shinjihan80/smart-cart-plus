'use client';

import { useCallback } from 'react';
import { createSharedStore } from './sharedStore.ts';
import { todayLocalStr, localMidnight, todayMidnight, daysBetween } from './dateMath.ts';
import { isClothingItem, FASHION_GROUP, type ClothingItem, type CartItem } from '../types/index.ts';

const STORAGE_KEY = 'nemoa-wear-log';

/** clothing id → 착용 날짜(YYYY-MM-DD) 배열. 최신순 유지. */
export type WearLog = Record<string, string[]>;

/**
 * "아직 안 입어본"(착용 기록 0건) 패션 아이템 — 단일 소스.
 *
 * 예전엔 화면마다 이 필터를 따로 짜서, 옷장>코디는 의류만 세고(예:
 * 10벌) 마이>요약 쪽은 신발·가방·액세서리까지 포함한 패션 전체를
 * 세는(예: 21벌) 등 같은 데이터를 두고 "미착용"이 화면마다 다른
 * 숫자로 보였다(P0-60, 전문단 E1 발견). scope를 필수 인자로 받아
 * 호출부가 실수로 범위를 섞지 못하게 한다 — 라벨에도 scope를 그대로
 * 반영할 것("아직 안 입어본 의류 N벌" / "미착용 패션 전체 N벌").
 */
export function selectNeverWorn(
  items: readonly CartItem[],
  log: WearLog,
  scope: 'clothing' | 'all-fashion',
): ClothingItem[] {
  return items
    .filter(isClothingItem)
    .filter((c) => scope === 'all-fashion' || FASHION_GROUP[c.category] === '의류')
    .filter((c) => (log[c.id]?.length ?? 0) === 0);
}

const store = createSharedStore<WearLog>({
  storageKey: STORAGE_KEY,
  initial:    {},
  validate:   (raw) => (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as WearLog : null),
});

function today(): string {
  return todayLocalStr();
}

/** 두 ISO 날짜 문자열 간의 일 단위 차이 (양수 = 과거, 음수 = 미래). */
export function daysSince(iso: string): number {
  return daysBetween(localMidnight(iso), todayMidnight());
}

export interface WearEntry {
  id:        string;
  count:     number;
  lastWorn?: string;
}

export function useWearLog() {
  const log = store.useStore();

  const markWorn = useCallback((id: string, date?: string) => {
    store.setState((prev) => {
      const dates = prev[id] ?? [];
      const d = date ?? today();
      if (dates.includes(d)) return prev;
      const next = [d, ...dates].sort((a, b) => b.localeCompare(a));
      return { ...prev, [id]: next.slice(0, 365) };
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
