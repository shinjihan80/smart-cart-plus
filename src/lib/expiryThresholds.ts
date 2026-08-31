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
