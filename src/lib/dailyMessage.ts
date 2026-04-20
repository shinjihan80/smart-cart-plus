import { isFoodItem, isClothingItem, FASHION_GROUP, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import type { WeatherSnapshot } from '@/lib/weather';
import type { WearLog } from '@/lib/wearLog';
import type { CookLog } from '@/lib/recipeCookLog';
import { daysSince } from '@/lib/wearLog';
import { analyzeBalance } from '@/lib/nutritionAnalysis';
import { RECIPES, SEASON_EMOJI } from '@/lib/recipes';
import { currentSeasonByMonth, matchesSeason } from '@/lib/season';
import { SEASONAL_PRODUCE, isSeasonalProduce } from '@/lib/seasonalProduce';

export type MessagePriority = 'urgent' | 'insight' | 'gentle';

export interface DailyMessage {
  emoji:    string;
  text:     string;
  priority: MessagePriority;
  cta?:     { label: string; href: string };
}

/**
 * 여러 시그널을 우선순위대로 평가해 네모아가 할 "하나의" 메시지를 뽑는다.
 * urgent (긴급) > insight (발견) > gentle (일상) 순.
 * 결정성을 위해 하루 내에는 같은 시그널이 반복 우선되더라도 단일 메시지만 노출.
 */
export function pickDailyMessage(
  items: CartItem[],
  weather: WeatherSnapshot | null,
  wearLog: WearLog,
  cookLog: CookLog = {},
  favorites: readonly string[] = [],
  shoppingCount = 0,
): DailyMessage {
  const foods    = items.filter(isFoodItem);
  const clothes  = items.filter(isClothingItem);
  const hour     = new Date().getHours();
  const dow      = new Date().getDay();  // 0: Sun, 6: Sat

  // ── 1. 긴급 — 바로 행동 유도 ─────────────────────────────────────────────
  const expiringToday = foods.filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 1,
  );
  if (expiringToday.length > 0) {
    const firstName = expiringToday[0].name;
    const extra = expiringToday.length > 1 ? ` 외 ${expiringToday.length - 1}개` : '';
    return {
      emoji:    '⚠️',
      text:     `${firstName}${extra}이(가) 오늘 내로 소비가 필요해요. 레시피로 활용해볼까요?`,
      priority: 'urgent',
      cta:      { label: '레시피 찾기', href: '/fridge' },
    };
  }

  if (weather?.condition === '비' || weather?.condition === '눈') {
    const word = weather.condition === '비' ? '비' : '눈';
    return {
      emoji:    weather.condition === '비' ? '☔' : '❄️',
      text:     `오늘 ${word}가 와요. 우산과 방수 신발 챙기세요.`,
      priority: 'urgent',
      cta:      { label: '옷장 열기', href: '/closet' },
    };
  }

  // 계절 보관 중인 옷 중 현재 계절에 맞는 게 있으면 꺼내라 알림
  const season = currentSeasonByMonth();
  const dueToUnstow = clothes.filter(
    (c) => c.hibernating
      && FASHION_GROUP[c.category] === '의류'
      && matchesSeason(c.weatherTags, season) === true,
  );
  if (dueToUnstow.length > 0) {
    const seasonEmoji = season === '봄' ? '🌸' : season === '여름' ? '☀️' : season === '가을' ? '🍂' : '❄️';
    return {
      emoji:    seasonEmoji,
      text:     `${season}이 왔어요! 보관해뒀던 ${season}철 옷 ${dueToUnstow.length}벌을 꺼낼 때예요.`,
      priority: 'insight',
      cta:      { label: '꺼내기', href: '/mypage' },
    };
  }

  // ── 2. 인사이트 — 발견/제안 ──────────────────────────────────────────────
  if (foods.length > 0) {
    const balance = analyzeBalance(foods);
    if (balance.coverage.protein < 0.3 && balance.proteinCount < 2) {
      return {
        emoji:    '🥩',
        text:     '이번 주 단백질이 부족해 보여요. 두부·달걀·닭가슴살을 추가해볼까요?',
        priority: 'insight',
        cta:      { label: '냉장고 확인', href: '/fridge' },
      };
    }
    if (balance.vegFruitCount < 2) {
      return {
        emoji:    '🥬',
        text:     '채소·과일이 조금 부족해요. 샐러드 재료를 장 볼 시간이에요.',
        priority: 'insight',
        cta:      { label: '냉장고 확인', href: '/fridge' },
      };
    }
  }

  // 최근 7일 내 자주 만든 레시피 (3번 이상) — 또 만들기 제안
  if (Object.keys(cookLog).length > 0) {
    const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentFrequent = Object.entries(cookLog)
      .map(([id, dates]) => {
        const recent = Array.isArray(dates) ? dates.filter((d) => new Date(d).getTime() >= weekAgoMs) : [];
        return { id, recentCount: recent.length };
      })
      .filter((x) => x.recentCount >= 3)
      .sort((a, b) => b.recentCount - a.recentCount);
    if (recentFrequent.length > 0) {
      const recipe = RECIPES.find((r) => r.id === recentFrequent[0].id);
      if (recipe) {
        return {
          emoji:    recipe.emoji,
          text:     `이번 주 ${recipe.name}을(를) ${recentFrequent[0].recentCount}번 만드셨네요! 또 어떠세요?`,
          priority: 'insight',
          cta:      { label: '냉장고 열기', href: '/fridge' },
        };
      }
    }
  }

  // 즐겨찾기 했는데 아직 만들어보지 않은 레시피 — 도전 제안
  const unmadeFavorite = favorites.find((id) => {
    const dates = cookLog[id];
    return !dates || dates.length === 0;
  });
  if (unmadeFavorite) {
    const recipe = RECIPES.find((r) => r.id === unmadeFavorite);
    if (recipe) {
      return {
        emoji:    recipe.emoji,
        text:     `즐겨찾기해둔 "${recipe.name}"을(를) 아직 안 만들어봤어요. 오늘 도전해볼까요?`,
        priority: 'insight',
        cta:      { label: '냉장고 열기', href: '/fridge' },
      };
    }
  }

  // 제철 재료 ― 지금 피크인데 보유 없음 (장보기 유도)
  const peakNames = SEASONAL_PRODUCE
    .filter((p) => p.peak === season)
    .map((p) => p.name);
  const peakHave = foods.some((f) => peakNames.some((n) => f.name.includes(n)));
  if (!peakHave && peakNames.length > 0) {
    const sample = peakNames.slice(0, 3).join('·');
    return {
      emoji:    SEASON_EMOJI[season],
      text:     `지금이 ${sample} 제철 피크예요. 이번 주 한 번 장 보러 가볼까요?`,
      priority: 'insight',
      cta:      { label: '제철 보기', href: '/fridge' },
    };
  }

  // 보유 중 제철 식품 — 이번 주 안에 먹기 유도
  const inSeasonOwned = foods.filter((f) => isSeasonalProduce(f.name, season));
  if (inSeasonOwned.length > 0) {
    const f = inSeasonOwned[0];
    return {
      emoji:    SEASON_EMOJI[season],
      text:     `"${f.name}"이(가) 지금 제철이에요. 가장 맛있을 때 드셔보세요.`,
      priority: 'insight',
      cta:      { label: '레시피 찾기', href: '/fridge' },
    };
  }

  // 쇼핑 리스트 대기 — 주말 아침엔 행동 유도, 평일엔 살짝 알림
  if (shoppingCount >= 3) {
    const isWeekend = dow === 0 || dow === 6;
    const isMorning = hour >= 8 && hour < 12;
    if (isWeekend && isMorning) {
      return {
        emoji:    '🛒',
        text:     `장볼 거 ${shoppingCount}개가 기다려요. 오늘 한번에 처리해볼까요?`,
        priority: 'insight',
        cta:      { label: '쇼핑 리스트', href: '/mypage' },
      };
    }
    if (shoppingCount >= 5) {
      return {
        emoji:    '🛒',
        text:     `쇼핑 리스트에 ${shoppingCount}개가 쌓였어요. 슬슬 장 보러 갈 때예요.`,
        priority: 'insight',
        cta:      { label: '쇼핑 리스트', href: '/mypage' },
      };
    }
  }

  // 30일 이상 안 입은 옷이 있으면 재발견 제안
  const longIdle = clothes
    .filter((c) => FASHION_GROUP[c.category] === '의류')
    .map((c) => {
      const dates = wearLog[c.id] ?? [];
      const idle = dates.length > 0 ? daysSince(dates[0]) : 0;
      return { item: c, idle, hasRecord: dates.length > 0 };
    })
    .filter((x) => x.hasRecord && x.idle >= 30)
    .sort((a, b) => b.idle - a.idle);

  if (longIdle.length > 0) {
    const { item, idle } = longIdle[0];
    return {
      emoji:    '🌙',
      text:     `"${item.name}"을(를) ${idle}일째 안 입었어요. 오늘 한번 꺼내볼까요?`,
      priority: 'insight',
      cta:      { label: '옷장 열기', href: '/closet' },
    };
  }

  // 날씨 기반 옷차림 조언
  if (weather) {
    if (weather.tempC >= 28) {
      return { emoji: '☀️', text: `오늘 ${weather.tempC}°예요. 얇고 시원한 옷이 좋을 것 같아요.`, priority: 'insight', cta: { label: '옷장 열기', href: '/closet' } };
    }
    if (weather.tempC <= 5) {
      return { emoji: '🧥', text: `오늘 ${weather.tempC}°, 쌀쌀해요. 두꺼운 외투를 챙기세요.`, priority: 'insight', cta: { label: '옷장 열기', href: '/closet' } };
    }
  }

  // ── 3. Gentle — 시간대 일상 인사 ─────────────────────────────────────────
  if (hour < 10) {
    return { emoji: '☕', text: '좋은 아침이에요. 오늘도 잘 챙겨드세요.',        priority: 'gentle' };
  }
  if (hour < 14) {
    return { emoji: '🍱', text: '점심 시간이에요. 냉장고에 맛있는 거 있나요?',    priority: 'gentle', cta: { label: '냉장고 확인', href: '/fridge' } };
  }
  if (hour < 19) {
    return { emoji: '🌤️', text: '오후 햇살이 좋네요. 잠깐 산책은 어떠세요?',     priority: 'gentle' };
  }
  return   { emoji: '🌙', text: '하루 수고하셨어요. 내일을 위해 푹 쉬세요.',      priority: 'gentle' };
}
