import type { FoodItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import type { Season } from './season';

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
  /** 간단한 조리 스텝 (모달에 노출) */
  steps:       readonly string[];
  /** 한 줄 요리 설명 (모달 서브텍스트) */
  blurb?:      string;
  /** 이 계절에 특히 어울리는 레시피 (없으면 전계절) */
  seasons?:    readonly Season[];
}

export const SEASON_EMOJI = { 봄: '🌸', 여름: '☀️', 가을: '🍂', 겨울: '❄️' } as const;

// 24종 레시피 — 범용 식재료 커버
/** 레시피 난이도·태그에 맞는 은은한 Tailwind 그라데이션 클래스를 돌려준다. */
export function recipeGradient(recipe: Recipe): string {
  if (recipe.difficulty === '간단')  return 'from-sky-50 to-brand-success/15';
  if (recipe.difficulty === '도전')  return 'from-amber-50 to-rose-100';
  if (recipe.tags?.includes('아침')) return 'from-amber-50 to-pink-50';
  if (recipe.tags?.includes('간식')) return 'from-pink-50 to-purple-50';
  return 'from-brand-primary/5 to-brand-success/10';
}

/** 주어진 식재료(부분 일치)를 키워드로 하는 레시피 개수. */
export function countRecipesByIngredient(ingredient: string): number {
  if (!ingredient) return 0;
  return RECIPES.filter((r) =>
    r.keywords.some((kw) => kw.includes(ingredient) || ingredient.includes(kw)),
  ).length;
}

/** 레시피 time 문자열("15분", "1시간 10분" 등)을 초로 환산. 파싱 실패 시 null. */
export function parseRecipeSeconds(time: string): number | null {
  const m = time.match(/(?:(\d+)\s*시간)?\s*(\d+)?\s*분?/);
  if (!m) return null;
  const hours   = m[1] ? parseInt(m[1], 10) : 0;
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  if (hours === 0 && minutes === 0) return null;
  return hours * 3600 + minutes * 60;
}

