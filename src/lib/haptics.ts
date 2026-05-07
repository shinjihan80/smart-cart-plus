/**
 * 햅틱 피드백 공용 헬퍼.
 * - 의미별 상수로 통일 (ms 숫자 리터럴 흩어지지 않게)
 * - iOS 구 사파리 등 navigator.vibrate 미지원 환경에서 조용히 실패
 */

export const HAPTIC: {
  tap:     number;
  toggle:  number;
  action:  number;
  success: number[];
} = {
  /** 선택·탭 피드백 — 10ms 가볍게 */
  tap:     10,
  /** 토글·추가 확인 — 15ms */
  toggle:  15,
  /** 스와이프 완료·삭제 — 30ms */
  action:  30,
  /** 타이머 완료 등 중요 이벤트 — 3-pulse */
  success: [200, 80, 200],
};

type HapticName = keyof typeof HAPTIC;

const HAPTIC_ENABLED_KEY = 'nemoa-haptic-enabled';

export function isHapticEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(HAPTIC_ENABLED_KEY);
    return stored === null ? true : stored === '1';
  } catch { return true; }
}

export function setHapticEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HAPTIC_ENABLED_KEY, enabled ? '1' : '0');
  } catch { /* 조용히 실패 */ }
}

export function haptic(name: HapticName): void {
  try {
    if (!isHapticEnabled()) return;
    const pattern = HAPTIC[name];
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate(pattern);
  } catch { /* 조용히 실패 */ }
}
