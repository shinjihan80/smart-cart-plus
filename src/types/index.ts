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
// 유니온 타입 — 리스트 렌더링용
// ────────────────────────────────────────────────
export type CartItem = FoodItem | ClothingItem;

// 타입 가드
export const isFoodItem     = (item: CartItem): item is FoodItem     => item.category === '식품';
export const isClothingItem = (item: CartItem): item is ClothingItem => item.category === '의류' || item.category === '액세서리';
