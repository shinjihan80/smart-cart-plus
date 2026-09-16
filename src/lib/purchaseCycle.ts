/**
 * 같은 식품 이름의 소진→재구매 간격을 분석해
 * "우유는 보통 10일 뒤 떨어져요" 같은 주기 인사이트 제공.
 *
 * 데이터 소스: CartContext의 discardHistory ({name, date}[]).
 * 재구매는 별도 로그가 없어서 discardHistory 내 동일 name의 연속 소진 날짜 간격으로 근사.
 */

import { localMidnight, todayMidnight, daysBetween } from './dateMath';

interface DiscardRecord {
  name:     string;
  category: string;
  date:     string;
}

export interface CycleEstimate {
  name:        string;
  cycleDays:   number;   // 평균 소진 주기 (일)
  occurrences: number;   // 소진 횟수
  lastDate:    string;   // 최근 소진일
  dueInDays:   number;   // 예상 다음 소진까지 남은 일수 (음수면 이미 지남)
}

/**
 * discardHistory에서 같은 이름 2회+ 소진된 식품의 평균 주기를 계산.
 * - 4회+ 소진 데이터면 신뢰도 ↑, 그 미만은 근사치로 표시
 * - 오늘 기준으로 곧 떨어질 것 같은 후보 정렬용
 */
export function estimateCycles(history: DiscardRecord[], minOccurrences = 2): CycleEstimate[] {
  const byName = new Map<string, string[]>();
  for (const h of history) {
    if (h.category !== '식품' || !h.date) continue;
    (byName.get(h.name) ?? byName.set(h.name, []).get(h.name)!).push(h.date);
  }

  const out: CycleEstimate[] = [];
  const today = todayMidnight();

  for (const [name, dates] of byName) {
    const sorted = [...dates].sort();  // 오래된 → 최신
    if (sorted.length < minOccurrences) continue;
    // 간격 합산
    let totalDiff = 0;
    for (let i = 1; i < sorted.length; i += 1) {
      const a = localMidnight(sorted[i - 1]);
      const b = localMidnight(sorted[i]);
      totalDiff += daysBetween(a, b);
    }
    const cycleDays = Math.max(1, Math.round(totalDiff / (sorted.length - 1)));
    const lastDate  = sorted[sorted.length - 1];
    const sinceLast = daysBetween(localMidnight(lastDate), today);
    out.push({
      name,
      cycleDays,
      occurrences: sorted.length,
      lastDate,
      dueInDays: cycleDays - sinceLast,
    });
  }

  // 곧 떨어질 것(dueInDays 작은 것) 먼저, 기록 많은 것 우선
  return out.sort((a, b) => {
    if (a.dueInDays !== b.dueInDays) return a.dueInDays - b.dueInDays;
    return b.occurrences - a.occurrences;
  });
}
