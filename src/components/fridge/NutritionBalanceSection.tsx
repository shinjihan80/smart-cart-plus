'use client';

import { motion } from 'framer-motion';
import type { FoodItem } from '@/types';
import type { DiscardRecord } from '@/context/CartContext';
import { analyzeBalance, WEEKLY_TARGET } from '@/lib/nutritionAnalysis';
import { useProfiles, resolveDailyCalorieTarget, calcTDEE } from '@/lib/profile';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from './shared';

/**
 * 최소 데이터 게이팅 — 재고가 몇 개뿐이거나 소진 기록이 없는 계정에도
 * "이번 주 단백질이 부족해 보여요" 같은 단정적 조언을 보여줬다(n=1
 * 개인화, 전문단 E1 발견). 식품 5개↑ AND 소진 기록 3건↑일 때만 노출.
 */
const MIN_FOODS_FOR_INSIGHT   = 5;
const MIN_DISCARDS_FOR_INSIGHT = 3;

/** 활성 재고 중 실측 영양정보가 없어 카테고리 평균으로 추정한 비율이
 * 이 이상이면 숫자 대신 안내문구만 보여준다 — 9/20개가 추정치인데
 * "3,539kcal"처럼 1자리까지 정밀 표기해 근거 없는 정확성을 연출하던
 * 문제(P0-59, 전문단 E1 발견). */
const HIGH_ESTIMATE_RATIO = 0.3;

function round(v: number, step: number): number {
  return Math.round(v / step) * step;
}

export default function NutritionBalanceSection({ foods, discardHistory }: { foods: FoodItem[]; discardHistory: readonly DiscardRecord[] }) {
  const { main } = useProfiles();
  if (foods.length < MIN_FOODS_FOR_INSIGHT || discardHistory.length < MIN_DISCARDS_FOR_INSIGHT) return null;

  const balance = analyzeBalance(foods);
  if (balance.activeCount === 0) return null;

  // 개인화 목표는 조언 문장(advice)에만 내부적으로 반영 — 절대 숫자·퍼센트로
  // 화면에 노출하지 않는다("이번 주 영양 밸런스"라는 섭취 프레이밍 자체가
  // 재고=섭취로 오독됐다, 전문단 E1 발견). 화면에는 "냉장고에 있는 것"
  // 구성만 보여준다.
  const dailyCalorieTarget = resolveDailyCalorieTarget(main?.body ?? {});
  const tdee = calcTDEE(main?.body ?? {});
  const weeklyTarget = tdee !== null
    ? { calories: dailyCalorieTarget * 7, protein: Math.round((dailyCalorieTarget * 0.20) / 4) * 7, carbs: Math.round((dailyCalorieTarget * 0.50) / 4) * 7, fat: Math.round((dailyCalorieTarget * 0.30) / 9) * 7 }
    : WEEKLY_TARGET;
  const coverage = {
    calories: balance.totals.calories / weeklyTarget.calories,
    protein:  balance.totals.protein  / weeklyTarget.protein,
  };

  const estimateRatio = balance.estimatedCount / balance.activeCount;
  const highEstimate = estimateRatio >= HIGH_ESTIMATE_RATIO;

  return (
    <>
      <div className="flex items-center gap-2">
        <EmojiIcon emoji="📊" size={16} className="text-gray-700" />
        <span className="text-base font-bold text-gray-900 tracking-tight">냉장고 영양 구성</span>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
          <span>🥬 {balance.vegFruitCount}</span>
          <span className="text-gray-200">·</span>
          <span>🥩 {balance.proteinCount}</span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.13 }}
        className={CARD}
        style={CARD_SHADOW}
      >
        {highEstimate ? (
          <p className="text-xs text-gray-500 leading-relaxed">
            영양 정보가 등록된 재료가 적어({balance.activeCount - balance.estimatedCount}/{balance.activeCount}개) 정확한 구성을 보여드리기 어려워요.
            사진으로 등록하면 영양 정보가 자동으로 채워져요.
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-500 leading-relaxed mb-2">
              지금 냉장고에 있는 재료로 대략 계산한 값이에요 — 실제로 먹은 양이 아니라 <strong className="text-gray-700 font-semibold">보유량 기준 추정치</strong>예요.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 tabular-nums mb-1">
              <span>🔥 약 {round(balance.totals.calories, 50).toLocaleString()}kcal</span>
              <span>단백질 약 {round(balance.totals.protein, 5)}g</span>
              <span>탄수 약 {round(balance.totals.carbs, 5)}g</span>
              <span>지방 약 {round(balance.totals.fat, 5)}g</span>
            </div>
            {balance.estimatedCount > 0 && (
              <p className="text-[11px] text-gray-400">{balance.estimatedCount}개 항목은 실측 정보가 없어 카테고리 평균으로 추정했어요.</p>
            )}
          </>
        )}

        {!highEstimate && (
          <div className="mt-3 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 px-3 py-2">
            <p className="text-xs text-gray-700 leading-relaxed">
              <span className="font-semibold text-brand-primary">네모아</span> · {balance.advice}
            </p>
            {(() => {
              const needProtein = coverage.protein < 0.4 && balance.proteinCount < 3;
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
        )}
      </motion.div>
    </>
  );
}
