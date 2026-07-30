import { showRewardedAd, isRewardedAdSupported } from './admob';

/**
 * 냉장고·옷장 인스턴스(예: "냉장고 1", "냉장고 2"…)를 3번째부터 새로 만들 때마다
 * AdMob 리워드 영상 광고를 강제 노출한다. 처음 2개(기본 1개 + 추가 1개)까지는
 * 무료로 광고 없이 만들 수 있고, 3번째부터는 만들 때마다 노출.
 * 보상은 없음. 네이티브 앱에서만 동작.
 */
const FREE_INSTANCE_LIMIT = 2;

/**
 * currentCount: 생성 버튼을 누른 시점의 "생성 전" 인스턴스 개수.
 * 이 값이 FREE_INSTANCE_LIMIT 이상이면(=이번에 만드는 게 3번째 이상이면) 광고를 노출한다.
 */
export function maybeShowInstanceCreateAd(currentCount: number): void {
  if (!isRewardedAdSupported()) return;
  if (currentCount >= FREE_INSTANCE_LIMIT) {
    showRewardedAd();
  }
}
