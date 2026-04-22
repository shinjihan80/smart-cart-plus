'use client';

import { motion } from 'framer-motion';
import { useWearLog } from '@/lib/wearLog';
import { useCookLog } from '@/lib/recipeCookLog';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface Props {
  discardHistory: { name: string; category: string; date: string }[];
}

/**
 * 이번 달(YYYY-MM) 활동 집계.
 * AnnualSummary와 구조 동일하지만 윈도우가 한 달 — 올해 요약보다 더 빠른 피드백.
 */
export default function MonthlySummarySection({ discardHistory }: Props) {
  const { log: wearLog } = useWearLog();
  const { log: cookLog } = useCookLog();

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const inMonth = (d: string): boolean => d.startsWith(monthPrefix);

  const cookCount = Object.values(cookLog).flat().filter(inMonth).length;
  const wearCount = Object.values(wearLog).flat().filter(inMonth).length;
  const discardCount = discardHistory.filter((h) => h.category === '식품' && h.date && inMonth(h.date)).length;

  if (cookCount === 0 && wearCount === 0 && discardCount === 0) return null;

  const daysPassed = now.getDate();
  const cookPerDay = (cookCount / daysPassed).toFixed(1);
  const wearPerDay = (wearCount / daysPassed).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.14 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">📆</span>
          <span className="text-xs text-gray-400 font-medium">이번 달 활동</span>
        </div>
        <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
          {now.getMonth() + 1}월 · {daysPassed}일째
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-0.5 py-1">
          <span className="text-lg">🍳</span>
          <span className="text-base font-extrabold text-brand-primary tabular-nums">{cookCount}</span>
          <span className="text-[10px] text-gray-400 font-medium">조리 · {cookPerDay}/일</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <span className="text-lg">👕</span>
          <span className="text-base font-extrabold text-brand-primary tabular-nums">{wearCount}</span>
          <span className="text-[10px] text-gray-400 font-medium">착용 · {wearPerDay}/일</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <span className="text-lg">♻️</span>
          <span className="text-base font-extrabold text-brand-primary tabular-nums">{discardCount}</span>
          <span className="text-[10px] text-gray-400 font-medium">소진</span>
        </div>
      </div>
    </motion.div>
  );
}
