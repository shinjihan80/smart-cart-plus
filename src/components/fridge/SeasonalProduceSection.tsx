'use client';

import { motion } from 'framer-motion';
import { currentSeasonByMonth } from '@/lib/season';
import { currentSeasonalProduce, type SeasonalProduce } from '@/lib/seasonalProduce';
import { countRecipesByIngredient } from '@/lib/recipes';
import { SEASON_ICON, SEASON_COLOR } from '@/lib/iconMap';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface SeasonalProduceSectionProps {
  currentNames: string[];
  onQuickAdd:   (produce: SeasonalProduce) => void;
}

export default function SeasonalProduceSection({ currentNames, onQuickAdd }: SeasonalProduceSectionProps) {
  const season = currentSeasonByMonth();

  const suggestions = currentSeasonalProduce(season, 10)
    .filter((p) => !currentNames.some((n) => n === p.name || n.includes(p.name)))
    .slice(0, 6);

  if (suggestions.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.12 }}
        className={CARD}
        style={CARD_SHADOW}
      >
        <div className="flex items-center gap-2 mb-2.5">
          {(() => {
            const Icon = SEASON_ICON[season];
            const color = SEASON_COLOR[season];
            return <Icon size={16} strokeWidth={2} className={color.text} />;
          })()}
          <span className="text-xs text-gray-400 font-medium">지금 {season}철 재료</span>
          <span className="text-xs text-gray-300">· 가장 맛있을 때</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {suggestions.map((p) => {
            const recipeCount = countRecipesByIngredient(p.name);
            return (
              <div
                key={p.name}
                className="flex items-center rounded-2xl bg-brand-primary/5 border border-brand-primary/15 overflow-hidden"
              >
                <button
                  onClick={() => onQuickAdd(p)}
                  title={p.blurb}
                  className="flex items-center gap-1 text-xs pl-1.5 pr-2 py-1 text-brand-primary hover:bg-brand-primary/10 active:scale-95 transition-all"
                >
                  <span className="text-sm">{p.emoji}</span>
                  <span className="font-medium">{p.name}</span>
                  {p.peak === season && (
                    <span className="text-xs px-1 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary/80">피크</span>
                  )}
                </button>
                {recipeCount > 0 && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('nemoa:open-palette', { detail: { query: p.name } }))}
                    title={`${p.name}(으)로 만드는 요리 보기`}
                    className="text-sm px-2 py-1 border-l border-brand-primary/15 text-brand-primary/80 hover:bg-brand-primary/10 transition-colors"
                  >
                    📖 {recipeCount}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
