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
  // 마케팅상 "무제한"이지만, 봇 등 비정상 반복 호출로 인한 API 원가 폭주를 막기 위해
  // 정상 사용자는 절대 도달하지 않을 높은 소프트캡을 둔다 (실질 체감은 무제한).
  pro_max: {
    vision:        200,
    parser:        200,
    nutrition:     200,
    url:           200,
    fridgeSection: 200,
  },
};

// pro_max는 소프트캡(200/일)이 있지만, 정상 사용자는 절대 도달하지 않으므로
// UI에는 항상 '무제한'으로 표시한다. 실제 한도 도달 여부는 remaining()으로 별도 확인.
export function isMarketedUnlimited(tier: PlanTier): boolean {
  return tier === 'pro_max';
}

// 무료 사용자가 한도를 다 쓰면 "광고 보고 1회 더" 버튼으로 얻을 수 있는 보너스.
// agent당 하루 최대 3회 — 너무 잦은 광고 시청을 유도하지 않도록 상한.
export const MAX_REWARD_BONUS_PER_AGENT = 3;

export const RATE_LIMITS: Record<AiAgent, { perMin: number; perHour: number }> = {
  vision:        { perMin: 20, perHour:  60 },
  parser:        { perMin: 30, perHour: 100 },
  nutrition:     { perMin: 15, perHour:  40 },
  url:           { perMin: 20, perHour:  50 },
  fridgeSection: { perMin: 30, perHour: 120 },
};
