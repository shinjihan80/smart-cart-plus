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
      <div className="flex items-end gap-2 h-24">
        {SPENDING_DATA.map((d, i) => {
          const h = Math.max(12, (d.amount / max) * 88);
          const isLast = i === SPENDING_DATA.length - 1;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className={`text-[9px] font-bold tabular-nums ${isLast ? 'text-brand-primary' : 'text-gray-400'}`}>
                {(d.amount / 10000).toFixed(1)}만
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: h }}
                transition={{ ...springTransition, delay: 0.3 + i * 0.08 }}
                className={`w-full rounded-xl ${isLast ? 'bg-brand-primary' : 'bg-gray-200'}`}
              />
              <span className={`text-[10px] font-medium ${isLast ? 'text-brand-primary' : 'text-gray-400'}`}>
                {d.month}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
