// ────────────────────────────────────────────────
// 공통 유니온 타입
// ────────────────────────────────────────────────
export type StorageType = '냉장' | '냉동' | '실온';
export type Thickness   = '얇음' | '보통' | '두꺼움';
export type WeatherTag  = '봄' | '여름' | '가을' | '겨울' | '우천' | '맑음';

// ────────────────────────────────────────────────
// A. 식품 (Food)
// ────────────────────────────────────────────────

/** 추후 스마트 냉장고 Phase 2 — AI 영양소 분석용 */
export interface NutritionFacts {
  calories?: number; // kcal
  protein?:  number; // g
  fat?:      number; // g
  carbs?:    number; // g
}

export interface FoodItem {
  id:                string;
  name:              string;
  category:          '식품';
  storageType:       StorageType;
  baseShelfLifeDays: number;   // 기본 보관 가능 일수
  purchaseDate:      string;   // ISO 8601 (YYYY-MM-DD)

  // ── 확장 예약 필드 (스마트 냉장고 Phase 2) ──
  nutritionFacts?: NutritionFacts;
  openedDate?:     string; // 개봉일 — 개봉 후 유통기한 재산정용
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
