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
export interface ClothingItem {
  id:        string;
  name:      string;
  category:  '의류' | '액세서리';
  size:      string;      // 'S' | 'M' | 'L' | 'Free' | '52' 등 자유형
  thickness: Thickness;
  material:  string;      // 예: '리넨', '면', '기모', '로즈골드'

  // ── 확장 예약 필드 (날씨 기반 스타일링 Phase 2) ──
  weatherTags?:  WeatherTag[]; // 날씨 API 연동 코디 추천용
  colorFamily?:  string;       // 예: '파스텔', '어스톤', '비비드'
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
export const isClothingItem = (item: CartItem): item is ClothingItem => item.category === '의류' || item.category === '액세서리';

// Phase 3.5 신규: Vision 분석으로 추출된 풍부한 패션 데이터 여부 확인
export const isEnrichedClothingItem = (item: CartItem): item is EnrichedClothingItem =>
  isClothingItem(item) &&
  ('attributes' in item || 'measurements' in item || 'washingTip' in item);
