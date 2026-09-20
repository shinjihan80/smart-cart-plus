/**
 * 소비기한 임계값 단일 소스.
 *
 * 이전엔 화면마다 다른 숫자를 세서 같은 냉장고에 배지가 20·6·1 로 동시에 떴다.
 * - 하단 탭 / 홈 그리드 배지  → "행동이 필요한 수" = SOON (임박)
 * - Hero 한 마디의 최우선 1건 → TODAY (오늘까지) — 배지 아님, 문장용
 *
 * 배지는 전부 SOON 기준으로 통일한다. "보유 총 개수" 는 배지로 쓰지 않는다.
 */

/** 임박 — 배지·알림 기준. calcRemainingDays 값이 이 이하면 "임박". */
export const EXPIRY_SOON_DAYS = 3;

/** 오늘까지 — Hero 최우선 메시지 기준. */
export const EXPIRY_TODAY_DAYS = 1;

/** 표시 문구 — '긴급'·'주의' 혼용 금지, 아래 3단으로만. */
export const EXPIRY_LABEL = {
  over:  '기한 초과',
  today: '오늘까지',
  soon:  '임박',
} as const;

export type ExpiryBucket = 'expired' | 'today' | 'soon' | 'fresh';

/**
 * dDay(calcRemainingDays 결과) → 4단 판정. 홈 배너·인사이트·쇼핑 추천 등
 * "이미 지난 걸 곧 만료로 안내"하던 버그(P0-30)의 근본 원인은 각 화면이
 * `dDay <= 1`/`<= 3` 등을 하한 없이 하드코딩해 음수(이미 지난 날짜)까지
 * "곧 만료"에 섞였던 것 — 이 함수 하나로만 판정해야 재발하지 않는다.
 */
export function classifyExpiry(dDay: number): ExpiryBucket {
  if (dDay < 0) return 'expired';
  if (dDay <= EXPIRY_TODAY_DAYS) return 'today';
  if (dDay <= EXPIRY_SOON_DAYS) return 'soon';
  return 'fresh';
}

/** "곧 만료" 계열 문구·레시피 CTA·재구매 추천에 넣어도 되는지 — expired만 제외. */
export function isUpcoming(dDay: number): boolean {
  return classifyExpiry(dDay) !== 'expired';
}
