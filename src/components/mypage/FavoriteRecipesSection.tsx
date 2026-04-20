'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { RECIPES, type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface FavoriteRecipesSectionProps {
  onOpenRecipe:   (recipe: Recipe) => void;
  onOpenBrowser:  () => void;
}

export default function FavoriteRecipesSection({ onOpenRecipe, onOpenBrowser }: FavoriteRecipesSectionProps) {
  const { favorites } = useRecipeFavorites();
  const favoriteRecipes = RECIPES.filter((r) => favorites.includes(r.id));
  if (favoriteRecipes.length === 0) return null;

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
          <span className="text-[10px] text-brand-warning font-semibold">♥ {favoriteRecipes.length}</span>
          <button
            onClick={onOpenBrowser}
            className="text-[10px] text-brand-primary font-semibold px-2 py-0.5 rounded-full hover:bg-brand-primary/10 transition-colors"
          >
            전체 보기 →
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {favoriteRecipes.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => onOpenRecipe(recipe)}
            className="flex items-center gap-3 w-full py-2 px-2 -mx-2 rounded-2xl hover:bg-gray-50 text-left transition-colors"
          >
            <span className="text-2xl shrink-0">{recipe.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{recipe.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                ⏱ {recipe.time} · {recipe.difficulty}
              </p>
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
