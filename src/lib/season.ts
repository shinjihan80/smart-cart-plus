import type { WeatherTag } from '@/types';
import { todayLocalStr } from './dateMath.ts';

export type Season = '봄' | '여름' | '가을' | '겨울';

const SEASONS: readonly Season[] = ['봄', '여름', '가을', '겨울'];

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

/**
 * 올해 해당 계절의 시작일(1일)을 YYYY-MM-DD로 돌려준다.
 * 봄 3월, 여름 6월, 가을 9월, 겨울 12월 기준.
 */
export function seasonStart(season: Season, year = new Date().getFullYear()): string {
  const month = season === '봄' ? 3 : season === '여름' ? 6 : season === '가을' ? 9 : 12;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * 등록일 이후 이 옷의 계절이 최소 1회는 지나갔는지(=입을 기회가 있었는지).
 *
 * 옷장 정리 제안 게이팅(P0-60 후속, 전문단 E1)에서 쓴다: 등록한 지 얼마 안 된
 * 옷은 착용 로그가 없는 게 당연한데, 그중에서도 "아직 그 옷의 계절이 오지
 * 않아 입을 기회 자체가 없었던" 경우까지 정리 후보로 올리면 더 억울하다.
 *
 * - 등록일이 없는 레거시 아이템 → true (게이트 미적용, 기존 동작 유지).
 * - 계절 태그가 없는 옷(계절 무관) → true (계절 조건 자체가 해당 없음).
 * - 지금이 이미 그 옷의 계절이면 → true (등록 시점부터 바로 입을 기회가 있었음).
 * - 그 외에는 등록일 이후로 그 계절의 시작일(1일)이 한 번이라도 지났으면 true.
 */
export function hasSeasonCycled(
  tags: WeatherTag[] | undefined,
  registeredAt: string | undefined,
  today: Date = new Date(),
): boolean {
  if (!registeredAt) return true;

  const seasons = (tags ?? []).filter((t): t is Season => (SEASONS as readonly string[]).includes(t));
  if (seasons.length === 0) return true;

  if (seasons.includes(currentSeasonByMonth(today))) return true;

  const todayStr = todayLocalStr(today);
  const year = today.getFullYear();
  return seasons.some((season) =>
    [year, year - 1].some((y) => {
      const start = seasonStart(season, y);
      return start > registeredAt && start <= todayStr;
    }),
  );
}
