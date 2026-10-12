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
 * 같은 식재료를 가리키는 동의어 — sameFoodProduct 기준으로만 하나로
 * 묶는다(재검토 P2-51, E2 코드 확인: "계란"과 "달걀"이 KEYWORD_MAP에
 * 별개 키워드로 들어 있어 서로 다른 품목으로 오판했다). 실제로 P0-74
 * 에서 계란 보관일수를 "달걀"에도 적용해야 했던 것과 같은 뿌리.
 */
const KEYWORD_SYNONYMS: Record<string, string> = {
  '달걀': '계란',
};

/**
 * "같은 품목"으로 볼 핵심 키워드 추출 — 매칭되는 키워드가 없으면 공백만
 * 제거한 원문을 그대로 반환(기존 완전일치 동작 유지).
 *
 * 재검토(P2-51, E2 코드 확인) 2가지 보완:
 * 1. 1글자 키워드("파"·"닭"·"빵" 등)는 매칭 후보에서 제외한다 — 짧을수록
 *    엉뚱한 합성어에 우연히 걸릴 위험이 크다("파프리카"와 "쪽파"가 둘 다
 *    "파"를 포함해 같은 품목으로 오판됐다). inferFoodCategory(카테고리
 *    추정만, 오분류 리스크가 더 낮음)는 KEYWORD_MAP을 그대로 써 영향 없음.
 * 2. 길이가 같은 후보가 여러 개면 이름 안에서 더 뒤쪽(= 한국어 합성명사의
 *    핵심어에 가까운 쪽)에 나오는 키워드를 우선한다 — "사과주스"가
 *    "사과"(앞)보다 "주스"(뒤, 실제 품목)를 가리키게 한다.
 */