export const RECIPES: readonly Recipe[] = [
  {
    id: 'r1', name: '두부 샐러드 볼', emoji: '🥗',
    keywords: ['두부', '샐러드', '채소'], time: '10분', difficulty: '간단', tags: ['점심'],
    seasons: ['봄', '여름'],
    blurb: '단백질과 채소를 한 그릇에.',
    steps: ['두부를 깍둑썰기해 키친타월로 물기 제거', '샐러드 채소를 씻어 볼에 담기', '두부를 얹고 올리브유·소금·후추로 마무리'],
  },
  {
    id: 'r2', name: '불고기 덮밥', emoji: '🍚',
    keywords: ['불고기', '소고기', '대파', '양파'], time: '15분', difficulty: '보통',
    seasons: ['가을', '겨울'],
    blurb: '밥 위에 바로 얹는 간장 베이스 덮밥.',
    steps: ['불고기를 간장·설탕·마늘로 10분 재우기', '팬에 양파·대파와 함께 센 불에 볶기', '따뜻한 밥 위에 얹고 통깨 뿌리기'],
  },
  {
    id: 'r3', name: '감귤 스무디', emoji: '🧃',
    keywords: ['감귤', '오렌지', '귤', '딸기'], time: '5분', difficulty: '간단', tags: ['간식'],
    seasons: ['겨울'],
    blurb: '비타민 C 폭탄 한 잔.',
    steps: ['껍질을 깐 감귤과 얼음을 블렌더에 넣기', '요거트나 우유를 취향껏 추가', '30초 갈아 컵에 옮겨 담기'],
  },
  {
    id: 'r4', name: '토스트 & 스크램블', emoji: '🍞',
    keywords: ['식빵', '빵', '달걀', '계란'], time: '10분', difficulty: '간단', tags: ['아침'],
    seasons: ['봄', '여름', '가을', '겨울'],
    blurb: '반숙 스크램블과 바삭한 토스트.',
    steps: ['달걀 2개에 우유 1큰술·소금 한 꼬집 풀어주기', '약불에 버터 녹인 팬에 천천히 저으며 익히기', '구운 식빵 위에 얹고 후추 살짝'],
  },
  {
    id: 'r5', name: '연어 포케 볼', emoji: '🐟',
    keywords: ['연어', '샐러드', '아보카도'], time: '15분', difficulty: '보통',
    seasons: ['여름'],
    blurb: '하와이안 스타일 생연어 보울.',
    steps: ['생연어를 깍둑썰기해 간장·참기름에 5분 버무리기', '밥·샐러드·아보카도를 볼에 담기', '연어를 올리고 참깨·쪽파로 마무리'],
  },
  {
    id: 'r6', name: '김치찌개', emoji: '🍲',
    keywords: ['김치', '두부', '돼지고기'], time: '20분', difficulty: '보통',
    seasons: ['가을', '겨울'],
    blurb: '묵은 김치와 돼지고기의 궁합.',
    steps: ['돼지고기를 기름에 볶아 색을 내기', '김치·물·고춧가루를 넣고 10분 끓이기', '두부를 넣고 5분 더 끓여 마무리'],
  },
  {
    id: 'r7', name: '우유 시리얼', emoji: '🥛',
    keywords: ['우유', '시리얼', '그래놀라'], time: '3분', difficulty: '간단', tags: ['아침'],
    seasons: ['봄', '여름', '가을', '겨울'],
    blurb: '가장 빠른 아침 한 끼.',
    steps: ['그릇에 시리얼을 담기', '차가운 우유를 붓기', '바나나·베리 등 과일을 취향껏 올리기'],
  },
  {
    id: 'r8', name: '라면 + 달걀', emoji: '🍜',
    keywords: ['라면', '달걀', '계란'], time: '5분', difficulty: '간단',
    seasons: ['가을', '겨울'],
    blurb: '황금 반숙 라면.',
    steps: ['물 550ml를 끓인 뒤 스프·건더기 투입', '면을 넣고 3분 뒤 달걀을 깨뜨려 넣기', '불을 끄고 30초 뜸들여 그릇에 옮기기'],
  },
  {
    id: 'r9', name: '볶음밥', emoji: '🍳',
    keywords: ['밥', '달걀', '계란', '햄', '양파'], time: '15분', difficulty: '간단',
    seasons: ['봄', '여름', '가을', '겨울'],
    blurb: '냉장고 털이 만능 한 그릇.',
    steps: ['팬에 기름 두르고 양파·햄 볶기', '달걀을 풀어 스크램블 만들기', '식은 밥을 넣고 간장·소금으로 간해 센 불에 볶기'],
  },
  {
    id: 'r10', name: '새우 파스타', emoji: '🍝',
    keywords: ['새우', '파스타', '마늘'], time: '20분', difficulty: '보통',
    seasons: ['봄', '여름'],
    blurb: '오일 베이스 감바스 파스타.',
    steps: ['파스타를 소금 넣은 물에 7분 삶기', '팬에 마늘·올리브유로 새우 볶기', '삶은 면과 면수 2국자 넣고 1분 더 볶아 마무리'],
  },
  {
    id: 'r11', name: '미역국', emoji: '🍲',
    keywords: ['미역', '소고기'], time: '25분', difficulty: '보통',
    seasons: ['봄', '여름', '가을', '겨울'],
    blurb: '담백하고 속 편한 국.',
    steps: ['미역을 물에 10분 불려 물기 짜기', '참기름에 소고기·미역 볶기', '물 700ml와 간장 1큰술 넣고 15분 끓이기'],
  },
  {
    id: 'r12', name: '그릭요거트 보울', emoji: '🥣',
    keywords: ['요거트', '그래놀라', '베리', '과일'], time: '5분', difficulty: '간단', tags: ['아침', '간식'],
    seasons: ['봄', '여름'],
    blurb: '단백질과 식이섬유가 풍부한 한 그릇.',
    steps: ['그릭요거트를 그릇에 담기', '그래놀라와 베리류를 올리기', '꿀이나 메이플시럽 한 바퀴'],
  },
  {
    id: 'r13', name: '참치 김밥', emoji: '🍙',
    keywords: ['참치', '김', '밥', '계란'], time: '15분', difficulty: '보통',
    seasons: ['봄', '여름'],
    blurb: '도시락 단골 참치마요 김밥.',
    steps: ['참치캔 기름 빼고 마요네즈·후추로 버무리기', '김 위에 밥을 펴고 참치·단무지·계란지단 올리기', '단단하게 말아 8등분으로 썰기'],
  },
  {
    id: 'r14', name: '크림 스프', emoji: '🍵',
    keywords: ['우유', '감자', '양파', '버섯'], time: '20분', difficulty: '보통',
    seasons: ['가을', '겨울'],
    blurb: '부드러운 우유 베이스 수프.',
    steps: ['양파·감자·버섯을 버터에 볶기', '밀가루 1큰술 넣고 볶다 우유 500ml 붓기', '소금·후추로 간하고 10분 약불로 끓이기'],
  },
  {
    id: 'r15', name: '떡볶이', emoji: '🍢',
    keywords: ['떡', '어묵', '고추장'], time: '15분', difficulty: '간단',
    seasons: ['가을', '겨울'],
    blurb: '매콤달콤 집밥 떡볶이.',
    steps: ['물 400ml에 고추장·설탕·간장을 풀어 끓이기', '떡·어묵을 넣고 중불에 10분 조리기', '대파·삶은 달걀을 올려 마무리'],
  },
  {
    id: 'r16', name: '잡채', emoji: '🥘',
    keywords: ['당면', '시금치', '소고기', '양파'], time: '30분', difficulty: '도전',
    seasons: ['가을', '겨울'],
    blurb: '특별한 날의 잡채.',
    steps: ['당면을 10분 삶아 찬물에 헹구기', '시금치·양파·당근·소고기를 각각 볶기', '간장·참기름·설탕으로 재료를 한데 버무리기'],
  },
  {
    id: 'r17', name: '만두국', emoji: '🥟',
    keywords: ['만두', '떡', '국물'], time: '15분', difficulty: '간단',
    seasons: ['겨울'],
    blurb: '간편한 국물 요리.',
    steps: ['멸치 육수나 물 700ml를 끓이기', '떡과 만두를 넣고 만두가 떠오를 때까지 끓이기', '달걀 풀어 넣고 파·김가루로 마무리'],
  },
  {
    id: 'r18', name: '카레라이스', emoji: '🍛',
    keywords: ['카레', '감자', '당근', '양파', '고기'], time: '25분', difficulty: '보통',
    seasons: ['가을', '겨울'],
    blurb: '든든한 한 그릇.',
    steps: ['양파·당근·감자·고기를 큼직하게 썰어 볶기', '물 600ml 부어 15분 끓이기', '카레 고형분을 녹여 5분 더 끓인 뒤 밥에 얹기'],
  },
  {
    id: 'r19', name: '프렌치토스트', emoji: '🥞',
    keywords: ['식빵', '빵', '달걀', '우유'], time: '10분', difficulty: '간단', tags: ['아침'],
    seasons: ['가을', '겨울'],
    blurb: '달콤한 브런치.',
    steps: ['달걀·우유·설탕을 볼에 잘 섞기', '식빵을 달걀물에 30초 적시기', '버터 두른 팬에 앞뒤로 노릇하게 굽기'],
  },
  {
    id: 'r20', name: '샌드위치', emoji: '🥪',
    keywords: ['식빵', '빵', '햄', '치즈', '샐러드'], time: '10분', difficulty: '간단', tags: ['점심'],
    seasons: ['봄', '여름'],
    blurb: '포장해도 좋은 간편식.',
    steps: ['식빵 한 장에 머스터드·버터를 바르기', '햄·치즈·샐러드·토마토를 겹쳐 올리기', '나머지 식빵으로 덮고 대각선으로 자르기'],
  },
  {
    id: 'r21', name: '과일 화채', emoji: '🍉',
    keywords: ['수박', '복숭아', '과일', '사이다'], time: '10분', difficulty: '간단', tags: ['간식'],
    seasons: ['여름'],
    blurb: '여름 디저트의 왕.',
    steps: ['수박·복숭아를 한입 크기로 썰기', '볼에 과일을 담고 사이다 부어 섞기', '얼음 몇 조각 올려 차갑게 즐기기'],
  },
  {
    id: 'r22', name: '닭가슴살 샐러드', emoji: '🥗',
    keywords: ['닭가슴살', '샐러드', '아보카도'], time: '15분', difficulty: '간단',
    seasons: ['봄', '여름'],
    blurb: '고단백 저탄수 한 그릇.',
    steps: ['닭가슴살을 소금·후추 뿌려 팬에 구워 슬라이스', '샐러드 채소와 아보카도를 볼에 담기', '발사믹 드레싱과 닭가슴살을 올려 마무리'],
  },
  {
    id: 'r23', name: '오트밀 죽', emoji: '🌾',
    keywords: ['오트밀', '우유', '견과'], time: '10분', difficulty: '간단', tags: ['아침'],
    seasons: ['가을', '겨울'],
    blurb: '속을 편하게 시작하는 아침.',
    steps: ['오트밀 50g에 우유 200ml 부어 약불로 5분 끓이기', '꿀·시나몬 파우더로 단맛 조절', '견과류·과일 토핑 얹어 내기'],
  },
  {
    id: 'r24', name: '단호박 수프', emoji: '🎃',
    keywords: ['단호박', '호박', '우유'], time: '25분', difficulty: '보통',
    seasons: ['가을', '겨울'],
    blurb: '달큰한 가을·겨울 수프.',
    steps: ['단호박을 쪄서 숟가락으로 긁어 살만 모으기', '블렌더에 단호박·우유·버터를 갈기', '냄비에 옮겨 소금·후추로 간하고 5분 데우기'],
  },
  {
    id: 'r25', name: '전어 구이', emoji: '🐟',
    keywords: ['전어', '생선'], time: '15분', difficulty: '보통',
    seasons: ['가을'],
    blurb: '"가을 전어 굽는 냄새에 집 나간 며느리 돌아온다".',
    steps: ['전어 비늘 벗겨 깨끗이 씻기', '소금 뿌려 10분 숙성', '예열된 그릴에 앞뒤로 5분씩 굽기'],
  },
  {
    id: 'r26', name: '굴전', emoji: '🦪',
    keywords: ['굴', '계란', '달걀', '밀가루'], time: '15분', difficulty: '간단',
    seasons: ['겨울'],
    blurb: '싱싱한 겨울 굴로 만드는 전.',
    steps: ['굴을 소금물에 씻고 물기 제거', '밀가루·계란물 순서로 입히기', '기름 두른 팬에 앞뒤로 노릇하게 부치기'],
  },
  {
    id: 'r27', name: '방어회', emoji: '🍣',
    keywords: ['방어', '회'], time: '10분', difficulty: '보통',
    seasons: ['겨울'],
    blurb: '대방어 지방의 깊은 풍미.',
    steps: ['방어를 얇게 저미기', '접시에 부채 모양으로 올리기', '간장·고추냉이 곁들여 내기'],
  },
  {
    id: 'r28', name: '사과잼 토스트', emoji: '🍏',
    keywords: ['사과', '식빵', '빵'], time: '20분', difficulty: '간단', tags: ['아침'],
    seasons: ['가을'],
    blurb: '햇사과로 만드는 홈메이드 잼.',
    steps: ['사과를 잘게 썰어 설탕·레몬즙과 15분 졸이기', '구운 식빵에 두껍게 바르기', '시나몬 한 꼬집 뿌려 마무리'],
  },
  {
    id: 'r29', name: '감 샐러드', emoji: '🍂',
    keywords: ['감', '샐러드', '과일'], time: '10분', difficulty: '간단',
    seasons: ['가을'],
    blurb: '단감의 아삭함을 살린 샐러드.',
    steps: ['단감 껍질 벗겨 얇게 슬라이스', '샐러드 채소·호두와 볼에 담기', '올리브유·발사믹 드레싱으로 마무리'],
  },
  {
    id: 'r30', name: '팥죽', emoji: '🫘',
    keywords: ['팥', '새알심', '찹쌀'], time: '60분', difficulty: '도전',
    seasons: ['겨울'],
    blurb: '동지의 따뜻한 한 그릇.',
    steps: ['팥을 물에 담가 3시간 이상 불리기', '새 물로 1시간 푹 끓여 으깨기', '찹쌀 새알심을 넣고 10분 더 끓이기'],
  },
];

