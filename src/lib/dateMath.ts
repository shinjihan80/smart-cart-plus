/**
 * "YYYY-MM-DD" 문자열을 로컬 자정 기준으로 안전하게 파싱한다.
 *
 * `new Date('YYYY-MM-DD')` 는 스펙상 UTC 자정으로 파싱된다. 한국(UTC+9)에서는
 * 이게 로컬 오전 9시가 되고, `today.setHours(0,0,0,0)` 로 만든 로컬 자정
 * 기준 "오늘"과 비교하면 9시간(0.375일) 차이가 생겨 Math.ceil/round 에서
 * 날짜 차이가 하루 더 얹힌다 — 실제 D-1인데 D-2로 표시되는 식.
 * (N-9, 검토단 C8 발견: "만료 하루 전인데 D-2가 뜬다")
 */
export function localMidnight(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayMidnight(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

/** 두 시각(자정 기준) 사이의 정수 일수 차이 — b - a. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
