'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { FoodItem } from '@/types';
import { matchRecipes, SEASON_EMOJI, type Recipe } from '@/lib/recipes';
import { currentSeasonByMonth } from '@/lib/season';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { useCookLog } from '@/lib/recipeCookLog';
import { useProfiles } from '@/lib/profile';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { haptic } from '@/lib/haptics';
import { springTransition, CARD, CARD_SHADOW } from './shared';

export default function FeelingLuckySection({ foods }: { foods: FoodItem[] }) {
  const season = currentSeasonByMonth();
  const { cookCounts } = useCookLog();
  const { main } = useProfiles();
  const dietary = main?.dietary !== 'none' ? main?.dietary : undefined;
  const matched = matchRecipes(foods, 12, { currentSeason: season, cookCounts, dietary });
  const { isFavorite, toggle } = useRecipeFavorites();
  const [pickIndex, setPickIndex] = useState(() => Math.floor(Math.random() * Math.max(1, matched.length)));
  const [selected, setSelected]   = useState<{ recipe: Recipe; matchedItems: string[] } | null>(null);
  const [spinning, setSpinning]   = useState(false);

  if (matched.length === 0) return null;
  const pick = matched[pickIndex % matched.length];

  function handleShuffle() {
    haptic('toggle');
    setSpinning(true);
    const next = matched.length > 1
      ? (pickIndex + 1 + Math.floor(Math.random() * (matched.length - 1))) % matched.length
      : 0;
    setTimeout(() => {
      setPickIndex(next);
      setSpinning(false);
    }, 320);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.14 }}
        className={CARD}
        style={CARD_SHADOW}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎲</span>
            <span className="text-xs text-gray-400 font-medium">오늘 뭐 먹지?</span>
          </div>
          <button
            onClick={handleShuffle}
            disabled={spinning || matched.length < 2}
            className="text-[10px] text-brand-primary font-semibold px-2 py-0.5 rounded-full hover:bg-brand-primary/10 transition-colors disabled:opacity-40"
          >
            🔀 다시 고르기
          </button>
        </div>

        <button
          onClick={() => setSelected({ recipe: pick.recipe, matchedItems: pick.matchedItems })}
          className="w-full flex items-center gap-3 py-2.5 px-3 rounded-2xl bg-gradient-to-br from-brand-primary/5 to-brand-success/5 border border-brand-primary/10 hover:scale-[1.01] active:scale-[0.99] transition-transform text-left"
        >
          <motion.span
            key={pick.recipe.id}
            initial={{ rotate: -180, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="text-4xl shrink-0"
          >
            {pick.recipe.emoji}
          </motion.span>
          <div className="flex-1 min-w-0">
            <motion.p
              key={`${pick.recipe.id}-name`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05, duration: 0.2 }}
              className="text-sm font-bold text-gray-900 truncate"
            >
              {pick.recipe.name}
            </motion.p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              ⏱ {pick.recipe.time} · {pick.recipe.difficulty}
              {pick.urgentBoosted && <span className="text-brand-warning ml-1">· ⚠️ 임박 재료</span>}
              {pick.seasonBoosted && <span className="text-gray-500 ml-1">· {SEASON_EMOJI[season]} {season}철</span>}
              {pick.loveBoosted && <span className="text-rose-500 ml-1">· 🏆 {pick.cookCount}번 만든 단골</span>}
            </p>
            {pick.recipe.blurb && (
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed line-clamp-1">
                {pick.recipe.blurb}
              </p>
            )}
          </div>
          <span className="text-xs text-brand-primary shrink-0">→</span>
        </button>
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
    </>
  );
}
