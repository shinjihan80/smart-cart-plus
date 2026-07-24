'use client';

import { motion } from 'framer-motion';
import { useAiQuota, TIER_LIMITS, type AiAgent } from '@/lib/aiQuota';
import { isMarketedUnlimited } from '@/lib/aiQuotaConstants';
import { usePlan, PLAN_LABEL } from '@/lib/usePlan';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';

const AGENTS: Array<{ key: AiAgent; label: string; emoji: string }> = [
  { key: 'vision',    label: '사진 분석',   emoji: '📸' },
  { key: 'parser',    label: '텍스트 파싱', emoji: '📝' },
  { key: 'nutrition', label: '영양 분석',   emoji: '🥗' },
  { key: 'url',       label: 'URL 분석',    emoji: '🔗' },
];

export default function AiQuotaCard() {
  const { remaining } = useAiQuota();
  const { tier }      = usePlan();
  const limits        = TIER_LIMITS[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.23 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="🤖" size={16} className="text-brand-primary" />
          <span className="text-xs text-gray-400 font-medium">AI 오늘 남은 횟수</span>
        </div>
        <span className="text-xs text-gray-400">{PLAN_LABEL[tier]} · 매일 00시 리셋</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {AGENTS.map((a) => {
          const left  = remaining(a.key);
          const total = limits[a.key];
          const isUnlimited = !isFinite(total) || (isMarketedUnlimited(tier) && left > 0);
          const pct   = isUnlimited ? 100 : total > 0 ? Math.round((left / total) * 100) : 0;
          const isLow = !isUnlimited && left < total * 0.3;
          const tone  = !isUnlimited && left === 0
            ? 'text-brand-warning'
            : isLow
            ? 'text-amber-600'
            : 'text-brand-primary';
          return (
            <div key={a.key} className="rounded-xl border border-gray-100 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{a.emoji} {a.label}</span>
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