export interface MatchedRecipe {
  recipe:         Recipe;
  matchedItems:   string[];
  matchScore:     number;  // 매칭 개수 + 임박(+2) + 계절(+1.5) + 선호(+최대3)
  urgentBoosted:  boolean; // 소비 임박 아이템 포함
  seasonBoosted:  boolean; // 현재 계절과 매칭
  loveBoosted:    boolean; // 사용자가 자주 만든 레시피 (3회 이상)
  cookCount:      number;  // 조리 횟수
}

export interface MatchOptions {
  currentSeason?: Season;
  cookCounts?:    Record<string, number>;
  /** 영양 편향 보정 — 'protein' → 단백질 레시피 +1, 'veg' → 채소·과일 위주 레시피 +1 */
  nutritionHint?: 'protein' | 'veg';
}

const PROTEIN_KEYWORDS = ['두부', '달걀', '계란', '닭', '소고기', '돼지', '생선', '연어', '참치', '새우', '오징어', '고등어', '꽁치', '굴', '방어', '전어', '민어', '대구', '햄', '소시지', '치즈'];
const VEG_KEYWORDS     = ['채소', '샐러드', '시금치', '양파', '당근', '버섯', '브로콜리', '상추', '봄동', '쑥', '냉이', '달래', '두릅', '아스파라거스', '감자', '단호박', '호박', '가지', '오이', '토마토'];

