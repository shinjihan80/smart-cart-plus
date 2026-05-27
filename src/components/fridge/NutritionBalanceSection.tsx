'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { FoodItem } from '@/types';
import { analyzeBalance, WEEKLY_TARGET } from '@/lib/nutritionAnalysis';
import { useProfiles, resolveDailyCalorieTarget, calcTDEE } from '@/lib/profile';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from './shared';

function coverageTone(cov: number): string {
  if (cov < 0.3)  return 'bg-brand-warning';
  if (cov > 1.0)  return 'bg-amber-400';
  if (cov >= 0.7) return 'bg-brand-success';
  return 'bg-brand-primary';
}

export default function NutritionBalanceSection({ foods }: { foods: FoodItem[] }) {
  const { main } = useProfiles();
  if (foods.length === 0) return null;
  const balance = analyzeBalance(foods);

  // 사용자 칼로리 목표 — TDEE 자동 계산 또는 평균 폴백
  const dailyCalorieTarget = resolveDailyCalorieTarget(main?.body ?? {});
  const tdee = calcTDEE(main?.body ?? {});
  const hasPersonalized = tdee !== null;

  // 단백질·탄수·지방 권장량은 칼로리 목표에 비례 (탄단지 균형 50/20/30)
  const dailyProtein = Math.round((dailyCalorieTarget * 0.20) / 4);  // 단백질 1g = 4kcal
  const dailyCarbs   = Math.round((dailyCalorieTarget * 0.50) / 4);  // 탄수 1g = 4kcal
  const dailyFat     = Math.round((dailyCalorieTarget * 0.30) / 9);  // 지방 1g = 9kcal

  // 주간 환산 (× 7)
  const weeklyTarget = hasPersonalized
    ? { calories: dailyCalorieTarget * 7, protein: dailyProtein * 7, carbs: dailyCarbs * 7, fat: dailyFat * 7 }
    : WEEKLY_TARGET; // 사용자 정보 없으면 기본 평균값

  // 사용자 목표 기반 coverage 재계산
  const coverage = {
    calories: balance.totals.calories / weeklyTarget.calories,
    protein:  balance.totals.protein  / weeklyTarget.protein,
    carbs:    balance.totals.carbs    / weeklyTarget.carbs,
    fat:      balance.totals.fat      / weeklyTarget.fat,
  };

  const bars = [
    { label: '칼로리', key: 'calories' as const, unit: 'kcal', target: weeklyTarget.calories },
    { label: '단백질', key: 'protein'  as const, unit: 'g',   target: weeklyTarget.protein  },
    { label: '탄수화물', key: 'carbs'  as const, unit: 'g',   target: weeklyTarget.carbs    },
    { label: '지방',   key: 'fat'      as const, unit: 'g',   target: weeklyTarget.fat      },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.13 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-3">
          <EmojiIcon emoji="📊" size={16} className="text-gray-700" />
          <span className="text-sm font-bold text-gray-700">이번 주 영양 밸런스</span>
          <div className="flex-1 h-px bg-gray-100" />
          <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
          <span>🥬 {balance.vegFruitCount}</span>
          <span className="text-gray-200">·</span>
          <span>🥩 {balance.proteinCount}</span>
        </div>
      </div>

      {!hasPersonalized && (
        <div className="mb-3 rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2">
          <p className="text-xs text-amber-700 leading-snug">
            💡 더 정확한 추천을 받으려면 <Link href="/settings#profiles" className="font-semibold underline">프로필 → 키·몸무게·나이·성별·활동량</Link>을 입력해주세요.
            현재는 일반 평균(2000 kcal/일)으로 계산 중이에요.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-3">
        {bars.map((b) => {
          const cov = coverage[b.key];
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
