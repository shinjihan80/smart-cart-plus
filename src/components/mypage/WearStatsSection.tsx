'use client';

import { motion } from 'framer-motion';
import { isClothingItem, FASHION_EMOJI, type CartItem } from '@/types';
import { useWearLog, daysSince } from '@/lib/wearLog';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface WearStatsSectionProps {
  items: CartItem[];
}

export default function WearStatsSection({ items }: WearStatsSectionProps) {
  const { getEntry } = useWearLog();
  const clothes = items.filter(isClothingItem);

  const annotated = clothes.map((c) => ({ item: c, ...getEntry(c.id) }));

  const topWorn = annotated
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const neverWorn = annotated
    .filter((x) => x.count === 0)
    .slice(0, 3);

  const longIdle = annotated
    .filter((x) => x.count > 0 && x.lastWorn && daysSince(x.lastWorn) >= 30)
    .sort((a, b) => daysSince(b.lastWorn!) - daysSince(a.lastWorn!))
    .slice(0, 3);

  if (topWorn.length === 0 && neverWorn.length === 0 && longIdle.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.26 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">👕</span>
        <span className="text-xs text-gray-400 font-medium">착용 로그 분석</span>
      </div>

      {topWorn.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-brand-primary font-semibold mb-1.5">♥ 자주 입는 옷 TOP 3</p>
          <div className="flex flex-col gap-1">
            {topWorn.map((x) => (
              <div key={x.item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{FASHION_EMOJI[x.item.category] ?? '👕'}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.item.name}</span>
                <span className="text-[10px] text-brand-primary font-bold tabular-nums">{x.count}회</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {longIdle.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-amber-600 font-semibold mb-1.5">🌙 오래 안 입은 옷</p>
          <div className="flex flex-col gap-1">
            {longIdle.map((x) => (
              <div key={x.item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{FASHION_EMOJI[x.item.category] ?? '👕'}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.item.name}</span>
                <span className="text-[10px] text-amber-600 font-medium tabular-nums">{daysSince(x.lastWorn!)}일</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {neverWorn.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 font-semibold mb-1.5">👀 아직 안 입은 옷</p>
          <div className="flex flex-col gap-1">
            {neverWorn.map((x) => (
              <div key={x.item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{FASHION_EMOJI[x.item.category] ?? '👕'}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.item.name}</span>
                <span className="text-[10px] text-gray-400">—</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
        옷장 카드를 펼쳐 &ldquo;👕 오늘 입었어요&rdquo;를 누르면 착용 기록이 쌓여요.
      </p>
    </motion.div>
  );
}
