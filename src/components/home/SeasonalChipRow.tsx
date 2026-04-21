'use client';

import { motion } from 'framer-motion';
import { isFoodItem, type CartItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useShoppingList } from '@/lib/shoppingList';
import { currentSeasonByMonth } from '@/lib/season';
import { currentSeasonalProduce } from '@/lib/seasonalProduce';
import { SEASON_EMOJI, countRecipesByIngredient, RECIPES } from '@/lib/recipes';
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
      <span className="text-[10px] text-gray-400 font-medium shrink-0">
        {SEASON_EMOJI[season]} 지금 제철
      </span>
      {picks.map((p) => {
        const recipeCount = countRecipesByIngredient(p.name);
        const onlyRecipe = recipeCount === 1
          ? RECIPES.find((r) => r.keywords.some((kw) => kw.includes(p.name) || p.name.includes(kw)))
          : null;
        return (
          <div key={p.name} className="shrink-0 flex items-center rounded-full bg-white border border-brand-primary/20 overflow-hidden">
            <button
              onClick={() => handleTap(p.name)}
              title={p.blurb ?? `${season}철 제철`}
              className="flex items-center gap-1 text-[11px] pl-1.5 pr-2 py-1 text-brand-primary hover:bg-brand-primary/5 active:scale-95 transition-all"
            >
              <span className="text-xs">{p.emoji}</span>
              <span className="font-medium">{p.name}</span>
              {p.peak === season && <span className="text-[9px] text-brand-primary/60">· 피크</span>}
            </button>
            {recipeCount > 0 && (
              <button
                onClick={() => {
                  if (onlyRecipe) {
                    window.dispatchEvent(new CustomEvent('nemoa:open-recipe', { detail: { recipeId: onlyRecipe.id } }));
                  } else {
                    window.dispatchEvent(new CustomEvent('nemoa:open-palette', { detail: { query: `?${p.name}` } }));
                  }
                }}
                title={`${p.name} 레시피 ${recipeCount}개`}
                className="text-[9px] px-1.5 py-1 border-l border-brand-primary/15 text-brand-primary/70 hover:bg-brand-primary/5 transition-colors"
              >
                📖 {recipeCount}
              </button>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
