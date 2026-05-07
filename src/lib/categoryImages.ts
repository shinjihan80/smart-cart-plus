/**
 * 카테고리별 시각 정체성 — 사용자가 사진을 업로드하지 않은 항목에
 * 카테고리에 어울리는 색·이모지를 표시한다.
 *
 * 외부 사진(Unsplash) 의존을 의도적으로 제거 — 검증되지 않은 이미지 ID로
 * 잘못된 사진(예: 청바지 자리에 신발)이 들어가는 사고를 막기 위함.
 *
 * 이 모듈은 카드/리스트가 표시할 때만 호출되며, 저장 데이터(item.imageUrl)는
 * 그대로 유지된다.
 */

import type { CartItem, FashionCategory, FoodCategory } from '@/types';
import { isFoodItem } from '@/types';

// ─────────────────────────────────────────────
// 카테고리별 톤 (Tailwind 클래스)
// ─────────────────────────────────────────────

export interface CategoryTone {
  bg:    string;   // 카드 썸네일 배경
  text:  string;   // 이모지/아이콘 텍스트 색
  emoji: string;   // 표시용 이모지 (FOOD_EMOJI / FASHION_EMOJI와 동일)
}

const FOOD_TONE: Record<FoodCategory, CategoryTone> = {
  '채소·과일':   { bg: 'bg-emerald-50', text: 'text-emerald-700', emoji: '🥬' },
  '정육·계란':   { bg: 'bg-rose-50',    text: 'text-rose-700',    emoji: '🥩' },
  '수산·해산':   { bg: 'bg-sky-50',     text: 'text-sky-700',     emoji: '🐟' },
  '유제품':      { bg: 'bg-amber-50',   text: 'text-amber-700',   emoji: '🥛' },
  '음료':        { bg: 'bg-orange-50',  text: 'text-orange-700',  emoji: '🧃' },
  '간식·과자':   { bg: 'bg-yellow-50',  text: 'text-yellow-700',  emoji: '🍪' },
  '양념·소스':   { bg: 'bg-stone-100',  text: 'text-stone-700',   emoji: '🧂' },
  '면·즉석':     { bg: 'bg-amber-100',  text: 'text-amber-800',   emoji: '🍜' },
  '빵·베이커리': { bg: 'bg-orange-100', text: 'text-orange-800',  emoji: '🍞' },
  '건강식품':    { bg: 'bg-violet-50',  text: 'text-violet-700',  emoji: '💊' },
  '기타 식품':   { bg: 'bg-gray-100',   text: 'text-gray-600',    emoji: '📦' },
};

const FASHION_TONE: Record<FashionCategory, CategoryTone> = {
  '상의':         { bg: 'bg-sky-50',     text: 'text-sky-700',     emoji: '👕' },
  '하의':         { bg: 'bg-indigo-50',  text: 'text-indigo-700',  emoji: '👖' },
  '아우터':       { bg: 'bg-stone-100',  text: 'text-stone-700',   emoji: '🧥' },
  '원피스':       { bg: 'bg-rose-50',    text: 'text-rose-700',    emoji: '👗' },
  '신발':         { bg: 'bg-amber-50',   text: 'text-amber-800',   emoji: '👟' },
  '가방':         { bg: 'bg-orange-50',  text: 'text-orange-700',  emoji: '👜' },
  '모자':         { bg: 'bg-cyan-50',    text: 'text-cyan-700',    emoji: '🧢' },
  '스카프':       { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', emoji: '🧣' },
  '안경':         { bg: 'bg-slate-100',  text: 'text-slate-700',   emoji: '👓' },
  '선글라스':     { bg: 'bg-zinc-100',   text: 'text-zinc-800',    emoji: '🕶️' },
  '시계':         { bg: 'bg-gray-100',   text: 'text-gray-700',    emoji: '⌚' },
  '주얼리':       { bg: 'bg-pink-50',    text: 'text-pink-700',    emoji: '💍' },
  '기타 액세서리': { bg: 'bg-violet-50',  text: 'text-violet-700',  emoji: '✨' },
};

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────

export function getFoodCategoryTone(category: FoodCategory): CategoryTone {
  return FOOD_TONE[category] ?? FOOD_TONE['기타 식품'];
}

export function getFashionCategoryTone(category: FashionCategory): CategoryTone {
  return FASHION_TONE[category] ?? FASHION_TONE['기타 액세서리'];
}

/**
 * 표시용 톤 — 사용자 업로드 imageUrl과 무관하게 카테고리 톤만 반환.
 * 카드는 imageUrl이 있으면 사진을, 없으면 이 톤 + emoji를 사용.
 */
export function getCategoryTone(item: CartItem): CategoryTone {
  if (isFoodItem(item)) return getFoodCategoryTone(item.foodCategory);
  return getFashionCategoryTone(item.category);
}