function recipeTags(recipe: Recipe): { isProtein: boolean; isVeg: boolean } {
  let isProtein = false;
  let isVeg     = false;
  for (const kw of recipe.keywords) {
    if (PROTEIN_KEYWORDS.some((p) => kw.includes(p) || p.includes(kw))) isProtein = true;
    if (VEG_KEYWORDS.some((v) => kw.includes(v) || v.includes(kw)))     isVeg     = true;
  }
  return { isProtein, isVeg };
}

/**
 * 보유 식재료와 레시피 키워드를 매칭한다.
 * - 부분 일치 허용 ("딸기 한 팩" ∋ "딸기")
 * - 소비 임박(D-Day ≤ 3) 식품이 매칭되면 +2 보너스 + urgentBoosted=true
 * - 레시피가 현재 계절에 맞으면 +1.5 보너스 + seasonBoosted=true
 * - 조리 횟수 1회당 +1 (최대 +3). 3회 이상이면 loveBoosted=true
 * - matchScore 높은 순, 동점 시 난이도 쉬운 순
 */
export function matchRecipes(
  foods: FoodItem[],
  maxResults = 8,
  opts: MatchOptions | Season = {},
): MatchedRecipe[] {
  const options: MatchOptions = typeof opts === 'string' ? { currentSeason: opts } : opts;
  const { currentSeason, cookCounts, nutritionHint } = options;

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

    const seasonBoosted = !!(currentSeason && recipe.seasons && recipe.seasons.includes(currentSeason));
    const seasonBoost   = seasonBoosted ? 1.5 : 0;

    const cookCount  = cookCounts?.[recipe.id] ?? 0;
    const loveBoost  = Math.min(cookCount, 3);
    const loveBoosted = cookCount >= 3;

    let nutritionBoost = 0;
    if (nutritionHint) {
      const { isProtein, isVeg } = recipeTags(recipe);
      if (nutritionHint === 'protein' && isProtein) nutritionBoost = 1;
      if (nutritionHint === 'veg'     && isVeg)     nutritionBoost = 1;
    }

    results.push({
      recipe,
      matchedItems,
      matchScore:     matchedItems.length + urgentBoost + seasonBoost + loveBoost + nutritionBoost,
      urgentBoosted:  urgentBoost > 0,
      seasonBoosted,
      loveBoosted,
      cookCount,
    });
  }

  return results
    .sort((a, b) => {
      if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
      return difficultyOrder[a.recipe.difficulty] - difficultyOrder[b.recipe.difficulty];
    })
    .slice(0, maxResults);
}
