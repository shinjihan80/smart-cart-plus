'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { FoodItem } from '@/types';
import { matchRecipes, type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import RecipeBrowserModal from '@/components/RecipeBrowserModal';
import { springTransition, CARD, CARD_SHADOW } from './shared';

export default function RecipeSection({ foods }: { foods: FoodItem[] }) {
  const rawMatched = matchRecipes(foods, 12);
  const { isFavorite, toggle } = useRecipeFavorites();
  const [selected, setSelected] = useState<{ recipe: Recipe; matchedItems: string[] } | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);

  // 즐겨찾기를 최상단으로 안정 정렬
  const matched = [...rawMatched].sort((a, b) => {
    const aFav = isFavorite(a.recipe.id) ? 0 : 1;
    const bFav = isFavorite(b.recipe.id) ? 0 : 1;
    return aFav - bFav;
  }).slice(0, 8);

  if (matched.length === 0) return null;

  const urgentCount = matched.filter((m) => m.urgentBoosted).length;
  const favoriteCount = matched.filter((m) => isFavorite(m.recipe.id)).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.15 }}
        className={CARD}
        style={CARD_SHADOW}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">👨‍🍳</span>
            <span className="text-xs text-gray-400 font-medium">네모아가 추천하는 오늘의 메뉴</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {favoriteCount > 0 && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-warning/10 text-brand-warning">
                ♥ {favoriteCount}
              </span>
            )}
            {urgentCount > 0 && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-warning/10 text-brand-warning">
                ⚠️ 소비 임박 {urgentCount}
              </span>
            )}
            <button
              onClick={() => setBrowserOpen(true)}
              className="text-[10px] text-brand-primary font-semibold px-2 py-0.5 rounded-full hover:bg-brand-primary/10 transition-colors whitespace-nowrap"
            >
              전체 보기 →
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {matched.map(({ recipe, matchedItems, urgentBoosted }) => {
            const fav = isFavorite(recipe.id);
            return (
              <button
                key={recipe.id}
                onClick={() => setSelected({ recipe, matchedItems })}
                className={`shrink-0 rounded-2xl px-3.5 py-2.5 min-w-[140px] max-w-[160px] text-left hover:scale-[1.02] active:scale-[0.98] transition-transform ${
                  urgentBoosted
                    ? 'bg-brand-warning/5 border border-brand-warning/20'
                    : 'bg-brand-primary/5 border border-brand-primary/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{recipe.emoji}</span>
                  <div className="flex items-center gap-0.5">
                    {fav && <span className="text-[10px] text-brand-warning">♥</span>}
                    {urgentBoosted && <span className="text-[9px]">⚠️</span>}
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-800 mt-1.5 truncate">{recipe.name}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  ⏱ {recipe.time} · {recipe.difficulty}
                </p>
                <p className="text-[9px] text-brand-primary truncate mt-0.5" title={matchedItems.join(', ')}>
                  ✓ {matchedItems[0]}{matchedItems.length > 1 && ` +${matchedItems.length - 1}`}
                </p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {selected && (
        <RecipeDetailModal
          recipe={selected.recipe}
          matchedItems={selected.matchedItems}
          isFavorite={isFavorite(selected.recipe.id)}
          onToggleFavorite={() => toggle(selected.recipe.id)}
          onClose={() => setSelected(null)}
        />
      )}

      {browserOpen && (
        <RecipeBrowserModal
          onSelect={(recipe) => {
            setBrowserOpen(false);
            const hit = rawMatched.find((m) => m.recipe.id === recipe.id);
            setSelected({ recipe, matchedItems: hit?.matchedItems ?? [] });
          }}
          onClose={() => setBrowserOpen(false)}
        />
      )}
    </>
  );
}
