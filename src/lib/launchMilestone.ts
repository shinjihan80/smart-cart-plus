import { showRewardedAd, isRewardedAdSupported } from './admob';

/**
 * 앱을 실행할 때마다 누적 카운트하고, 3의 배수(3, 6, 9…)번째 실행마다
 * AdMob 리워드 영상 광고를 강제 노출한다 — 예전 카카오 전면광고
 * ("3번째 실행마다")를 대체하는 리워드 광고 버전.
 * 보상은 없음, 네이티브 앱에서만 동작.
 * 동의(온보딩) 전 실행은 카운트하지 않는다 — 예전 InterstitialAd와 동일한 규칙.
 */
const CONSENT_KEY = 'nemoa-consent-v1';
const LAUNCH_COUNT_KEY = 'nemoa-launch-count';
const SHOW_EVERY_N = 3;

let checkedThisSession = false;

export function maybeShowLaunchRewardAd(): void {
  if (typeof window === 'undefined') return;
  if (checkedThisSession) return; // 세션(앱 프로세스)당 1회만 카운트
  if (!isRewardedAdSupported()) return;
  if (!localStorage.getItem(CONSENT_KEY)) return; // 온보딩 전이면 카운트 안 함

  checkedThisSession = true;

  const raw = localStorage.getItem(LAUNCH_COUNT_KEY);
  const prev = raw ? parseInt(raw, 10) : 0;
  const count = (Number.isFinite(prev) ? prev : 0) + 1;
  localStorage.setItem(LAUNCH_COUNT_KEY, String(count));

  if (count % SHOW_EVERY_N === 0) {
    showRewardedAd();
  }
}
