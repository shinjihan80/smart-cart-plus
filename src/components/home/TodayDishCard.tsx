'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { matchRecipes, type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { Widget } from './shared';

export default function TodayDishCard({ items }: { items: CartItem[] }) {
  const foods = items.filter(isFoodItem);
  const matched = matchRecipes(foods, 1);
  const { isFavorite, toggle } = useRecipeFavorites();
  const [selected, setSelected] = useState<{ recipe: Recipe; matchedItems: string[] } | null>(null);

  if (matched.length === 0) return null;
  const { recipe, matchedItems, urgentBoosted } = matched[0];

  return (
    <>
      <div className="col-span-2">
        <button
          onClick={() => setSelected({ recipe, matchedItems })}
          className="w-full"
        >
          <Widget index={1} className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <motion.span
                key={recipe.id}
                initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="text-5xl shrink-0"
              >
                {recipe.emoji}
              </motion.span>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs text-gray-400 font-medium">네모아의 오늘 한 그릇</p>
                  {urgentBoosted && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-warning/10 text-brand-warning font-semibold">
                      ⚠️ 임박
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-gray-900 leading-tight truncate">{recipe.name}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  ⏱ {recipe.time} · {recipe.difficulty}
                  {matchedItems.length > 0 && (
                    <>
                      <span className="text-gray-300 mx-1">·</span>
                      <span className="text-brand-primary font-semibold">
                        ✓ {matchedItems[0]}{matchedItems.length > 1 && ` +${matchedItems.length - 1}`}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </div>
          </Widget>
        </button>
      </div>

      {selected && (
        <RecipeDetailModal
          recipe={selected.recipe}
          matchedItems={selected.matchedItems}
          isFavorite={isFavorite(selected.recipe.id)}
          onToggleFavorite={() => toggle(selected.recipe.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
