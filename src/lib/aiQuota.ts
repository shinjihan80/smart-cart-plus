'use client';

import { useCallback, useEffect, useState } from 'react';
import { createSharedStore } from './sharedStore';
import { usePlan } from './usePlan';
import { TIER_LIMITS, MAX_REWARD_BONUS_PER_AGENT, type AiAgent } from './aiQuotaConstants';

export type { AiAgent };
export { TIER_LIMITS };

// backward-compat alias — consumers that haven't migrated still compile
export const DAILY_LIMITS = TIER_LIMITS.free;

interface QuotaState {
  date:   string;              // YYYY-MM-DD
  counts: Record<AiAgent, number>;
  bonus:  Record<AiAgent, number>; // 광고 시청으로 획득한 보너스 사용 횟수(오늘)
}

const STORAGE_KEY = 'nemoa-ai-quota';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function emptyCounts(): Record<AiAgent, number> {
  return { vision: 0, parser: 0, nutrition: 0, url: 0, fridgeSection: 0 };
}

function emptyState(): QuotaState {
  return {
    date:   todayStr(),
    counts: emptyCounts(),
    bonus:  emptyCounts(),
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
  const { tier } = usePlan();
  const limits   = TIER_LIMITS[tier];
  const state    = store.useStore();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (state.date !== todayStr()) store.setState(() => emptyState());
  }, [tick, state.date]);

  const remaining = useCallback((agent: AiAgent): number => {
    const limit = limits[agent];
    if (!isFinite(limit)) return Infinity;
    const bonus = state.bonus?.[agent] ?? 0;
    return Math.max(0, limit + bonus - (state.counts[agent] ?? 0));
  }, [state, limits]);

  const canUse = useCallback((agent: AiAgent): boolean => remaining(agent) > 0, [remaining]);

  const consume = useCallback((agent: AiAgent): boolean => {
    if (!canUse(agent)) return false;
    if (!isFinite(limits[agent])) return true; // unlimited — skip tracking
    store.setState((prev) => {
      const today = todayStr();
      if (prev.date !== today) {
        return { ...emptyState(), counts: { ...emptyCounts(), [agent]: 1 } };
      }
      return { ...prev, counts: { ...prev.counts, [agent]: (prev.counts[agent] ?? 0) + 1 } };
    });
    return true;
  }, [canUse, limits]);

  // 무료 사용자가 한도 소진 후 "광고 보고 1회 더" 로 얻는 보너스. agent당 하루 상한 있음.
  const bonusUsedToday = useCallback((agent: AiAgent): number => state.bonus?.[agent] ?? 0, [state]);

  const canGrantBonus = useCallback(
    (agent: AiAgent): boolean => bonusUsedToday(agent) < MAX_REWARD_BONUS_PER_AGENT,
    [bonusUsedToday],
  );

  const grantBonus = useCallback((agent: AiAgent): boolean => {
    if (!canGrantBonus(agent)) return false;
    store.setState((prev) => {
      const today = todayStr();
      if (prev.date !== today) {
        return { ...emptyState(), bonus: { ...emptyCounts(), [agent]: 1 } };
      }
      return { ...prev, bonus: { ...prev.bonus, [agent]: (prev.bonus?.[agent] ?? 0) + 1 } };
    });
    return true;
  }, [canGrantBonus]);

  return { state, remaining, canUse, consume, limits, canGrantBonus, grantBonus };
}
