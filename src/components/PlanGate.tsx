'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { usePlan } from '@/lib/usePlan';
import { PAYMENTS_ENABLED } from '@/lib/featureFlags';
import type { PlanTier } from '@/types';

const TIER_ORDER: PlanTier[] = ['free', 'pro_lite', 'pro_max'];

interface Props {
  minTier?: Exclude<PlanTier, 'free'>;
  feature:  string;
  children: React.ReactNode;
}

export default function PlanGate({ minTier = 'pro_lite', feature, children }: Props) {
  const { tier } = usePlan();

  // 결제 연동 전엔 업그레이드 버튼이 갈 곳이 없어 잠금만 걸면 이탈만 유발한다
  // (사업자등록 후 PAYMENTS_ENABLED가 true가 되면 이 우회도 자동으로 사라진다).
  if (!PAYMENTS_ENABLED) return <>{children}</>;

  if (TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(minTier)) return <>{children}</>;

  return (
    <div
      className="rounded-[28px] bg-white border border-gray-100 px-4 py-5 flex flex-col items-center gap-3 text-center"
      style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}
    >
      <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
        <Lock size={18} className="text-brand-primary" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{feature}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {minTier === 'pro_lite' ? 'Pro Lite' : 'Pro Max'} 이상 플랜에서 이용할 수 있어요
        </p>
      </div>
      <Link
        href="/mypage?tab=profile#plan"
        className="text-xs font-semibold px-4 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90"
      >
        플랜 업그레이드 →
      </Link>
    </div>
  );
}
