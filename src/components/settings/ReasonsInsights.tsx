'use client';

import { motion } from 'framer-motion';
import { useReasonsLog } from '@/lib/reasonsLog';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from '@/components/closet/shared';

/**
 * 추천 신호 선호도 인사이트.
 *
 * 사용자가 코디 착용 / 레시피 조리한 시점에 그 추천의 reasons 가 누적되어,
 * 어떤 신호(시즌·로테이션·자주 입는 조합·임박 등)가 실제 행동으로 이어지는지 노출.
 *
 * 활용
 *  - 자기 행동 인사이트: "나는 💞 자주 입는 조합을 가장 자주 따라간다"
 *  - 추후 추천 가중치 자동 조정의 기반 데이터
 */
export default function ReasonsInsights() {
  const { total, top, clearAll } = useReasonsLog();

  if (total === 0) return null;

  const top5 = top(5);
  const max = Math.max(...top5.map((t) => t.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.075 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="🎯" size={16} className="text-gray-600" />
          <span className="text-xs text-gray-400 font-medium">추천 따라간 패턴</span>
        </div>
        <span className="text-sm text-gray-400 tabular-nums shrink-0">
          총 {total}회
        </span>
      </div>

      <div className="flex flex-col gap-1.5 mb-2.5">
        {top5.map((t) => {
          const widthPct = (t.count / max) * 100;
          return (
            <div key={t.reason} className="flex items-center gap-2">
              <span className="text-xs text-gray-700 w-32 truncate shrink-0">{t.reason}</span>
              <div className="flex-1 h-3 rounded-full bg-gray-50 overflow-hidden">
                <div
                  className="h-full bg-brand-primary/70 rounded-full transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 tabular-nums w-8 text-right shrink-0">{t.count}</span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-50 pt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          코디 착용 · 레시피 조리 시 자동 누적
        </span>
        <button
          onClick={() => {
            if (confirm('추천 선호도 기록을 모두 삭제할까요?')) clearAll();
          }}
          className="text-xs text-gray-400 hover:text-brand-warning transition-colors"
        >
          기록 삭제
        </button>
      </div>
    </motion.div>
  );
}
