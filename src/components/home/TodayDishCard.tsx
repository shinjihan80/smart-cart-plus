'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle, Flower2, Trophy, Check } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { matchRecipes, type Recipe } from '@/lib/recipes';
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
      <button
        onClick={() => setSelected({ recipe, matchedItems })}
        className="w-full text-left"
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
                    <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-brand-warning/10 text-brand-warning font-semibold">
                      <AlertTriangle size={10} strokeWidth={2.4} />
                      <span>임박</span>
                    </span>
                  )}
                  {seasonBoosted && (
                    <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600 font-semibold">
                      <Flower2 size={10} strokeWidth={2.4} />
                      <span>{season}철</span>
                    </span>
                  )}
                  {loveBoosted && (
                    <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold" title={`${cookCount}번 만든 단골`}>
                      <Trophy size={10} strokeWidth={2.4} />
                      <span>단골</span>
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
                  className="flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 transition-colors"
                >
                  <Check size={12} strokeWidth={2.6} />
                  <span>기록</span>
                </span>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </div>
          </Widget>
        </button>

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
