/**
 * 시간대 구간 단일 소스.
 *
 * 이전에는 HeroMessage / DailyBriefing / dailyMessage 세 곳이 각자 다른 경계
 * (10시·12시 / 6·9·12·15·18·21시 / 10·14·19시)를 써서 "3시에 좋은 아침" 같은
 * 어긋남이 났다. 인사말·아이콘·본문이 이제 전부 이 함수를 통한다.
 *
 * ⚠️ SSR 주의: getDaypart() 는 서버 렌더 시 빌드/서버 시간으로 평가된다.
 * 시간대 의존 UI는 마운트 후에만 렌더할 것 (React hydration mismatch 방지).
 */

export type Daypart = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

/** 로컬 시각 기준 시간대 구간. */
export function getDaypart(date: Date = new Date()): Daypart {
  const h = date.getHours();
  if (h < 5)  return 'dawn';
  if (h < 11) return 'morning';
  if (h < 14) return 'noon';
  if (h < 18) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}

/** 인사말 한 줄. */
export function greetingText(part: Daypart): string {
  switch (part) {
    case 'dawn':      return '새벽이에요';
    case 'morning':   return '좋은 아침이에요';
    case 'noon':      return '점심 시간이에요';
    case 'afternoon': return '나른한 오후예요';
    case 'evening':   return '저녁이에요';
    case 'night':     return '밤이 깊었어요';
  }
}
