'use client';

/**
 * AI 사진 분석(vision) 월간 한도 — 모든 등급 공통(일일 아님).
 *
 * 원래 사진 분석은 Pro 전용으로 완전히 잠겨 있었는데, 무료 사용자가 핵심 기능을
 * 한 번도 못 써보면 Pro 전환 유인이 약하다는 판단으로 "맛보기"를 열어줬다.
 * 이후 다른 AI 기능(텍스트 파싱 등)과의 일관성을 위해 Pro Lite/Max도 일일이 아니라
 * 월간 한도로 통일했다 — Pro Max는 소프트캡이지만 UI에는 계속 "무제한"으로 표시.
 */
import { useCallback, useEffect, useState } from 'react';
import { createSharedStore } from './sharedStore';
import { usePlan } from './usePlan';
import type { PlanTier } from '@/types';

export const VISION_MONTHLY_LIMITS: Record<PlanTier, number> = {
  free:     10,
  pro_lite: 300,
  pro_max:  3000, // 소프트캡 — 정상 사용자는 도달 못 함, UI엔 "무제한"으로 표시
};

interface MonthlyState {
  month: string; // YYYY-MM
  count: number;
}

const STORAGE_KEY = 'nemoa-vision-monthly-quota';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function emptyState(): MonthlyState {
  return { month: currentMonth(), count: 0 };
}

const store = createSharedStore<MonthlyState>({
  storageKey: STORAGE_KEY,
  initial:    emptyState(),
  validate:   (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const s = raw as Partial<MonthlyState>;
    if (typeof s.month !== 'string' || typeof s.count !== 'number') return null;
    return s as MonthlyState;
  },
});

export function useMonthlyVisionQuota() {
  const { tier } = usePlan();
  const limit = VISION_MONTHLY_LIMITS[tier];
  const state = store.useStore();
  const [tick, setTick] = useState(0);

  // 월이 바뀌는 순간을 놓치지 않도록 aiQuota.ts와 동일하게 1분 간격으로 체크
  // (달 경계는 자정에만 넘어가므로 부담 없음).
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (state.month !== currentMonth()) store.setState(() => emptyState());
  }, [tick, state.month]);

  const remaining = Math.max(0, limit - state.count);
  const canUse    = remaining > 0;

  const consume = useCallback((): boolean => {
    const thisMonth = currentMonth();
    let ok = false;
    store.setState((prev) => {
      const base = prev.month === thisMonth ? prev : emptyState();
      if (base.count >= limit) { ok = false; return base; }
      ok = true;
      return { ...base, count: base.count + 1 };
    });
    return ok;
  }, [limit]);

  return { remaining, canUse, consume, limit };
}
