'use client';

import { motion } from 'framer-motion';
import { useWearLog } from '@/lib/wearLog';
import { useCookLog } from '@/lib/recipeCookLog';
import { springTransition, CARD, CARD_SHADOW } from './shared';

/**
 * 올해 누적 조리·착용·소진 요약.
 * discardHistory를 prop으로 받아 식재료 소진 횟수 표시.
 */
interface Props {
  discardHistory: { name: string; category: string; date: string }[];
}

export default function AnnualSummarySection({ discardHistory }: Props) {
  const { log: wearLog } = useWearLog();
  const { log: cookLog } = useCookLog();

  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01`;

  const inYear = (d: string): boolean => d >= yearStart;

  const cookTotal = Object.values(cookLog)
    .flat()
    .filter(inYear).length;
  const wearTotal = Object.values(wearLog)
    .flat()
    .filter(inYear).length;
  const discardTotal = discardHistory
    .filter((h) => h.category === '식품' && h.date && inYear(h.date))
    .length;

  // 아무것도 기록되지 않았으면 숨김
  if (cookTotal === 0 && wearTotal === 0 && discardTotal === 0) return null;

  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(yearStart).getTime()) / 86_400_000) + 1;

  const stats = [
    { emoji: '🍳', label: '조리',       value: cookTotal },
    { emoji: '👕', label: '착용',       value: wearTotal },
    { emoji: '♻️', label: '소진 식품',  value: discardTotal },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.16 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <span className="text-xs text-gray-400 font-medium">올해 활동 요약</span>
        </div>
        <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
          {year}년 · {dayOfYear}일째
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5 py-1">
            <span className="text-lg">{s.emoji}</span>
            <span className="text-base font-extrabold text-brand-primary tabular-nums">{s.value}</span>
            <span className="text-[10px] text-gray-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
