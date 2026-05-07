import {
  // 식품 카테고리
  Apple, Beef, Fish, Milk, GlassWater, Cookie, CookingPot, UtensilsCrossed, Croissant, Pill, Package,
  // 패션 카테고리
  Shirt, ShoppingBag, Footprints, Glasses, Watch, Gem, Sparkles,
  // 계절
  Flower2, Sun, Leaf, Snowflake,
  // 날씨
  Moon, CloudSun, CloudMoon, Cloud, CloudRain, CloudFog,
  // 기본
  type LucideIcon,
} from 'lucide-react';
import type { FoodCategory, FashionCategory } from '@/types';
import type { Season } from './season';
import type { WeatherCondition } from './weather';

/**
 * 이모지 → Lucide 아이콘 매핑.
 * 인터파크·SSG 스타일의 일관된 라인 아이콘 UI를 위해 사용.
 *
 * 사용처:
 *  - FOOD_EMOJI   → FOOD_ICON
 *  - FASHION_EMOJI → FASHION_ICON
 *  - SEASON_EMOJI → SEASON_ICON
 */

export const FOOD_ICON: Record<FoodCategory, LucideIcon> = {
  '채소·과일':    Apple,
  '정육·계란':    Beef,
  '수산·해산':    Fish,
  '유제품':       Milk,
  '음료':         GlassWater,
  '간식·과자':    Cookie,
  '양념·소스':    CookingPot,
  '면·즉석':      UtensilsCrossed,
  '빵·베이커리':  Croissant,
  '건강식품':     Pill,
  '기타 식품':    Package,
};

export const FASHION_ICON: Record<FashionCategory, LucideIcon> = {
  상의:             Shirt,
  하의:             Shirt,
  아우터:           Shirt,
  원피스:           Shirt,
  신발:             Footprints,
  가방:             ShoppingBag,
  모자:             Shirt,     // Lucide에 hat 없음 — Shirt 대체
  스카프:           Shirt,
  안경:             Glasses,
  선글라스:         Glasses,
  시계:             Watch,
  주얼리:           Gem,
  '기타 액세서리':  Sparkles,
};

export const SEASON_ICON: Record<Season, LucideIcon> = {
  봄:   Flower2,
  여름: Sun,
  가을: Leaf,
  겨울: Snowflake,
};

/** 계절 대표 색 (tailwind 클래스) — 아이콘 + 배지 공통 */
export const SEASON_COLOR: Record<Season, { text: string; bg: string }> = {
  봄:   { text: 'text-pink-500',   bg: 'bg-pink-100'   },
  여름: { text: 'text-amber-500',  bg: 'bg-amber-100'  },
  가을: { text: 'text-orange-600', bg: 'bg-orange-100' },
  겨울: { text: 'text-sky-500',    bg: 'bg-sky-100'    },
};

/**
 * 날씨 컨디션 + 주/야 → Lucide 아이콘.
 * weatherEmoji() 대체용.
 */
export function weatherIcon(condition: WeatherCondition, isDay: boolean): LucideIcon {
  switch (condition) {
    case '맑음':     return isDay ? Sun      : Moon;
    case '구름조금': return isDay ? CloudSun : CloudMoon;
    case '흐림':     return Cloud;
    case '비':       return CloudRain;
    case '눈':       return Snowflake;
    case '안개':     return CloudFog;
  }
}

/** 날씨별 색 — 아이콘 배경·강조에 활용 */
export const WEATHER_COLOR: Record<WeatherCondition, { text: string; bg: string }> = {
  '맑음':     { text: 'text-amber-500',  bg: 'bg-amber-50'  },
  '구름조금': { text: 'text-sky-500',    bg: 'bg-sky-50'    },
  '흐림':     { text: 'text-gray-500',   bg: 'bg-gray-100'  },
  '비':       { text: 'text-sky-600',    bg: 'bg-sky-50'    },
  '눈':       { text: 'text-sky-400',    bg: 'bg-sky-50'    },
  '안개':     { text: 'text-gray-400',   bg: 'bg-gray-100'  },
};
