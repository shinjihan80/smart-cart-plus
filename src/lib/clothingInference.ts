import { FASHION_GROUP, type FashionCategory, type Thickness, type WeatherTag } from '@/types';

/**
 * AI가 weatherTags를 누락했거나 허용값 정제 후 0개일 때,
 * thickness·category·lining을 기반으로 최소 1개를 추론해 반환한다.
 *
 * 설계:
 * - 액세서리·신발·가방(FASHION_GROUP !== '의류')은 계절 영향이 낮아 빈 배열 반환
 * - 아우터는 두께 얇음/보통/두꺼움에 따라 봄가을 vs 가을겨울
 * - 상의·하의·원피스는 두께 기반: 얇음→봄여름, 두꺼움→가을겨울, 보통→봄가을
 * - lining(안감) 있는 두꺼움은 [겨울] 단독
 */
export function inferWeatherTagsFallback(
  thickness: Thickness,
  category: FashionCategory,
  lining?: boolean,
): WeatherTag[] {
  if (FASHION_GROUP[category] !== '의류') return [];
  if (category === '아우터') {
    return thickness === '얇음' ? ['봄', '가을'] : ['가을', '겨울'];
  }
  switch (thickness) {
    case '얇음':   return ['봄', '여름'];
    case '두꺼움': return lining ? ['겨울'] : ['가을', '겨울'];
    default:       return ['봄', '가을'];
  }
}

export const VALID_WEATHER_TAGS: readonly WeatherTag[] = ['봄', '여름', '가을', '겨울', '우천', '맑음'];

/** 원본 배열에서 허용값만 걸러 반환. */
export function sanitizeWeatherTags(raw: unknown): WeatherTag[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is WeatherTag => VALID_WEATHER_TAGS.includes(t as WeatherTag));
}
