import type { FoodItem, FoodCategory } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';

/** 성인 기준 1일 평균 섭취 권장량(weekly로 환산) — 단위: g 또는 kcal */
export const WEEKLY_TARGET = {
  calories: 2000 * 7,  // 14,000 kcal
  protein:  65   * 7,  //    455 g
  carbs:    300  * 7,  //  2,100 g
  fat:      60   * 7,  //    420 g
} as const;

/** 카테고리별 100g 기준 대표 영양소 (nutritionFacts 누락 시 사용) */
const CATEGORY_AVG: Record<FoodCategory, { calories: number; protein: number; fat: number; carbs: number }> = {
  '채소·과일':   { calories:  30, protein:  1.5, fat:  0.3, carbs:  6.0 },
  '정육·계란':   { calories: 190, protein: 20.0, fat: 11.0, carbs:  1.0 },
  '수산·해산':   { calories: 150, protein: 22.0, fat:  7.0, carbs:  0.2 },
  '유제품':      { calories:  80, protein:  5.5, fat:  4.0, carbs:  5.0 },
  '음료':        { calories:  50, protein:  0.5, fat:  0.1, carbs: 12.0 },
  '간식·과자':   { calories: 480, protein:  6.0, fat: 24.0, carbs: 58.0 },
  '양념·소스':   { calories: 120, protein:  2.0, fat:  6.0, carbs: 14.0 },
  '면·즉석':     { calories: 450, protein: 10.0, fat: 18.0, carbs: 62.0 },
  '빵·베이커리': { calories: 290, protein:  9.0, fat:  9.0, carbs: 45.0 },
  '건강식품':    { calories: 350, protein: 15.0, fat: 10.0, carbs: 55.0 },
  '기타 식품':   { calories: 200, protein:  6.0, fat:  7.0, carbs: 28.0 },
};

/** 단일 아이템의 영양소 합계 추정. 값이 있으면 그대로, 없으면 카테고리 대표치 사용. */
function itemNutrients(food: FoodItem): { calories: number; protein: number; fat: number; carbs: number } {
  const nf = food.nutritionFacts;
  if (nf && typeof nf.calories === 'number') {
    return {
      calories: nf.calories ?? 0,
      protein:  nf.protein  ?? 0,
      fat:      nf.fat      ?? 0,
      carbs:    nf.carbs    ?? 0,
    };
  }
  return CATEGORY_AVG[food.foodCategory] ?? CATEGORY_AVG['기타 식품'];
}

export interface NutritionBalance {
  totals:   { calories: number; protein: number; fat: number; carbs: number };
  coverage: { calories: number; protein: number; fat: number; carbs: number }; // 0~1.2 사이 실수 (120%까지 표시)
  vegFruitCount:  number;
  proteinCount:   number;
  advice:   string;
}

/**
 * 현재 보유 식품(만료 제외)으로 주간 영양 밸런스 추정.
 * - 각 아이템을 1인분으로 간주하고 단순 합산
 * - 주간 권장량 대비 coverage(%) 계산
 * - 1줄 네모아 조언 (가장 부족하거나 과한 항목 기반)
 */
export function analyzeBalance(foods: FoodItem[]): NutritionBalance {
  const active = foods.filter((f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) >= 0);

  const totals = active.reduce(
    (acc, f) => {
      const n = itemNutrients(f);
      acc.calories += n.calories;
      acc.protein  += n.protein;
      acc.fat      += n.fat;
      acc.carbs    += n.carbs;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

  const cap = (v: number) => Math.min(1.2, v);
  const coverage = {
    calories: cap(totals.calories / WEEKLY_TARGET.calories),
    protein:  cap(totals.protein  / WEEKLY_TARGET.protein),
    fat:      cap(totals.fat      / WEEKLY_TARGET.fat),
    carbs:    cap(totals.carbs    / WEEKLY_TARGET.carbs),
  };

  const vegFruitCount = active.filter((f) => f.foodCategory === '채소·과일').length;
  const proteinCount  = active.filter((f) =>
    f.foodCategory === '정육·계란' || f.foodCategory === '수산·해산',
  ).length;

  return { totals, coverage, vegFruitCount, proteinCount, advice: buildAdvice(coverage, vegFruitCount, proteinCount) };
}

function buildAdvice(
  cov: NutritionBalance['coverage'],
  veg: number,
  prot: number,
): string {
  // 심한 부족(< 30%)부터 우선 조언
  if (cov.protein < 0.3 && prot < 2) return '단백질이 부족해 보여요. 두부·달걀·닭가슴살은 어떨까요?';
  if (veg < 2)                       return '채소·과일이 부족해요. 네모아가 샐러드 재료를 추천해 드릴게요.';
  if (cov.calories < 0.3)            return '전체 식재료가 부족해요. 장을 볼 시간이 됐어요.';
  if (cov.fat > 1.0)                 return '지방이 조금 많아요. 다음엔 채소 위주로 담아볼까요?';
  if (cov.carbs > 1.0)               return '탄수화물 비율이 높아요. 단백질 식품을 한 팩 추가해보세요.';
  if (cov.protein >= 0.7 && veg >= 3) return '영양 밸런스가 좋아요. 이대로 한 주를 보내보세요.';
  return '네모아가 이번 주 식탁을 함께 준비할게요.';
}
