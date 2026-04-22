'use client';

import { motion } from 'framer-motion';
import { Flower2, BookOpen } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useShoppingList } from '@/lib/shoppingList';
import { currentSeasonByMonth } from '@/lib/season';
import { currentSeasonalProduce } from '@/lib/seasonalProduce';
import { countRecipesByIngredient } from '@/lib/recipes';
import { springTransition } from './shared';

export default function SeasonalChipRow({ items }: { items: CartItem[] }) {
  const season = currentSeasonByMonth();
  const { showToast } = useToast();
  const { has, add } = useShoppingList();

  const haveNames = new Set(items.filter(isFoodItem).map((f) => f.name));
  const picks = currentSeasonalProduce(season, 10)
    .filter((p) => !haveNames.has(p.name))
    .slice(0, 4);

  if (picks.length === 0) return null;

  function handleTap(name: string) {
    if (has(name)) {
      showToast(`"${name}" 이미 쇼핑 리스트에 있어요.`);
      return;
    }
    add(name, '제철 추천');
    showToast(`"${name}" 쇼핑 리스트에 담았어요.`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.05 }}
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-0.5"
    >
      <span className="flex items-center gap-1 text-sm text-gray-500 font-semibold shrink-0">
        <Flower2 size={14} strokeWidth={2.2} className="text-pink-500" />
        <span>지금 제철</span>
      </span>
      {picks.map((p) => {
        const recipeCount = countRecipesByIngredient(p.name);
        return (
          <div key={p.name} className="shrink-0 flex items-center rounded-full bg-white border border-gray-200 overflow-hidden">
            <button
              onClick={() => handleTap(p.name)}
              title={p.blurb ?? `${season}철 제철`}
              className="flex items-center gap-1 text-xs pl-1.5 pr-2 py-1 text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <span className="text-xs">{p.emoji}</span>
              <span className="font-medium">{p.name}</span>
              {p.peak === season && <span className="text-xs text-pink-500 font-semibold">· 피크</span>}
            </button>
            {recipeCount > 0 && (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('nemoa:open-palette', { detail: { query: p.name } }));
                }}
                title={`${p.name} 레시피 ${recipeCount}개`}
                className="flex items-center gap-0.5 text-xs px-1.5 py-1 border-l border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <BookOpen size={11} strokeWidth={2.2} />
                <span className="tabular-nums">{recipeCount}</span>
              </button>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
