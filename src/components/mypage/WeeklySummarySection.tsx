'use client';

import { motion } from 'framer-motion';
import { useWearLog } from '@/lib/wearLog';
import { useCookLog } from '@/lib/recipeCookLog';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface Props {
  discardHistory: { name: string; category: string; date: string }[];
}

/**
 * 이번 주(7일 윈도우) 활동 집계.
 * MonthlySummary와 짝 — 사용자가 홈 "이번 주 더보기"를 누를 때 정확히 향하는 카드.
 * 비활성(0건)일 땐 렌더하지 않아 카드 스택을 비대하게 만들지 않음.
 */
export default function WeeklySummarySection({ discardHistory }: Props) {
  const { log: wearLog } = useWearLog();
  const { log: cookLog } = useCookLog();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6); // 오늘 포함 7일
  weekStart.setHours(0, 0, 0, 0);
  const startStr = weekStart.toISOString().split('T')[0];
  const inWeek = (d: string): boolean => d >= startStr;

  const cookCount    = Object.values(cookLog).flat().filter(inWeek).length;
  const wearCount    = Object.values(wearLog).flat().filter(inWeek).length;
  const discardCount = discardHistory.filter((h) => h.category === '식품' && h.date && inWeek(h.date)).length;

  if (cookCount === 0 && wearCount === 0 && discardCount === 0) return null;

  const cookPerDay = (cookCount / 7).toFixed(1);
  const wearPerDay = (wearCount / 7).toFixed(1);

  return (
    <motion.div
      id="weekly-stats"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.12 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="📅" size={16} className="text-gray-600" />
          <span className="text-xs text-gray-400 font-medium">이번 주 활동</span>
        </div>
        <span className="text-sm text-gray-400 shrink-0">최근 7일</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-0.5 py-1">
          <EmojiIcon emoji="🍳" size={18} className="text-gray-700" />
          <span className="text-base font-extrabold text-brand-primary tabular-nums">{cookCount}</span>
          <span className="text-xs text-gray-400 font-medium">조리 · {cookPerDay}/일</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <EmojiIcon emoji="👕" size={18} className="text-gray-700" />
          <span className="text-base font-extrabold text-brand-primary tabular-nums">{wearCount}</span>
          <span className="text-xs text-gray-400 font-medium">착용 · {wearPerDay}/일</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <EmojiIcon emoji="♻️" size={18} className="text-gray-700" />
          <span className="text-base font-extrabold text-brand-primary tabular-nums">{discardCount}</span>
          <span className="text-xs text-gray-400 font-medium">소진</span>
        </div>
      </div>
    </motion.div>
  );
}
