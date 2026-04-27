'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { RECIPES, recipeDietary, DIETARY_BADGE, type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { useCookLog } from '@/lib/recipeCookLog';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface FavoriteRecipesSectionProps {
  onOpenRecipe:   (recipe: Recipe) => void;
  onOpenBrowser:  () => void;
}

type SortKey = 'recent' | 'name' | 'count';

export default function FavoriteRecipesSection({ onOpenRecipe, onOpenBrowser }: FavoriteRecipesSectionProps) {
  const { favorites } = useRecipeFavorites();
  const { getEntry } = useCookLog();
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const favoriteRecipes = RECIPES
    .filter((r) => favorites.includes(r.id))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'count') {
        const ac = getEntry(a.id).count;
        const bc = getEntry(b.id).count;
        return bc - ac;
      }
      // recent: lastCooked 내림차순, 없으면 뒤로
      const aLast = getEntry(a.id).lastCooked ?? '';
      const bLast = getEntry(b.id).lastCooked ?? '';
      if (aLast !== bLast) return bLast.localeCompare(aLast);
      return a.name.localeCompare(b.name);
    });
  if (favoriteRecipes.length === 0) return null;

  const SORT_LABEL: Record<SortKey, string> = {
    recent: '🕑 최근 조리',
    count:  '🔥 많이 만든',
    name:   '🔤 가나다',
  };
  const SORT_NEXT: Record<SortKey, SortKey> = {
    recent: 'count',
    count:  'name',
    name:   'recent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.285 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-gray-400 font-medium">즐겨찾기 레시피</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-brand-warning font-semibold">♥ {favoriteRecipes.length}</span>
          <button
            onClick={() => setSortBy(SORT_NEXT[sortBy])}
            className="text-sm text-gray-500 font-medium px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
            title="정렬 전환"
          >
            {SORT_LABEL[sortBy]}
          </button>
          <button
            onClick={onOpenBrowser}
            className="text-sm text-brand-primary font-semibold px-2 py-0.5 rounded-full hover:bg-brand-primary/10 transition-colors"
          >
            전체 보기 →
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {favoriteRecipes.map((recipe) => {
          const cook = getEntry(recipe.id);
          return (
            <button
              key={recipe.id}
              onClick={() => onOpenRecipe(recipe)}
              className="flex items-center gap-3 w-full py-2 px-2 -mx-2 rounded-2xl hover:bg-gray-50 text-left transition-colors"
            >
              <EmojiIcon emoji={recipe.emoji} size={22} className="text-gray-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{recipe.name}</p>
                  {(() => {
                    const d = recipeDietary(recipe);
                    return d ? (
                      <span
                        className="text-xs shrink-0"
                        title={`${DIETARY_BADGE[d].label} 가능`}
                      >
                        <EmojiIcon emoji={DIETARY_BADGE[d].emoji} size={11} className="text-gray-500" />
                      </span>
                    ) : null;
                  })()}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">
                  ⏱ {recipe.time} · {recipe.difficulty}
                  {cook.count > 0 && (
                    <>
                      <span className="text-gray-300 mx-1">·</span>
                      <span className="text-brand-primary font-semibold">{cook.count}회 조리</span>
                    </>
                  )}
                </p>
              </div>
              <ChevronRight size={14} className="text-gray-300 shrink-0" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
