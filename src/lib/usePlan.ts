'use client';

import { useCallback } from 'react';
import { createSharedStore } from './sharedStore';
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
  return {
    tier,
    label:    PLAN_LABEL[tier],
    isFree:   tier === 'free',
    isPro:    tier === 'pro_lite' || tier === 'pro_max',
    isProMax: tier === 'pro_max',
    setTier,
  };
}
