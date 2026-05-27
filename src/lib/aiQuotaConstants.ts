import type { PlanTier } from '@/types';

export type AiAgent = 'vision' | 'parser' | 'nutrition' | 'url' | 'fridgeSection';

export const TIER_LIMITS: Record<PlanTier, Record<AiAgent, number>> = {
  free: {
    vision:        5,
    parser:        10,
    nutrition:      2,
    url:            2,
    fridgeSection:  5,
  },
  pro_lite: {
    vision:        30,
    parser:        60,
    nutrition:     15,
    url:           15,
    fridgeSection: 30,
  },
  pro_max: {
    vision:        Infinity,
    parser:        Infinity,
    nutrition:     Infinity,
    url:           Infinity,
    fridgeSection: Infinity,
  },
};

export const RATE_LIMITS: Record<AiAgent, { perMin: number; perHour: number }> = {
  vision:        { perMin: 20, perHour:  60 },
  parser:        { perMin: 30, perHour: 100 },
  nutrition:     { perMin: 15, perHour:  40 },
  url:           { perMin: 20, perHour:  50 },
  fridgeSection: { perMin: 30, perHour: 120 },
};
