'use client';

import { useCallback, useEffect, useState } from 'react';
import { createSharedStore } from './sharedStore';

/**
 * AI 호출 일일 한도 관리.
 *
 * 베이직(무료) 사용자당 기본 한도:
 *   - vision    (사진 분석):   10회/일
 *   - parser    (텍스트 파싱): 20회/일
 *   - nutrition (영양 분석):    5회/일
 *   - url       (URL 분석):     5회/일
 *
 * Pro 구독 연동 전에는 모든 사용자가 베이직 한도 적용.
 * Pro 활성화 시 quotaFor에서 Infinity 반환하도록 확장.
 */

export type AiAgent = 'vision' | 'parser' | 'nutrition' | 'url';

export const DAILY_LIMITS: Record<AiAgent, number> = {
  vision:    10,
  parser:    20,
  nutrition:  5,
  url:        5,
};

interface QuotaState {
  date:   string;              // YYYY-MM-DD — 날짜 바뀌면 카운트 리셋
  counts: Record<AiAgent, number>;
}

const STORAGE_KEY = 'nemoa-ai-quota';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function emptyState(): QuotaState {
  return {
    date:   todayStr(),
    counts: { vision: 0, parser: 0, nutrition: 0, url: 0 },
  };
}

const store = createSharedStore<QuotaState>({
  storageKey: STORAGE_KEY,
  initial:    emptyState(),
  validate:   (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const s = raw as Partial<QuotaState>;
    if (typeof s.date !== 'string' || !s.counts || typeof s.counts !== 'object') return null;
    return s as QuotaState;
  },
});

export function useAiQuota() {
  const state = store.useStore();
  const [tick, setTick] = useState(0);

  // 자정 지나면 리셋 — 앱이 열려 있을 때 1분마다 날짜 체크
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (state.date !== todayStr()) {
      store.setState(() => emptyState());
    }
  }, [tick, state.date]);

  const remaining = useCallback((agent: AiAgent): number => {
    const used = state.counts[agent] ?? 0;
    return Math.max(0, DAILY_LIMITS[agent] - used);
  }, [state]);

  const canUse = useCallback((agent: AiAgent): boolean => {
    return remaining(agent) > 0;
  }, [remaining]);

  const consume = useCallback((agent: AiAgent): boolean => {
    if (!canUse(agent)) return false;
    store.setState((prev) => {
      const today = todayStr();
      if (prev.date !== today) {
        return { date: today, counts: { ...emptyState().counts, [agent]: 1 } };
      }
      return { ...prev, counts: { ...prev.counts, [agent]: (prev.counts[agent] ?? 0) + 1 } };
    });
    return true;
  }, [canUse]);

  return { state, remaining, canUse, consume, limits: DAILY_LIMITS };
}
