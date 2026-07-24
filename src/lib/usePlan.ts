'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createSharedStore } from './sharedStore';
import { getDeviceId } from './deviceId';
import type { PlanTier } from '@/types';

const store = createSharedStore<PlanTier>({
  storageKey: 'nemoa-plan',
  initial:    'free',
  validate:   (raw): PlanTier | null => {
    if (raw === 'free' || raw === 'pro_lite' || raw === 'pro_max') return raw as PlanTier;
    return null;
  },
});

export const PLAN_LABEL: Record<PlanTier, string> = {
  free:     '무료',
  pro_lite: 'Pro Lite',
  pro_max:  'Pro Max',
};

export function usePlan() {
  const tier = store.useStore();
  const setTier = useCallback((t: PlanTier) => store.setState(() => t), []);

  // 부팅 시 1회 서버 구독 상태와 동기화 — 정기결제 갱신 실패로 서버가
  // 이미 무료로 강등했는데 로컬만 Pro로 남아있는 상황을 방지.
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    const deviceId = getDeviceId();
    if (!deviceId) return; // 결제한 적 없는 사용자 — 서버에 기록 자체가 없음

    fetch(`/api/subscription/status?deviceId=${encodeURIComponent(deviceId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { tier?: PlanTier } | null) => {
        if (data?.tier && data.tier !== tier) store.setState(() => data.tier!);
      })
      .catch(() => {}); // 네트워크 실패 시 로컬 값 유지 (fail-safe)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    tier,
    label:    PLAN_LABEL[tier],
    isFree:   tier === 'free',
    isPro:    tier === 'pro_lite' || tier === 'pro_max',
    isProMax: tier === 'pro_max',
    setTier,
  };
}
