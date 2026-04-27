'use client';

import { motion } from 'framer-motion';
import { useAiQuota, DAILY_LIMITS, type AiAgent } from '@/lib/aiQuota';
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
        <span className="text-xs text-gray-400">무료 · 매일 00시 리셋</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {AGENTS.map((a) => {
          const left  = remaining(a.key);
          const total = DAILY_LIMITS[a.key];
          const pct   = Math.round((left / total) * 100);
          const tone  = left === 0 ? 'text-brand-warning' : left < total * 0.3 ? 'text-amber-600' : 'text-brand-primary';
          return (
            <div key={a.key} className="rounded-xl border border-gray-100 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">
                  {a.emoji} {a.label}
                </span>
                <span className={`text-xs font-bold tabular-nums ${tone}`}>
                  {left}/{total}
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    left === 0 ? 'bg-brand-warning' : left < total * 0.3 ? 'bg-amber-400' : 'bg-brand-primary/60'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-400 mt-2 leading-relaxed">
        Pro 구독 시 무제한. Phase 7에 결제 연동 예정.
      </p>
    </motion.div>
  );
}
