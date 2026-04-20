import type { FoodCategory, FoodItem, StorageType } from '@/types';

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

/** 카테고리별 합리적 기본 보관 방식과 기한 */
function defaultsFor(category: FoodCategory): { storageType: StorageType; baseShelfLifeDays: number } {
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
  const { storageType, baseShelfLifeDays } = defaultsFor(foodCategory);
  return {
    id:           `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    category:     '식품',
    foodCategory,
    storageType,
    baseShelfLifeDays,
    purchaseDate: new Date().toISOString().split('T')[0],
  };
}