export function canonicalFoodKeyword(name: string): string {
  let best: { kw: string; pos: number } | null = null;
  for (const kw of ALL_FOOD_KEYWORDS) {
    if (kw.length <= 1) continue;
    const pos = name.indexOf(kw);
    if (pos === -1) continue;
    if (!best || kw.length > best.kw.length || (kw.length === best.kw.length && pos > best.pos)) {
      best = { kw, pos };
    }
  }
  const resolved = best ? best.kw : name.replace(/\s+/g, '');
  return KEYWORD_SYNONYMS[resolved] ?? resolved;
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

/**
 * 카테고리 기본값보다 실제 보관 기준에 더 가까운 개별 품목 예외 —
 * 재검토(P0-74, C1 실측 + E1·E2 코드 확인)에서 발견된 "같은 식재료가
 * 입력 경로마다 보관일이 다르다" 문제의 가장 직접적인 사례부터 등록.
 * 계란은 '정육·계란' 카테고리(생고기 기준 냉장 5일)에 묶여 있었지만
 * 실제로는 냉장 3~5주가 통상 기준이라, 냉장고 '장보기' 빠른 추가 칩은
 * 이미 21일로 손으로 맞춰 놓은 상태였다 — 그 값을 카테고리 기본값에도
 * 반영해 입력 경로(직접입력/빠른 추가/재구매/쇼핑 리스트)에 상관없이
 * 같은 값이 나오게 한다. 155개 재료 전체를 덮는 품목표 전면 도입은
 * 범위 밖(M) — 이번엔 리뷰에서 지목된 사례만 닫는다.
 */
const ITEM_SHELF_LIFE_OVERRIDES: { keywords: string[]; storageType: StorageType; baseShelfLifeDays: number }[] = [
  { keywords: ['계란', '달걀'], storageType: '냉장', baseShelfLifeDays: 21 },
  // 재검토(C1 실측) — QUICK_ADD_FOODS 프리셋과 값을 맞춘 4건. 식빵·
  // 바나나는 생물 특성상 카테고리 기본값(냉장)보다 실온이 더 현실적이고,
  // 닭가슴살은 대량구매 시 냉동 보관이 흔한 실사용 패턴이라 카테고리
  // 기본(냉장)과 다른 storageType을 일부러 쓴다.
  { keywords: ['식빵'],   storageType: '실온', baseShelfLifeDays: 4  },
  { keywords: ['바나나'], storageType: '실온', baseShelfLifeDays: 5  },
  { keywords: ['닭가슴살'], storageType: '냉동', baseShelfLifeDays: 60 },
  { keywords: ['요거트', '요구르트'], storageType: '냉장', baseShelfLifeDays: 14 },
  // 재검토(C1 실측) — 편의점/즉석 식품은 "기타 식품" 안전 기본값(냉장
  // 7일)에 걸리면 실제 보관 기준보다 너무 길어 상한 걸 먹을 위험이
  // 있다(삼각김밥·초밥은 당일 소비가 원칙). 아이스크림은 '면·즉석'
  // 어디에도 안 걸려 냉장 7일로 잡혔는데 애초에 냉동 보관 품목이다.
  { keywords: ['아이스크림'], storageType: '냉동', baseShelfLifeDays: 180 },
  { keywords: ['삼각김밥'],   storageType: '냉장', baseShelfLifeDays: 1   },
  { keywords: ['초밥'],       storageType: '냉장', baseShelfLifeDays: 1   },
];

/**
 * 이름에 보관 위치가 이미 적혀 있으면(예: "냉동만두") 그 정보가
 * 카테고리 기본값보다 우선해야 한다(재검토 C1 실측 — "냉동만두"가
 * '면·즉석' 카테고리 기본값을 그대로 받아 "실온 보관"으로 떨어졌다.
 * 바로 위 칸 설명이 "냉동실 아래칸"인데도 그랬다). 사용자가 이름에
 * 이미 써 둔 정보를 시스템이 무시하면 안 된다 — baseShelfLifeDays는
 * 그대로 두고 storageType만 이 힌트로 덮어쓴다.
 */
const STORAGE_HINT_KEYWORDS: { keywords: string[]; storageType: StorageType }[] = [
  { keywords: ['냉동'], storageType: '냉동' },
  { keywords: ['냉장'], storageType: '냉장' },
  { keywords: ['실온', '상온'], storageType: '실온' },
];

function detectStorageHint(name: string): StorageType | null {
  const hit = STORAGE_HINT_KEYWORDS.find((h) => h.keywords.some((kw) => name.includes(kw)));
  return hit ? hit.storageType : null;
}

/**
 * 계란/달걀이 "완성 요리" 이름에 들어간 경우(계란말이·계란빵·달걀샐러드
 * 등)까지 생란 보관 기준(21일)을 적용하면 안 된다(재검토 C1 실측 —
 * "계란말이"가 21일로 저장됨). 합성어를 제대로 가르려면 형태소
 * 분석기가 필요하지만, 여기선 리뷰에서 실제로 지목된 사례부터 닫는다.
 */
const EGG_DISH_EXCLUSIONS = ['계란말이', '계란빵', '계란찜', '계란국', '계란장', '계란볶음밥', '계란샐러드', '달걀샐러드', '계란 샌드위치', '달걀 샌드위치', '구운계란', '훈제계란', '계란과자'];

/** 카테고리별 합리적 기본 보관 방식과 기한 — name을 주면 품목별 예외를 먼저 본다. */
export function inferFoodDefaults(category: FoodCategory, name?: string): { storageType: StorageType; baseShelfLifeDays: number } {
  const hint = name ? detectStorageHint(name) : null;

  if (name && !EGG_DISH_EXCLUSIONS.some((dish) => name.includes(dish))) {
    const override = ITEM_SHELF_LIFE_OVERRIDES.find((o) => o.keywords.some((kw) => name.includes(kw)));
    if (override) return { storageType: hint ?? override.storageType, baseShelfLifeDays: override.baseShelfLifeDays };
  }
  const base = inferCategoryDefaults(category);
  return hint ? { ...base, storageType: hint } : base;
}

function inferCategoryDefaults(category: FoodCategory): { storageType: StorageType; baseShelfLifeDays: number } {
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
    // 재검토(/nemoa-review quick, E1·E2 공동 P0) — 미분류("기타 식품")
    // 폴백이 "실온 30일"이었다. 레시피 107종의 재료 키워드 155개를 실제
    // KEYWORD_MAP으로 돌려보니 51%(79개)가 이 폴백에 걸렸고, 그 안에
    // 삼겹살·차돌박이·회·두부·김치·생크림처럼 냉장이 필수인 품목이
    // 섞여 있었다 — 레시피 상세 "장보기에 담기"→쇼핑 리스트→"냉장고에
    // 담기" 경로(createFoodItemFromIngredient)를 그대로 따라가면 사용자
    // 실수 없이도 생기는 문제라 P0. 안전한 쪽(냉장)으로 기본값을 옮긴다
    // — 품목별 정밀 표(ITEM_DEFAULTS, 155개 닫힌 집합) 전면 도입은
    // 범위 밖으로 이월, 이번엔 최소 안전장치만.
    default:            return { storageType: '냉장', baseShelfLifeDays: 7 };
  }
}

/** 이름 하나로 FoodItem 생성 — 오늘 구매 가정, 스키마 v2 안전. */
export function createFoodItemFromIngredient(name: string): FoodItem {
  const foodCategory = inferFoodCategory(name);
  const { storageType, baseShelfLifeDays } = inferFoodDefaults(foodCategory, name);
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
