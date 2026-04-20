import type { FoodItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';

// 레시피 하나
export interface Recipe {
  id:          string;
  name:        string;
  emoji:       string;
  /** 필수 재료 — 매칭 키워드 (정확 일치 or 부분 일치 통과) */
  keywords:    readonly string[];
  time:        string;  // 조리 시간 표기 (예: "15분")
  difficulty:  '간단' | '보통' | '도전';
  tags?:       readonly string[]; // "아침", "간식" 등 부가 정보
}

// 24종 레시피 — 범용 식재료 커버
export const RECIPES: readonly Recipe[] = [
  // 신선식품 (채소·과일·정육·해산)
  { id: 'r1',  name: '두부 샐러드 볼',   emoji: '🥗', keywords: ['두부', '샐러드', '채소'],        time: '10분', difficulty: '간단', tags: ['점심'] },
  { id: 'r2',  name: '불고기 덮밥',      emoji: '🍚', keywords: ['불고기', '소고기', '대파', '양파'], time: '15분', difficulty: '보통' },
  { id: 'r3',  name: '감귤 스무디',      emoji: '🧃', keywords: ['감귤', '오렌지', '귤', '딸기'],   time: '5분',  difficulty: '간단', tags: ['간식'] },
  { id: 'r4',  name: '토스트 & 스크램블', emoji: '🍞', keywords: ['식빵', '빵', '달걀', '계란'],    time: '10분', difficulty: '간단', tags: ['아침'] },
  { id: 'r5',  name: '연어 포케 볼',     emoji: '🐟', keywords: ['연어', '샐러드', '아보카도'],    time: '15분', difficulty: '보통' },
  { id: 'r6',  name: '김치찌개',         emoji: '🍲', keywords: ['김치', '두부', '돼지고기'],      time: '20분', difficulty: '보통' },
  { id: 'r7',  name: '우유 시리얼',      emoji: '🥛', keywords: ['우유', '시리얼', '그래놀라'],    time: '3분',  difficulty: '간단', tags: ['아침'] },
  { id: 'r8',  name: '라면 + 달걀',      emoji: '🍜', keywords: ['라면', '달걀', '계란'],          time: '5분',  difficulty: '간단' },
  { id: 'r9',  name: '볶음밥',           emoji: '🍳', keywords: ['밥', '달걀', '계란', '햄', '양파'], time: '15분', difficulty: '간단' },
  { id: 'r10', name: '새우 파스타',      emoji: '🍝', keywords: ['새우', '파스타', '마늘'],        time: '20분', difficulty: '보통' },
  { id: 'r11', name: '미역국',           emoji: '🍲', keywords: ['미역', '소고기'],                time: '25분', difficulty: '보통' },
  { id: 'r12', name: '그릭요거트 보울',  emoji: '🥣', keywords: ['요거트', '그래놀라', '베리', '과일'], time: '5분',  difficulty: '간단', tags: ['아침', '간식'] },
  // 가공식품
  { id: 'r13', name: '참치 김밥',        emoji: '🍙', keywords: ['참치', '김', '밥', '계란'],       time: '15분', difficulty: '보통' },
  { id: 'r14', name: '크림 스프',        emoji: '🍵', keywords: ['우유', '감자', '양파', '버섯'],   time: '20분', difficulty: '보통' },
  { id: 'r15', name: '떡볶이',           emoji: '🍢', keywords: ['떡', '어묵', '고추장'],           time: '15분', difficulty: '간단' },
  { id: 'r16', name: '잡채',             emoji: '🥘', keywords: ['당면', '시금치', '소고기', '양파'], time: '30분', difficulty: '도전' },
  { id: 'r17', name: '만두국',           emoji: '🥟', keywords: ['만두', '떡', '국물'],             time: '15분', difficulty: '간단' },
  { id: 'r18', name: '카레라이스',       emoji: '🍛', keywords: ['카레', '감자', '당근', '양파', '고기'], time: '25분', difficulty: '보통' },
  // 베이커리 · 간식
  { id: 'r19', name: '프렌치토스트',     emoji: '🥞', keywords: ['식빵', '빵', '달걀', '우유'],     time: '10분', difficulty: '간단', tags: ['아침'] },
  { id: 'r20', name: '샌드위치',         emoji: '🥪', keywords: ['식빵', '빵', '햄', '치즈', '샐러드'], time: '10분', difficulty: '간단', tags: ['점심'] },
  { id: 'r21', name: '과일 화채',        emoji: '🍉', keywords: ['수박', '복숭아', '과일', '사이다'], time: '10분', difficulty: '간단', tags: ['간식'] },
  // 건강식품 · 음료
  { id: 'r22', name: '닭가슴살 샐러드',  emoji: '🥗', keywords: ['닭가슴살', '샐러드', '아보카도'], time: '15분', difficulty: '간단' },
  { id: 'r23', name: '오트밀 죽',        emoji: '🌾', keywords: ['오트밀', '우유', '견과'],         time: '10분', difficulty: '간단', tags: ['아침'] },
  { id: 'r24', name: '단호박 수프',      emoji: '🎃', keywords: ['단호박', '호박', '우유'],         time: '25분', difficulty: '보통' },
];

export interface MatchedRecipe {
  recipe:        Recipe;
  matchedItems:  string[];
  matchScore:    number; // 매칭 개수 * 1 + 임박 아이템 매칭 * 2
  urgentBoosted: boolean; // 소비 임박 아이템을 포함하는지
}

/**
 * 보유 식재료와 레시피 키워드를 매칭한다.
 * - 부분 일치 허용 ("딸기 한 팩" ∋ "딸기")
 * - 소비 임박(D-Day ≤ 3) 식품이 매칭되면 +2 보너스 + urgentBoosted=true
 * - matchScore 높은 순, 동점 시 난이도 쉬운 순
 */
export function matchRecipes(foods: FoodItem[], maxResults = 8): MatchedRecipe[] {
  const nameIndex = foods.map((f) => ({
    name:  f.name,
    urgent: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  }));

  const difficultyOrder = { 간단: 0, 보통: 1, 도전: 2 } as const;

  const results: MatchedRecipe[] = [];
  for (const recipe of RECIPES) {
    const matchedItems: string[] = [];
    let urgentBoost = 0;
    for (const kw of recipe.keywords) {
      const hit = nameIndex.find((n) => n.name.includes(kw));
      if (hit) {
        matchedItems.push(hit.name);
        if (hit.urgent) urgentBoost += 2;
      }
    }
    if (matchedItems.length === 0) continue;
    results.push({
      recipe,
      matchedItems,
      matchScore:    matchedItems.length + urgentBoost,
      urgentBoosted: urgentBoost > 0,
    });
  }

  return results
    .sort((a, b) => {
      if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
      return difficultyOrder[a.recipe.difficulty] - difficultyOrder[b.recipe.difficulty];
    })
    .slice(0, maxResults);
}
