'use client';

import { motion } from 'framer-motion';
import { springTransition, CARD, CARD_SHADOW } from './shared';

const SPENDING_DATA = [
  { month: '1월', amount: 187400 },
  { month: '2월', amount: 156200 },
  { month: '3월', amount: 203800 },
  { month: '4월', amount: 272200 },
];

export default function SpendingSection() {
  const max = Math.max(...SPENDING_DATA.map((d) => d.amount));
  const total = SPENDING_DATA.reduce((s, d) => s + d.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.25 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-gray-400 font-medium">월별 지출 추이</h3>
        <span className="text-xs font-bold text-gray-700 tabular-nums">
          총 ₩{total.toLocaleString()}
        </span>
      </div>
      <div className="flex gap-2 items-stretch">
        {SPENDING_DATA.map((d, i) => {
          const heightPct = Math.max(15, (d.amount / max) * 100);
          const isLast = i === SPENDING_DATA.length - 1;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
              {/* 위: 금액 — 고정 높이 */}
              <span className={`h-4 text-xs font-bold tabular-nums leading-none ${isLast ? 'text-brand-primary' : 'text-gray-400'}`}>
                {(d.amount / 10000).toFixed(1)}만
              </span>
              {/* 가운데: bar 영역 — 고정 96px, 안에서 % 높이로 정렬 */}
              <div className="w-full h-24 flex flex-col justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ ...springTransition, delay: 0.3 + i * 0.08 }}
                  className={`w-full rounded-xl ${isLast ? 'bg-brand-primary' : 'bg-gray-200'}`}
                />
              </div>
              {/* 아래: 월 — 고정 높이 */}
              <span className={`h-5 text-sm font-medium leading-tight ${isLast ? 'text-brand-primary' : 'text-gray-400'}`}>
                {d.month}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
