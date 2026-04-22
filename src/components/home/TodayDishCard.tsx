'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { matchRecipes, SEASON_EMOJI, type Recipe } from '@/lib/recipes';
import { currentSeasonByMonth } from '@/lib/season';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { useCookLog } from '@/lib/recipeCookLog';
import { useProfiles } from '@/lib/profile';
import { useToast } from '@/context/ToastContext';
import { haptic } from '@/lib/haptics';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { Widget } from './shared';

export default function TodayDishCard({ items }: { items: CartItem[] }) {
  const foods = items.filter(isFoodItem);
  const season = currentSeasonByMonth();
  const { cookCounts, markCooked } = useCookLog();
  const { main } = useProfiles();
  const dietary = main?.dietary !== 'none' ? main?.dietary : undefined;
  const { showToast } = useToast();
  const matched = matchRecipes(foods, 1, { currentSeason: season, cookCounts, dietary });
  const { isFavorite, toggle } = useRecipeFavorites();
  const [selected, setSelected] = useState<{ recipe: Recipe; matchedItems: string[] } | null>(null);

  if (matched.length === 0) return null;
  const { recipe, matchedItems, urgentBoosted, seasonBoosted, loveBoosted, cookCount } = matched[0];

  function handleQuickCook(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    markCooked(recipe.id);
    haptic('toggle');
    showToast(`"${recipe.name}" ${cookCount + 1}번째 조리 기록 완료 🍲`);
  }

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
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-warning/10 text-brand-warning font-semibold">
                      ⚠️ 임박
                    </span>
                  )}
                  {seasonBoosted && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600 font-semibold">
                      {SEASON_EMOJI[season]} {season}철
                    </span>
                  )}
                  {loveBoosted && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 font-semibold" title={`${cookCount}번 만든 단골`}>
                      🏆 단골
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-gray-900 leading-tight truncate">{recipe.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ⏱ {recipe.time} · {recipe.difficulty}
                  {matchedItems.length > 0 && (
                    <>
                      <span className="text-gray-300 mx-1">·</span>
                      <span className="text-gray-900 font-semibold">
                        ✓ {matchedItems[0]}{matchedItems.length > 1 && ` +${matchedItems.length - 1}`}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  onClick={handleQuickCook}
                  role="button"
                  aria-label="오늘 이 요리 만들었어요"
                  title="오늘 만들었어요"
                  className="text-sm font-semibold px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 transition-colors"
                >
                  ✓ 기록
                </span>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
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
