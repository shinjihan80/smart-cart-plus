import type { FoodCategory, StorageType } from '@/types';
import type { Season } from './season';

export interface SeasonalProduce {
  name:              string;
  emoji:             string;
  foodCategory:      FoodCategory;
  storageType:       StorageType;
  baseShelfLifeDays: number;
  seasons:           readonly Season[];
  peak?:             Season;
  blurb?:            string;
}

export const SEASONAL_PRODUCE: readonly SeasonalProduce[] = [
  { name: '딸기',     emoji: '🍓', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['봄'],          peak: '봄',   blurb: '3~5월 제철, 비타민C 풍부' },
  { name: '냉이',     emoji: '🌿', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 4,  seasons: ['봄'],          peak: '봄',   blurb: '향긋한 봄나물, 된장국에 좋아요' },
  { name: '달래',     emoji: '🌱', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 4,  seasons: ['봄'],          peak: '봄',   blurb: '된장찌개·전에 어울려요' },
  { name: '봄동',     emoji: '🥬', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['봄'],          peak: '봄',   blurb: '달큰한 봄 배추' },
  { name: '두릅',     emoji: '🌿', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['봄'],          peak: '봄',   blurb: '데쳐서 초고추장에' },
  { name: '주꾸미',   emoji: '🐙', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['봄'],          peak: '봄',   blurb: '3~4월 통통하게 살 올라요' },

  { name: '수박',     emoji: '🍉', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 10, seasons: ['여름'],        peak: '여름', blurb: '여름 수분 보충의 왕' },
  { name: '참외',     emoji: '🍈', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 10, seasons: ['여름'],        peak: '여름', blurb: '6~8월 달큰해져요' },
  { name: '복숭아',   emoji: '🍑', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['여름'],        peak: '여름', blurb: '7~8월 제철' },
  { name: '자두',     emoji: '🟣', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['여름'],        peak: '여름', blurb: '새콤달콤 여름 간식' },
  { name: '옥수수',   emoji: '🌽', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 4,  seasons: ['여름'],        peak: '여름', blurb: '8월 초당 옥수수 제철' },
  { name: '토마토',   emoji: '🍅', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 7,  seasons: ['여름'],        peak: '여름', blurb: '6~9월 영양 듬뿍' },
  { name: '블루베리', emoji: '🫐', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 7,  seasons: ['여름'],        peak: '여름', blurb: '7~8월 제철, 항산화 끝판왕' },

  { name: '고구마',   emoji: '🍠', foodCategory: '채소·과일', storageType: '실온', baseShelfLifeDays: 30, seasons: ['가을', '겨울'], peak: '가을', blurb: '10~11월 햇고구마 가장 달아요' },
  { name: '감',       emoji: '🍂', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 10, seasons: ['가을'],        peak: '가을', blurb: '단감·홍시 모두 가을' },
  { name: '사과',     emoji: '🍎', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 21, seasons: ['가을', '겨울'], peak: '가을', blurb: '10~11월 햇사과 제철' },
  { name: '배',       emoji: '🍐', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 21, seasons: ['가을'],        peak: '가을', blurb: '9~10월 아삭하게' },
  { name: '밤',       emoji: '🌰', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 14, seasons: ['가을'],        peak: '가을', blurb: '9~10월 햇밤' },
  { name: '전어',     emoji: '🐟', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['가을'],        peak: '가을', blurb: '"가을 전어 굽는 냄새에 집 나간 며느리 돌아온다"' },
  { name: '버섯',     emoji: '🍄', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 7,  seasons: ['가을'],        peak: '가을', blurb: '표고·느타리 가을이 제철' },

  { name: '귤',       emoji: '🍊', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 14, seasons: ['겨울'],        peak: '겨울', blurb: '12~2월 당도 최고' },
  { name: '굴',       emoji: '🦪', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['겨울'],        peak: '겨울', blurb: '11~2월 통영·거제산 제철' },
  { name: '방어',     emoji: '🐟', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['겨울'],        peak: '겨울', blurb: '겨울 대방어 지방 가득' },
  { name: '무',       emoji: '🥕', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 21, seasons: ['가을', '겨울'], peak: '겨울', blurb: '국·조림 든든한 뿌리' },
  { name: '배추',     emoji: '🥬', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 14, seasons: ['겨울'],        peak: '겨울', blurb: '김장 배추의 계절' },
  { name: '시금치',   emoji: '🥬', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['겨울'],        peak: '겨울', blurb: '겨울 포항초 달큰해요' },

  // 봄 추가
  { name: '쑥',       emoji: '🌿', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['봄'],          peak: '봄',   blurb: '3~4월 쑥국·쑥떡으로' },
  { name: '아스파라거스', emoji: '🌱', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['봄'],          peak: '봄',   blurb: '4~6월 그릴에 살짝' },
  { name: '소라',     emoji: '🐚', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['봄'],          peak: '봄',   blurb: '4~5월 살이 차올라요' },
  { name: '멍게',     emoji: '🦪', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['봄'],          peak: '봄',   blurb: '봄 향 가득' },

  // 여름 추가
  { name: '민어',     emoji: '🐟', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['여름'],        peak: '여름', blurb: '7~8월 서해 민어' },
  { name: '애호박',   emoji: '🥒', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 7,  seasons: ['여름'],        peak: '여름', blurb: '찌개·전에' },
  { name: '오이',     emoji: '🥒', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 7,  seasons: ['여름'],        peak: '여름', blurb: '여름 수분 보충' },
  { name: '가지',     emoji: '🍆', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 7,  seasons: ['여름'],        peak: '여름', blurb: '7~9월 통통해져요' },
  { name: '멜론',     emoji: '🍈', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 10, seasons: ['여름'],        peak: '여름', blurb: '향긋한 여름 과일' },
  { name: '포도',     emoji: '🍇', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['여름', '가을'], peak: '여름', blurb: '8~9월 제철' },

  // 가을 추가
  { name: '송이버섯', emoji: '🍄', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['가을'],        peak: '가을', blurb: '9~10월 최고급 향' },
  { name: '꽁치',     emoji: '🐟', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['가을'],        peak: '가을', blurb: '9~10월 기름 오르는 때' },
  { name: '고등어',   emoji: '🐟', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['가을'],        peak: '가을', blurb: '9~11월 살이 통통' },
  { name: '대하',     emoji: '🦐', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['가을'],        peak: '가을', blurb: '9~10월 대하 축제' },

  // 겨울 추가
  { name: '과메기',   emoji: '🐟', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 5,  seasons: ['겨울'],        peak: '겨울', blurb: '포항 과메기 12~2월' },
  { name: '한라봉',   emoji: '🍊', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 14, seasons: ['겨울'],        peak: '겨울', blurb: '1~3월 제주 제철' },
  { name: '유자',     emoji: '🍋', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 14, seasons: ['겨울'],        peak: '겨울', blurb: '11~1월 유자차로' },
  { name: '대구',     emoji: '🐟', foodCategory: '수산·해산', storageType: '냉장', baseShelfLifeDays: 2,  seasons: ['겨울'],        peak: '겨울', blurb: '12~2월 지리·맑은탕' },
  { name: '연근',     emoji: '🥔', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 14, seasons: ['가을', '겨울'], peak: '겨울', blurb: '조림·튀김에 좋아요' },
  { name: '우엉',     emoji: '🥕', foodCategory: '채소·과일', storageType: '냉장', baseShelfLifeDays: 14, seasons: ['가을', '겨울'], peak: '겨울', blurb: '조림·잡채에' },
  { name: '단호박',   emoji: '🎃', foodCategory: '채소·과일', storageType: '실온', baseShelfLifeDays: 30, seasons: ['가을', '겨울'], peak: '가을', blurb: '수프·범벅에' },
];

/** 현재 계절에 해당하는 제철 식재료. peak 우선 정렬. */
export function currentSeasonalProduce(season: Season, limit = 6): SeasonalProduce[] {
  return SEASONAL_PRODUCE
    .filter((p) => p.seasons.includes(season))
    .sort((a, b) => {
      const aPeak = a.peak === season ? 0 : 1;
      const bPeak = b.peak === season ? 0 : 1;
      return aPeak - bPeak;
    })
    .slice(0, limit);
}

/** 어떤 이름이 현재 계절 제철인지 판정 (tag 용). */
export function isSeasonalProduce(name: string, season: Season): boolean {
  return SEASONAL_PRODUCE.some(
    (p) => p.seasons.includes(season) && (p.name === name || name.includes(p.name)),
  );
}

/** 이름으로 제철 재료를 찾아 구체 이모지를 돌려준다 (예: "딸기" → 🍓). 없으면 null. */
export function lookupSeasonalEmoji(name: string): string | null {
  const hit = SEASONAL_PRODUCE.find(
    (p) => p.name === name || name.includes(p.name),
  );
  return hit?.emoji ?? null;
}
