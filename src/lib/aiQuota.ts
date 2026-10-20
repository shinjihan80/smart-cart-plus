'use client';

import { useCallback, useEffect, useState } from 'react';
import { createSharedStore } from './sharedStore';
import { usePlan } from './usePlan';
import { TIER_LIMITS, MAX_REWARD_BONUS_PER_AGENT, type AiAgent } from './aiQuotaConstants';
import { todayLocalStr } from './dateMath';

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
  return todayLocalStr();
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

  // 재발견 — 한도 체크(canUse)는 React 쪽 state(리렌더가 와야 갱신)를 읽고
  // 실제 증가는 별도의 store.setState로 나중에 일어나, 리렌더 사이에
  // consume()이 연속 두 번 불리면(더블탭 등) 둘 다 "아직 남음"으로 통과한
  // 뒤 각자 원자적으로 +1씩 더해 한도를 1회 초과시킬 수 있었다. 유료
  // API 호출(Vision/파서 등)을 세는 한도라 실제 비용과 직결 — 체크와
  // 증가를 store.setState 업데이터 안에서 같은 스냅샷으로 함께 평가해
  // 원자적으로 만든다(sharedStore의 state는 모듈 스코프 동기 변수라
  // updater 호출 자체는 항상 최신값을 본다).
  const consume = useCallback((agent: AiAgent): boolean => {
    if (!isFinite(limits[agent])) return true; // unlimited — skip tracking
    let allowed = false;
    store.setState((prev) => {
      const today = todayStr();
      const base  = prev.date !== today ? emptyState() : prev;
      const used  = base.counts[agent] ?? 0;
      const bonus = base.bonus?.[agent] ?? 0;
      if (used >= limits[agent] + bonus) return base;
      allowed = true;
      return { ...base, counts: { ...base.counts, [agent]: used + 1 } };
    });
    return allowed;
  }, [limits]);

  // 무료 사용자가 한도 소진 후 "광고 보고 1회 더" 로 얻는 보너스. agent당 하루 상한 있음.
  const bonusUsedToday = useCallback((agent: AiAgent): number => state.bonus?.[agent] ?? 0, [state]);

  const canGrantBonus = useCallback(
    (agent: AiAgent): boolean => bonusUsedToday(agent) < MAX_REWARD_BONUS_PER_AGENT,
    [bonusUsedToday],
  );

  // consume()과 같은 이유로 같은 수정 — canGrantBonus를 밖에서 먼저
  // 확인하면 리렌더 전 연속 호출 시 MAX_REWARD_BONUS_PER_AGENT를 넘겨
  // 보너스를 중복 지급할 수 있었다.
  const grantBonus = useCallback((agent: AiAgent): boolean => {
    let allowed = false;
    store.setState((prev) => {
      const today = todayStr();
      const base  = prev.date !== today ? emptyState() : prev;
      const used  = base.bonus?.[agent] ?? 0;
      if (used >= MAX_REWARD_BONUS_PER_AGENT) return base;
      allowed = true;
      return { ...base, bonus: { ...base.bonus, [agent]: used + 1 } };
    });
    return allowed;
  }, []);

  return { state, remaining, canUse, consume, limits, canGrantBonus, grantBonus };
}
