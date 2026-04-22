'use client';

import { motion } from 'framer-motion';
import { isFoodItem, type CartItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useShoppingList } from '@/lib/shoppingList';
import { currentSeasonByMonth } from '@/lib/season';
import { currentSeasonalProduce } from '@/lib/seasonalProduce';
import { SEASON_EMOJI, countRecipesByIngredient } from '@/lib/recipes';
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
      <span className="text-[11px] text-gray-400 font-medium shrink-0">
        {SEASON_EMOJI[season]} 지금 제철
      </span>
      {picks.map((p) => {
        const recipeCount = countRecipesByIngredient(p.name);
        return (
          <div key={p.name} className="shrink-0 flex items-center rounded-full bg-white border border-brand-primary/20 overflow-hidden">
            <button
              onClick={() => handleTap(p.name)}
              title={p.blurb ?? `${season}철 제철`}
              className="flex items-center gap-1 text-xs pl-1.5 pr-2 py-1 text-brand-primary hover:bg-brand-primary/5 active:scale-95 transition-all"
            >
              <span className="text-xs">{p.emoji}</span>
              <span className="font-medium">{p.name}</span>
              {p.peak === season && <span className="text-[10px] text-brand-primary/60">· 피크</span>}
            </button>
            {recipeCount > 0 && (
              <button
                onClick={() => {
                  // 재료명 그대로 팔레트에 전달 — 레시피·제철·보유 아이템 모두 노출
                  // (? prefix는 recipe 모드 필터라 예전에 결과가 일부만 보이던 버그 회피)
                  window.dispatchEvent(new CustomEvent('nemoa:open-palette', { detail: { query: p.name } }));
                }}
                title={`${p.name} 레시피 ${recipeCount}개`}
                className="text-[10px] px-1.5 py-1 border-l border-brand-primary/15 text-brand-primary/70 hover:bg-brand-primary/5 transition-colors"
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
