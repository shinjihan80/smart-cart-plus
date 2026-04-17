import { FoodItem, ClothingItem, CartItem } from '@/types';

// ────────────────────────────────────────────────
// A. 식품 Mock Data
// ────────────────────────────────────────────────
export const foodItems: FoodItem[] = [
  {
    id:                'f1',
    name:              '친환경 샐러드 믹스',
    category:          '식품',
    storageType:       '냉장',
    baseShelfLifeDays: 5,
    purchaseDate:      '2026-04-14',
    nutritionFacts: {
      calories: 20,
      protein:  1.5,
      fat:      0.3,
      carbs:    3.2,
    },
  },
  {
    id:                'f2',
    name:              '아이용 한우 불고기',
    category:          '식품',
    storageType:       '냉동',
    baseShelfLifeDays: 30,
    purchaseDate:      '2026-04-10',
    nutritionFacts: {
      calories: 210,
      protein:  18.0,
      fat:      13.5,
      carbs:    2.1,
    },
  },
  {
    id:                'f3',
    name:              '국내산 유기농 두부',
    category:          '식품',
    storageType:       '냉장',
    baseShelfLifeDays: 7,
    purchaseDate:      '2026-04-15',
    nutritionFacts: {
      calories: 75,
      protein:  8.1,
      fat:      4.2,
      carbs:    1.8,
    },
  },
];

// ────────────────────────────────────────────────
// B. 의류 / 액세서리 Mock Data
// ────────────────────────────────────────────────
export const clothingItems: ClothingItem[] = [
  {
    id:          'c1',
    name:        'Mango 리넨 혼방 원피스',
    category:    '의류',
    size:        'M',
    thickness:   '얇음',
    material:    '리넨',
    weatherTags: ['봄', '여름'],
    colorFamily: '어스톤',
  },
  {
    id:          'c2',
    name:        'Pandora 로즈골드 링',
    category:    '액세서리',
    size:        '52',
    thickness:   '보통',
    material:    '로즈골드',
    colorFamily: '메탈릭',
  },
  {
    id:          'c3',
    name:        '유니클로 기모 후리스',
    category:    '의류',
    size:        'L',
    thickness:   '두꺼움',
    material:    '기모',
    weatherTags: ['가을', '겨울'],
    colorFamily: '어스톤',
  },
];

// ────────────────────────────────────────────────
// 통합 CartItem 배열 (주문 내역 리스트용)
// ────────────────────────────────────────────────
export const mockCartItems: CartItem[] = [...foodItems, ...clothingItems];
