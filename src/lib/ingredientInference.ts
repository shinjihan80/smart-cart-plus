import { FOOD_EMOJI, type FoodCategory, type FoodItem, type StorageType } from '@/types';
import { lookupSeasonalEmoji } from './seasonalProduce';
import { todayLocalStr } from './dateMath';

/** 키워드별 우선 매핑 (긴 단어 우선 매칭) */
const KEYWORD_MAP: Array<{ category: FoodCategory; keywords: readonly string[] }> = [
  { category: '정육·계란', keywords: ['돼지고기', '닭가슴살', '소고기', '불고기', '돼지', '닭', '달걀', '계란', '햄', '베이컨', '소시지', '미트'] },
  { category: '수산·해산', keywords: ['연어', '새우', '미역', '참치', '오징어', '고등어', '굴', '조개', '문어', '낙지', '생선'] },
  { category: '채소·과일', keywords: ['양파', '대파', '당근', '감자', '시금치', '마늘', '토마토', '오이', '브로콜리', '샐러드', '채소', '파', '상추', '딸기', '사과', '바나나', '감귤', '귤', '오렌지', '수박', '복숭아', '아보카도', '베리', '과일', '호박', '단호박', '버섯'] },
  { category: '유제품',    keywords: ['우유', '요거트', '치즈', '버터', '그릭'] },
  { category: '빵·베이커리', keywords: ['식빵', '빵', '바게트', '크루아상', '베이글'] },
  { category: '면·즉석',   keywords: ['라면', '파스타', '당면', '떡', '만두', '어묵', '우동', '소바', '스파게티'] },
  { category: '양념·소스', keywords: ['고추장', '간장', '고춧가루', '된장', '소금', '설탕', '후추', '참기름', '식초', '카레'] },
  { category: '음료',      keywords: ['사이다', '주스', '콜라', '탄산수', '커피'] },
  { category: '간식·과자', keywords: ['과자', '초콜릿', '쿠키', '시리얼'] },
  { category: '건강식품',  keywords: ['그래놀라', '오트밀', '견과', '아몬드', '호두'] },
];

/** 이름(또는 키워드)으로부터 적절한 FoodCategory를 추론. 매칭 실패 시 '기타 식품'. */
export function inferFoodCategory(name: string): FoodCategory {
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => name.includes(kw))) return entry.category;
  }
  return '기타 식품';
}

/** 긴 키워드 우선 — "닭가슴살"이 먼저 매칭되게(짧은 "닭"에 묻히지 않도록). */
const ALL_FOOD_KEYWORDS = KEYWORD_MAP.flatMap((e) => e.keywords).sort((a, b) => b.length - a.length);

/**
 * "같은 품목"으로 볼 핵심 키워드 추출 — 매칭되는 키워드가 없으면 공백만
 * 제거한 원문을 그대로 반환(기존 완전일치 동작 유지).
 */
export function canonicalFoodKeyword(name: string): string {
  for (const kw of ALL_FOOD_KEYWORDS) {
    if (name.includes(kw)) return kw;
  }
  return name.replace(/\s+/g, '');
}

/**
 * 브랜드·용량이 섞인 상품명이 완전일치가 아니라서 "우유 보유 중"인데도
 * "서울우유 1L 재구매"를 계속 추천하던 문제(P1-93, C4 실측 — 쿠팡 주문명이
 * 매번 달라 실사용에서 거의 항상 재현). 품목 정규 사전(canonicalName)
 * 전면 도입 전까지, 이미 있는 카테고리 추론 키워드를 재사용해 "같은 핵심
 * 키워드를 포함하는가"로 근사 비교한다.
 */
export function sameFoodProduct(a: string, b: string): boolean {
  if (a === b) return true;
  return canonicalFoodKeyword(a) === canonicalFoodKeyword(b);
}

/**
 * 이름 기반 통일 이모지 — 제철 구체 이모지(🍓) 우선, 없으면 카테고리 이모지(🥬).
 * 쇼핑 리스트/장볼 거 추천/재구매 등에서 일관되게 쓰려면 이 헬퍼 호출.
 */
export function getFoodEmoji(name: string, category?: FoodCategory): string {
  return (
    lookupSeasonalEmoji(name)
    ?? FOOD_EMOJI[category ?? inferFoodCategory(name)]
    ?? '📦'
  );
}

/** 카테고리별 합리적 기본 보관 방식과 기한 */
export function inferFoodDefaults(category: FoodCategory): { storageType: StorageType; baseShelfLifeDays: number } {
  switch (category) {
    case '정육·계란':   return { storageType: '냉장', baseShelfLifeDays: 5 };
    case '수산·해산':   return { storageType: '냉장', baseShelfLifeDays: 3 };
    case '채소·과일':   return { storageType: '냉장', baseShelfLifeDays: 7 };
    case '유제품':      return { storageType: '냉장', baseShelfLifeDays: 10 };
    case '빵·베이커리': return { storageType: '냉장', baseShelfLifeDays: 5 };
    case '음료':        return { storageType: '냉장', baseShelfLifeDays: 14 };
    case '면·즉석':     return { storageType: '실온', baseShelfLifeDays: 90 };
    case '양념·소스':   return { storageType: '실온', baseShelfLifeDays: 180 };
    case '간식·과자':   return { storageType: '실온', baseShelfLifeDays: 60 };
    case '건강식품':    return { storageType: '실온', baseShelfLifeDays: 90 };
    default:            return { storageType: '실온', baseShelfLifeDays: 30 };
  }
}

/** 이름 하나로 FoodItem 생성 — 오늘 구매 가정, 스키마 v2 안전. */
export function createFoodItemFromIngredient(name: string): FoodItem {
  const foodCategory = inferFoodCategory(name);
  const { storageType, baseShelfLifeDays } = inferFoodDefaults(foodCategory);
  return {
    id:           `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    category:     '식품',
    foodCategory,
    storageType,
    baseShelfLifeDays,
    purchaseDate: todayLocalStr(),
  };
}
