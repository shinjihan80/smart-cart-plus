'use client';

import { motion } from 'framer-motion';
import { Shirt, ChefHat, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWearLog } from '@/lib/wearLog';
import { useCookLog } from '@/lib/recipeCookLog';
import { countTodayActivity } from '@/lib/activityToday';

/**
 * 오늘의 기록 섹션 — 본문에 가로로 펼친 요약.
 *
 * 3 카테고리 (착용·조리·소진) 카운트.
 * 회색 배경 섹션으로 감싸서 헤더와 시각적으로 구분.
 */
export default function TodayActivity() {
  const { log: wearLog } = useWearLog();
  const { log: cookLog } = useCookLog();
  const { discardHistory } = useCart();

  const { worn, cooked, discarded } = countTodayActivity(wearLog, cookLog, discardHistory);

  const rows: Array<{ Icon: typeof Shirt; label: string; count: number }> = [
    { Icon: Shirt,   label: '착용', count: worn      },
    { Icon: ChefHat, label: '조리', count: cooked    },
    { Icon: Trash2,  label: '소진', count: discarded },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl bg-gray-100 px-4 py-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">오늘의 기록</span>
        <span className="text-xs text-gray-400 tabular-nums">
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex-1 flex items-center gap-1.5 bg-white rounded-xl px-2.5 py-2"
          >
            <r.Icon size={14} strokeWidth={2} className="text-gray-500 shrink-0" />
            <span className="text-xs text-gray-500 flex-1">{r.label}</span>
            <span className={`text-sm font-bold tabular-nums ${r.count > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
              {r.count}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
