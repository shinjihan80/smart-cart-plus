'use client';

import { motion } from 'framer-motion';
import type { FoodItem } from '@/types';
import { analyzeBalance, WEEKLY_TARGET } from '@/lib/nutritionAnalysis';
import { springTransition, CARD, CARD_SHADOW } from './shared';

function coverageTone(cov: number): string {
  if (cov < 0.3)  return 'bg-brand-warning';
  if (cov > 1.0)  return 'bg-amber-400';
  if (cov >= 0.7) return 'bg-brand-success';
  return 'bg-brand-primary';
}

export default function NutritionBalanceSection({ foods }: { foods: FoodItem[] }) {
  if (foods.length === 0) return null;
  const balance = analyzeBalance(foods);

  const bars = [
    { label: '칼로리', key: 'calories' as const, unit: 'kcal', target: WEEKLY_TARGET.calories },
    { label: '단백질', key: 'protein'  as const, unit: 'g',   target: WEEKLY_TARGET.protein  },
    { label: '탄수화물', key: 'carbs'  as const, unit: 'g',   target: WEEKLY_TARGET.carbs    },
    { label: '지방',   key: 'fat'      as const, unit: 'g',   target: WEEKLY_TARGET.fat      },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.13 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span className="text-xs text-gray-400 font-medium">이번 주 영양 밸런스</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>🥬 {balance.vegFruitCount}</span>
          <span className="text-gray-200">·</span>
          <span>🥩 {balance.proteinCount}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mb-3">
        {bars.map((b) => {
          const cov = balance.coverage[b.key];
          const pct = Math.round(cov * 100);
          const value = Math.round(balance.totals[b.key]);
          return (
            <div key={b.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{b.label}</span>
                <span className="text-sm text-gray-400 tabular-nums">
                  {value.toLocaleString()} / {b.target.toLocaleString()} {b.unit} · {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, cov * 100)}%` }}
                  transition={{ ...springTransition, delay: 0.25 }}
                  className={`h-full rounded-full ${coverageTone(cov)}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-brand-primary/5 border border-brand-primary/10 px-3 py-2">
        <p className="text-xs text-gray-700 leading-relaxed">
          <span className="font-semibold text-brand-primary">네모아</span> · {balance.advice}
        </p>
        {(() => {
          const needProtein = balance.coverage.protein < 0.4 && balance.proteinCount < 3;
          const needVeg     = balance.vegFruitCount < 3;
          if (!needProtein && !needVeg) return null;
          const hint = needProtein ? 'protein' : 'veg';
          const label = needProtein ? '🥩 단백질 레시피 보기' : '🥬 채소 레시피 보기';
          return (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('nemoa:open-palette', { detail: { query: hint === 'protein' ? '두부' : '샐러드' } }))}
              className="mt-1.5 text-sm font-semibold text-brand-primary hover:underline"
            >
              {label} →
            </button>
          );
        })()}
      </div>
    </motion.div>
  );
}
