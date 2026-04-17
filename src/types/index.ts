// ────────────────────────────────────────────────
// 공통 유니온 타입
// ────────────────────────────────────────────────
export type StorageType = '냉장' | '냉동' | '실온';
export type Thickness   = '얇음' | '보통' | '두꺼움';
export type WeatherTag  = '봄' | '여름' | '가을' | '겨울' | '우천' | '맑음';

// ────────────────────────────────────────────────
// A. 식품 (Food)
// ────────────────────────────────────────────────

/** 세분화된 식품 카테고리 */
export type FoodCategory =
  | '채소·과일' | '정육·계란' | '수산·해산'
  | '유제품' | '음료' | '간식·과자'
  | '양념·소스' | '면·즉석' | '빵·베이커리'
  | '건강식품' | '기타 식품';

/** 식품 카테고리 그룹 (통계용) */
export type FoodGroup = '신선식품' | '가공식품' | '음료·간식' | '기타';

export const FOOD_GROUP: Record<FoodCategory, FoodGroup> = {
  '채소·과일':   '신선식품',
  '정육·계란':   '신선식품',
  '수산·해산':   '신선식품',
  '유제품':      '신선식품',
  '음료':        '음료·간식',
  '간식·과자':   '음료·간식',
  '양념·소스':   '가공식품',
  '면·즉석':     '가공식품',
  '빵·베이커리': '가공식품',
  '건강식품':    '기타',
  '기타 식품':   '기타',
};

export const FOOD_EMOJI: Record<FoodCategory, string> = {
  '채소·과일': '🥬', '정육·계란': '🥩', '수산·해산': '🐟',
  '유제품': '🥛', '음료': '🧃', '간식·과자': '🍪',
  '양념·소스': '🧂', '면·즉석': '🍜', '빵·베이커리': '🍞',
  '건강식품': '💊', '기타 식품': '📦',
};

/** AI 영양소 분석용 */
export interface NutritionFacts {
  calories?: number;
  protein?:  number;
  fat?:      number;
  carbs?:    number;
}

export interface FoodItem {
  id:                string;
  name:              string;
  category:          '식품';
  foodCategory:      FoodCategory;
  storageType:       StorageType;
  baseShelfLifeDays: number;
  purchaseDate:      string;

  nutritionFacts?: NutritionFacts;
  openedDate?:     string;
}

// ────────────────────────────────────────────────
// B. 패션 / 의류 (Clothing)
// ────────────────────────────────────────────────

/** 세분화된 패션 카테고리 */
export type FashionCategory =
  | '상의' | '하의' | '아우터' | '원피스'  // 의류
  | '신발'                                // 슈즈
  | '가방'                                // 백
  | '모자' | '스카프' | '안경' | '선글라스' | '시계' | '주얼리' | '기타 액세서리'; // 액세서리

/** 카테고리 그룹 (GNB 배지, 통계 등에서 사용) */
export type FashionGroup = '의류' | '신발' | '가방' | '액세서리';

export const FASHION_GROUP: Record<FashionCategory, FashionGroup> = {
  상의:        '의류',
  하의:        '의류',
  아우터:      '의류',
  원피스:      '의류',
  신발:        '신발',
  가방:        '가방',
  모자:        '액세서리',
  스카프:      '액세서리',
  안경:        '액세서리',
  선글라스:    '액세서리',
  시계:        '액세서리',
  주얼리:      '액세서리',
  '기타 액세서리': '액세서리',
};

export const FASHION_EMOJI: Record<FashionCategory, string> = {
  상의: '👕', 하의: '👖', 아우터: '🧥', 원피스: '👗',
  신발: '👟', 가방: '👜',
  모자: '🧢', 스카프: '🧣', 안경: '👓', 선글라스: '🕶️',
  시계: '⌚', 주얼리: '💍', '기타 액세서리': '✨',
};

export interface ClothingItem {
  id:            string;
  name:          string;
  category:      FashionCategory;
  size:          string;
  thickness:     Thickness;
  material:      string;

  weatherTags?:  WeatherTag[];
  colorFamily?:  string;
}

// ────────────────────────────────────────────────
// C. 패션 Vision 확장 타입 (Phase 3.5)
// ────────────────────────────────────────────────

/** 착용감 관련 물성 정보 — vision-parser가 이미지에서 추출 */
export interface FashionAttributes {
  sheerness?: boolean;  // 비침 여부
  stretch?:   boolean;  // 신축성 여부
  lining?:    boolean;  // 안감 여부
}

/** 실측 치수 — 제품 상세 이미지에서 추출 (cm 단위) */
export interface FashionMeasurements {
  chest?:        number;   // 가슴둘레
  totalLength?:  number;   // 총장
  waist?:        number;   // 허리
  waistBanding?: boolean;  // 밴딩 여부
}

/**
 * EnrichedClothingItem — Vision 분석으로 추가 정보를 획득한 의류 아이템
 * ClothingItem을 extends하므로 isClothingItem() 타입가드가 그대로 통과됨
 */
export interface EnrichedClothingItem extends ClothingItem {
  attributes?:   FashionAttributes;
  measurements?: FashionMeasurements;
  washingTip?:   string;
}

// ────────────────────────────────────────────────
// 유니온 타입 — 리스트 렌더링용
// ────────────────────────────────────────────────
export type CartItem = FoodItem | EnrichedClothingItem;

// 타입 가드
export const isFoodItem     = (item: CartItem): item is FoodItem     => item.category === '식품';
export const isClothingItem = (item: CartItem): item is ClothingItem => item.category !== '식품';

// Phase 3.5 신규: Vision 분석으로 추출된 풍부한 패션 데이터 여부 확인
export const isEnrichedClothingItem = (item: CartItem): item is EnrichedClothingItem =>
  isClothingItem(item) &&
  ('attributes' in item || 'measurements' in item || 'washingTip' in item);
