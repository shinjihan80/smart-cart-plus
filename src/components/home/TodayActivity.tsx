'use client';

import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useWearLog } from '@/lib/wearLog';
import { useCookLog } from '@/lib/recipeCookLog';
import { countTodayActivity } from '@/lib/activityToday';

export default function TodayActivity() {
  const { log: wearLog } = useWearLog();
  const { log: cookLog } = useCookLog();
  const { discardHistory } = useCart();

  const { worn, cooked, discarded, total } = countTodayActivity(wearLog, cookLog, discardHistory);

  if (total === 0) {
    return (
      <p className="text-[11px] text-gray-400">
        오늘의 기록 · <span className="text-gray-500">첫 번째 기록은 어때요?</span>
      </p>
    );
  }

  const parts: { emoji: string; count: number }[] = [];
  if (worn > 0)      parts.push({ emoji: '👕', count: worn });
  if (cooked > 0)    parts.push({ emoji: '🍲', count: cooked });
  if (discarded > 0) parts.push({ emoji: '🗑️', count: discarded });

  return (
    <motion.p
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="text-[11px] text-gray-500 flex items-center gap-1.5"
    >
      <span className="text-gray-400">오늘의 기록 ·</span>
      {parts.map((p, i) => (
        <span key={p.emoji} className="flex items-center gap-0.5">
          <span>{p.emoji}</span>
          <span className="tabular-nums font-semibold text-gray-700">{p.count}</span>
          {i < parts.length - 1 && <span className="text-gray-300 mx-0.5">·</span>}
        </span>
      ))}
    </motion.p>
  );
}
