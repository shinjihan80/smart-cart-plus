/**
 * 카테고리별 fallback 이미지 — 사용자가 직접 이미지를 업로드하지 않은 항목에
 * 카테고리에 어울리는 stock 사진을 매핑한다.
 *
 * 출처: Unsplash (라이선스 무료, 출처 표기 권장이지만 강제 아님)
 * 크기: 200x200 cover crop — 카드 썸네일에 충분
 *
 * 적용 지점은 두 가지 방식이 가능하지만 현재는 *렌더 타임 폴백*만 사용:
 * - 저장된 데이터는 imageUrl을 비워둠 (사용자 의도 보존)
 * - 카드/리스트가 표시할 때만 getDisplayImage(item)으로 카테고리 사진을 채움
 */

import type { CartItem, FashionCategory, FoodCategory } from '@/types';
import { isFoodItem } from '@/types';

const UNSPLASH = (id: string, q = 'w=200&h=200&fit=crop') => `https://images.unsplash.com/photo-${id}?${q}`;

const FOOD_FALLBACK: Record<FoodCategory, string> = {
  '채소·과일':   UNSPLASH('1610348725531-843dff563e2c'),     // 신선 채소 그릇
  '정육·계란':   UNSPLASH('1607623814075-e51df1bdc82f'),     // 붉은 고기
  '수산·해산':   UNSPLASH('1535850452425-140ee4a8dbae'),     // 생선
  '유제품':      UNSPLASH('1563636619-e9143da7973b'),        // 우유
  '음료':        UNSPLASH('1437418747212-8d9709afab22'),     // 음료병
  '간식·과자':   UNSPLASH('1599490659213-e2b9527bd087'),     // 쿠키
  '양념·소스':   UNSPLASH('1505253213348-cd54c92b37cb'),     // 양념 병
  '면·즉석':     UNSPLASH('1569718212165-3a8278d5f624'),     // 면류
  '빵·베이커리': UNSPLASH('1509440159596-0249088772ff'),     // 빵
  '건강식품':    UNSPLASH('1607619056574-7b8d3ee536b2'),     // 비타민/영양제
  '기타 식품':   UNSPLASH('1546069901-ba9599a7e63c'),        // 일반 식품 보울
};

const FASHION_FALLBACK: Record<FashionCategory, string> = {
  '상의':         UNSPLASH('1521572163474-6864f9cf17ab'),    // 흰 티
  '하의':         UNSPLASH('1542272604-787c3835535d'),       // 청바지
  '아우터':       UNSPLASH('1551028719-00167b16eac5'),       // 코트
  '원피스':       UNSPLASH('1572804013309-59a88b7e92f1'),    // 원피스
  '신발':         UNSPLASH('1542291026-7eec264c27ff'),       // 운동화
  '가방':         UNSPLASH('1548036328-c9fa89d128fa'),       // 토트백
  '모자':         UNSPLASH('1521369909029-2afed882baee'),    // 모자
  '스카프':       UNSPLASH('1601925260368-ae2f83cf8b7f'),    // 스카프
  '안경':         UNSPLASH('1574258495973-f010dfbb5371'),    // 안경
  '선글라스':     UNSPLASH('1572635196237-14b3f281503f'),    // 선글라스
  '시계':         UNSPLASH('1524592094714-0f0654e20314'),    // 시계
  '주얼리':       UNSPLASH('1599643478518-a784e5dc4c8f'),    // 주얼리
  '기타 액세서리': UNSPLASH('1611591437281-460bfbe1220a'),   // 잡화
};

/**
 * 식품 카테고리에 어울리는 stock 이미지 URL 반환.
 */
export function getFoodCategoryImage(category: FoodCategory): string {
  return FOOD_FALLBACK[category] ?? FOOD_FALLBACK['기타 식품'];
}

/**
 * 패션 카테고리에 어울리는 stock 이미지 URL 반환.
 */
export function getFashionCategoryImage(category: FashionCategory): string {
  return FASHION_FALLBACK[category] ?? FASHION_FALLBACK['기타 액세서리'];
}

/**
 * 표시용 이미지 — 사용자가 올린 imageUrl이 있으면 그대로,
 * 없으면 카테고리 fallback 사용.
 */
export function getDisplayImage(item: CartItem): string {
  if (item.imageUrl) return item.imageUrl;
  if (isFoodItem(item)) return getFoodCategoryImage(item.foodCategory);
  return getFashionCategoryImage(item.category);
}
