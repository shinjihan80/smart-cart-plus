import type { WeatherTag } from '@/types';

export type Season = '봄' | '여름' | '가을' | '겨울';

/** 현재 월로 계절 추정 (날씨 API 없을 때 기본 폴백). */
export function currentSeasonByMonth(date: Date = new Date()): Season {
  const m = date.getMonth() + 1;
  if (m === 12 || m <= 2) return '겨울';
  if (m <= 5)             return '봄';
  if (m <= 8)             return '여름';
  return '가을';
}

/**
 * 옷 weatherTags가 해당 계절과 맞는지.
 * 태그가 없으면 null(불명) → 보관 후보 아님.
 */
export function matchesSeason(tags: WeatherTag[] | undefined, season: Season): boolean | null {
  if (!tags || tags.length === 0) return null;
  return tags.includes(season);
}
