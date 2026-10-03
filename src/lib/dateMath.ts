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

/**
 * 오늘 날짜를 "YYYY-MM-DD" 로 — 로컬 기준.
 *
 * `new Date().toISOString().split('T')[0]` 는 UTC 기준이라, 한국(UTC+9)에서는
 * 매일 00:00~09:00 KST 사이 "오늘"이 어제로 찍힌다. 이 시간대에 등록한 식품의
 * purchaseDate 가 하루 전으로 저장되고, 자정 리셋인 줄 알았던 AI 일일 한도가
 * 실제로는 오전 9시에 풀리는 등 — 데이터에 영구히 기록되는 만큼 localMidnight
 * 보다 파급력이 크다 (검토단 E2 발견, N-10 후속).
 */
export function todayLocalStr(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * 서버(API 라우트) 전용 "오늘" — KST 고정 오프셋 기준.
 *
 * `todayLocalStr()`의 `getFullYear()`류 getter는 "실행 환경의 로컬 TZ"를
 * 쓰는데, Vercel 함수는 보통 UTC로 실행돼 거기선 `todayLocalStr()`도
 * `toISOString()`과 똑같이 KST 00~09시에 하루 전으로 찍힌다(P1-85, E2
 * 실측) — 브라우저(클라이언트)에서만 의미가 있던 "로컬 TZ" 가정이 서버
 * 에선 성립하지 않는다. 이 앱은 KST 전용이라 UTC+9를 고정 오프셋으로
 * 더해 날짜만 뽑는다.
 */
export function todayKstStr(d: Date = new Date()): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${kst.getUTCFullYear()}-${p(kst.getUTCMonth() + 1)}-${p(kst.getUTCDate())}`;
}

/** 이번 달을 "YYYY-MM" 으로 — 로컬 기준. */
export function thisMonthLocalStr(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}`;
}

/**
 * 구매일 + 보관 일수 → 만료일("YYYY-MM-DD", 로컬 기준).
 *
 * 식품 카드 접힌 상태가 구매일(`purchaseDate`)을 라벨 없이 📅로만 보여줘
 * 만료일처럼 오인되던 문제(P0-52, 검토단 C1·C9·C8 독립 발견)의 수정 —
 * 같은 계산을 펼친 상세("보관 기한" 행)와 공유해 두 화면이 어긋나지 않게 한다.
 *
 * `item.expiryDate`(사용자가 포장지에서 직접 확인해 확정한 절대 날짜)가
 * 있으면 그 값을 그대로 쓰고 purchaseDate/baseShelfLifeDays는 무시한다 —
 * 상대일수만 저장하던 이전 모델은 확정 후 구매일을 고치면 확정값이 조용히
 * 깨지는 회귀가 있었다(P0-33 재오픈, 검토단 E2·E3 라이브 재현).
 */
export function expiryDateStr(item: { purchaseDate: string; baseShelfLifeDays: number; expiryDate?: string }): string {
  if (item.expiryDate) return item.expiryDate;
  const d = localMidnight(item.purchaseDate);
  d.setDate(d.getDate() + item.baseShelfLifeDays);
  return todayLocalStr(d);
}

/**
 * 만료일 표시용 — 올해면 "09/28", 해가 바뀌면 "2027.08.27".
 *
 * 연도를 늘 지우면 baseShelfLifeDays가 365일을 넘는 품목(간장 730일 등)이
 * "07/27까지"로 찍혀 이미 지난 날짜처럼 읽힌다(P0-55, 검토단 C4·C9 독립 발견).
 */
export function expiryDateLabel(
  item: { purchaseDate: string; baseShelfLifeDays: number; expiryDate?: string },
  today: Date = new Date(),
): string {
  const [y, m, d] = expiryDateStr(item).split('-');
  return Number(y) === today.getFullYear() ? `${m}/${d}` : `${y}.${m}.${d}`;
}
