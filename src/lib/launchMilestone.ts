import { showForcedMilestoneAd, isRewardedAdSupported } from './admob';
import { beginLaunchSession } from './adFrequency';

/**
 * 앱을 "실행"할 때마다 누적 카운트하고, 3의 배수(3, 6, 9…)번째 실행마다
 * AdMob 리워드 영상 광고를 노출한다 — 예전 카카오 전면광고("3번째 실행마다")를
 * 대체하는 리워드 광고 버전. 보상은 없음, 네이티브 앱에서만 동작.
 *
 * "실행" 판정: 원격 WebView 는 새로고침·백그라운드 복귀에도 페이지가 다시 로드되므로
 * 마지막 실행에서 30분이 지나야 새 실행으로 센다(beginLaunchSession). 이렇게 안 하면
 * 새로고침 3번에 광고가 떴다.
 *
 * 동의(온보딩) 전 실행은 카운트하지 않는다 — 예전 InterstitialAd와 동일한 규칙.
 * 최종 노출 여부는 showForcedMilestoneAd 쪽 쿨다운·일일 상한도 함께 통과해야 한다.
 */
const CONSENT_KEY = 'nemoa-consent-v1';
const SHOW_EVERY_N = 3;

let checkedThisSession = false;

export function maybeShowLaunchRewardAd(): void {
  if (typeof window === 'undefined') return;
  if (checkedThisSession) return; // JS 컨텍스트당 1회만
  if (!isRewardedAdSupported()) return;
  if (!localStorage.getItem(CONSENT_KEY)) return; // 온보딩 전이면 카운트 안 함

  checkedThisSession = true;

  const count = beginLaunchSession();
  if (count === null) return;             // 새로고침·복귀 — 실행 아님
  if (count % SHOW_EVERY_N !== 0) return;

  showForcedMilestoneAd();
}
