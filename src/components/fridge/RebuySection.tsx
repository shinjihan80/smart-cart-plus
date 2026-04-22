'use client';

import { motion } from 'framer-motion';
import PartnerChip from '@/components/PartnerChip';
import { PARTNERS } from '@/lib/partnerLinks';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface RebuySectionProps {
  history:      { name: string; category: string }[];
  currentNames: string[];
  onQuickAdd:   (name: string) => void;
}

export default function RebuySection({ history, currentNames, onQuickAdd }: RebuySectionProps) {
  // 소진된 식품 중 현재 보유하지 않은 것만 추천
  const suggestions = history
    .filter((h) => h.category === '식품')
    .filter((h) => !currentNames.includes(h.name))
    .filter((h, i, arr) => arr.findIndex((a) => a.name === h.name) === i)
    .slice(0, 5);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.18 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-base">🔄</span>
        <span className="text-xs text-gray-400 font-medium">재구매 추천</span>
        <span className="text-[10px] text-gray-300">소진한 식품 기반</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {suggestions.map((s) => (
          <button
            key={s.name}
            onClick={() => onQuickAdd(s.name)}
            className="text-xs px-2.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100 active:scale-95 transition-all"
          >
            🔄 {s.name}
          </button>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-gray-400">쇼핑몰 연결:</span>
        <PartnerChip partner={PARTNERS.quick_mart} />
      </div>
    </motion.div>
  );
}
