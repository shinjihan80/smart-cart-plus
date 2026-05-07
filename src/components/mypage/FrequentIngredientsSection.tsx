'use client';

import { motion } from 'framer-motion';
import { getFoodEmoji } from '@/lib/ingredientInference';
import { useShoppingList } from '@/lib/shoppingList';
import { useToast } from '@/context/ToastContext';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface Props {
  discardHistory: { name: string; category: string; date: string }[];
  currentItemNames: string[];
}

/**
 * discardHistory 누적에서 식품 재구매 빈도를 산출해 TOP 5 표시.
 * 각 항목에 쇼핑 리스트 담기 CTA 포함.
 */
export default function FrequentIngredientsSection({ discardHistory, currentItemNames }: Props) {
  const { has, add } = useShoppingList();
  const { showToast } = useToast();

  // 이름별 소진 횟수 집계 (식품만)
  const counts = new Map<string, number>();
  for (const h of discardHistory) {
    if (h.category !== '식품') continue;
    counts.set(h.name, (counts.get(h.name) ?? 0) + 1);
  }
  const ranked = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .filter((x) => x.count >= 2)  // 2회+ 소진만
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (ranked.length === 0) return null;

  const ownedSet = new Set(currentItemNames);

  function handleAdd(name: string) {
    if (has(name)) {
      showToast(`"${name}" 이미 쇼핑 리스트에 있어요.`);
      return;
    }
    add(name, '자주 구매');
    showToast(`"${name}" 쇼핑 리스트에 담았어요.`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.17 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <EmojiIcon emoji="⭐" size={16} className="text-amber-400" />
        <span className="text-xs text-gray-400 font-medium">자주 구매하는 재료 TOP 5</span>
      </div>
      <div className="flex flex-col gap-1">
        {ranked.map((r, i) => {
          const owned = ownedSet.has(r.name);
          const inList = has(r.name);
          return (
            <div key={r.name} className="flex items-center gap-2 py-1">
              <span className="text-sm text-gray-300 tabular-nums w-4 text-right shrink-0">{i + 1}</span>
              <EmojiIcon emoji={getFoodEmoji(r.name)} size={14} className="text-gray-600 shrink-0" />
              <span className="flex-1 text-sm text-gray-800 truncate">{r.name}</span>
              <span className="text-sm text-gray-400 font-semibold tabular-nums shrink-0">{r.count}회</span>
              {owned ? (
                <span className="text-xs text-brand-success font-medium shrink-0">✓ 보유</span>
              ) : (
                <button
                  onClick={() => handleAdd(r.name)}
                  disabled={inList}
                  className={`shrink-0 text-sm font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    inList
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'
                  }`}
                >
                  {inList ? '담김' : '+ 담기'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
