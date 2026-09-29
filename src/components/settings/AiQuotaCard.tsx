'use client';

import { motion } from 'framer-motion';
import { useAiQuota, TIER_LIMITS, type AiAgent } from '@/lib/aiQuota';
import { isMarketedUnlimited } from '@/lib/aiQuotaConstants';
import { useMonthlyVisionQuota } from '@/lib/monthlyVisionQuota';
import { usePlan, PLAN_LABEL } from '@/lib/usePlan';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';

const AGENTS: Array<{ key: AiAgent; label: string; emoji: string }> = [
  { key: 'vision',    label: '사진 분석',   emoji: '📸' },
  { key: 'parser',    label: '텍스트 파싱', emoji: '📝' },
  { key: 'nutrition', label: '영양 분석',   emoji: '🥗' },
  { key: 'url',       label: 'URL 분석',    emoji: '🔗' },
];

function QuotaTile({
  emoji, label, left, total, isUnlimited,
}: { emoji: string; label: string; left: number; total: number; isUnlimited: boolean }) {
  const pct   = isUnlimited ? 100 : total > 0 ? Math.round((left / total) * 100) : 0;
  const isLow = !isUnlimited && left < total * 0.3;
  const tone  = !isUnlimited && left === 0
    ? 'text-brand-warning'
    : isLow
    ? 'text-amber-600'
    : 'text-brand-primary';
  return (
    <div className="rounded-xl border border-gray-100 p-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 truncate min-w-0">{emoji} {label}</span>
        <span className={`text-xs font-bold tabular-nums ${tone}`}>
          {isUnlimited ? '∞' : `${left}/${total}`}
        </span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            !isUnlimited && left === 0
              ? 'bg-brand-warning'
              : isLow
              ? 'bg-amber-400'
              : 'bg-brand-primary/60'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AiQuotaCard() {
  const { remaining } = useAiQuota();
  const { tier }      = usePlan();
  const limits        = TIER_LIMITS[tier];
  const monthlyVision  = useMonthlyVisionQuota(); // 사진 분석은 모든 등급 공통 월간 한도

  // 0한도(현재는 무료 등급의 URL 분석)는 애초에 못 쓰는 기능이라 "0/0"으로
  // 보여줘 봐야 혼란만 준다 — 등록 시트의 Pro 잠금·요금제 비교표의 "Pro
  // 전용"과 이미 일치하니 카드에서는 아예 뺀다(P0-14, 검토단/전문단 4회
  // 독립 재확인 — "한 화면에서 3가지 상태" 문제의 근본 원인).
  const dailyAgents = AGENTS.filter((a) => a.key !== 'vision' && limits[a.key] > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.23 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      {/* 사진 분석은 월간 한도라 일간 리셋 그룹과 헤더를 분리한다 — 예전엔
          한 헤더("AI 오늘 남은 횟수 · 매일 00시 리셋") 아래 사진 분석만
          작은 회색 "(월간)" 표기로 얹혀 있어 리셋 주기가 실제로 2종인 게
          잘 안 보였다(P0-14). */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="🤖" size={16} className="text-brand-primary" />
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">AI 이번 달 남은 횟수</span>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{PLAN_LABEL[tier]} · 매달 1일 리셋</span>
      </div>
      <div className="mb-3">
        <QuotaTile
          emoji="📸" label="사진 분석"
          left={monthlyVision.remaining} total={monthlyVision.limit}
          isUnlimited={!isFinite(monthlyVision.limit)}
        />
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">AI 오늘 남은 횟수</span>
        <span className="text-xs text-gray-400 whitespace-nowrap">매일 00시 리셋</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {dailyAgents.map((a) => {
          const left  = remaining(a.key);
          const total = limits[a.key];
          const isUnlimited = !isFinite(total) || (isMarketedUnlimited(tier) && left > 0);
          return <QuotaTile key={a.key} emoji={a.emoji} label={a.label} left={left} total={total} isUnlimited={isUnlimited} />;
        })}
      </div>

      {tier === 'free' && (
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          Pro Lite / Pro Max 구독 시 더 많은 AI 호출 사용 가능. 결제 연동 출시 예정.
        </p>
      )}
    </motion.div>
  );
}
