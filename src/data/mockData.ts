import { FoodItem, ClothingItem, CartItem } from '@/types';

// 오늘 기준 N일 전 날짜를 ISO 문자열로 반환
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

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
    purchaseDate:      daysAgo(3),   // D-2 (임박)
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
    purchaseDate:      daysAgo(7),   // D-23 (여유)
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
    purchaseDate:      daysAgo(2),   // D-5 (보통)
    nutritionFacts: {
      calories: 75,
      protein:  8.1,
      fat:      4.2,
      carbs:    1.8,
    },
  },
  {
    id:                'f4',
    name:              '제주 감귤 주스',
    category:          '식품',
    storageType:       '냉장',
    baseShelfLifeDays: 10,
    purchaseDate:      daysAgo(9),   // D-1 (긴급)
    nutritionFacts: {
      calories: 45,
      protein:  0.5,
      fat:      0.1,
      carbs:    10.5,
    },
  },
  {
    id:                'f5',
    name:              '통밀 식빵',
    category:          '식품',
    storageType:       '실온',
    baseShelfLifeDays: 4,
    purchaseDate:      daysAgo(1),   // D-3 (경고)
  },
];

// ────────────────────────────────────────────────
// B. 패션 Mock Data (세분화된 카테고리)
// ────────────────────────────────────────────────
export const clothingItems: ClothingItem[] = [
  // ── 의류 ──
  {
    id: 'c1', name: 'Mango 리넨 혼방 원피스',
    category: '원피스', size: 'M', thickness: '얇음', material: '리넨',
    weatherTags: ['봄', '여름'], colorFamily: '어스톤',
  },
  {
    id: 'c3', name: '유니클로 기모 후리스',
    category: '아우터', size: 'L', thickness: '두꺼움', material: '기모',
    weatherTags: ['가을', '겨울'], colorFamily: '어스톤',
  },
  {
    id: 'c5', name: '무인양품 옥스포드 셔츠',
    category: '상의', size: 'M', thickness: '보통', material: '면',
    weatherTags: ['봄', '가을'], colorFamily: '모노톤',
  },
  {
    id: 'c6', name: '리바이스 501 데님',
    category: '하의', size: '32', thickness: '보통', material: '데님',
    weatherTags: ['봄', '가을'], colorFamily: '모노톤',
  },
  // ── 신발 ──
  {
    id: 'c4', name: 'Nike 에어포스 1',
    category: '신발', size: '260', thickness: '보통', material: '가죽',
    weatherTags: ['봄', '가을'], colorFamily: '모노톤',
  },
  {
    id: 'c7', name: '버켄스탁 아리조나',
    category: '신발', size: '250', thickness: '얇음', material: '코르크',
    weatherTags: ['여름'], colorFamily: '어스톤',
  },
  // ── 가방 ──
  {
    id: 'c8', name: '캉골 미니 크로스백',
    category: '가방', size: 'Free', thickness: '보통', material: '나일론',
    weatherTags: ['봄', '여름'], colorFamily: '파스텔',
  },
  // ── 액세서리 ──
  {
    id: 'c2', name: 'Pandora 로즈골드 링',
    category: '주얼리', size: '52', thickness: '보통', material: '로즈골드',
    colorFamily: '메탈릭',
  },
  {
    id: 'c9', name: 'New Era 볼캡',
    category: '모자', size: 'Free', thickness: '보통', material: '면',
    weatherTags: ['여름'], colorFamily: '모노톤',
  },
  {
    id: 'c10', name: 'Ray-Ban 웨이페어러',
    category: '선글라스', size: 'Free', thickness: '보통', material: '아세테이트',
    weatherTags: ['여름', '맑음'], colorFamily: '모노톤',
  },
  {
    id: 'c11', name: '무지 울 머플러',
    category: '스카프', size: 'Free', thickness: '두꺼움', material: '울',
    weatherTags: ['가을', '겨울'], colorFamily: '어스톤',
  },
];

// ────────────────────────────────────────────────
// 통합 CartItem 배열 (주문 내역 리스트용)
// ────────────────────────────────────────────────
export const mockCartItems: CartItem[] = [...foodItems, ...clothingItems];
