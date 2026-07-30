import { Capacitor } from '@capacitor/core';

/**
 * AdMob 보상형(리워드) 광고 — 네이티브 앱(iOS/Android)에서만 동작한다.
 * 웹(브라우저)에서는 AdMob 네이티브 SDK 자체가 없어 항상 실패로 처리된다 —
 * 호출부는 실패 시 기존 카카오 애드핏 배너 방식(RewardedAdModal)으로 폴백해야 한다.
 */
const REWARDED_AD_UNIT_ID = 'ca-app-pub-6326696679544206/5888431086';
export const ADMOB_IS_TESTING = false;

let initialized = false;

/**
 * AdMob.initialize()를 최초 1회만 호출한다.
 * 네이티브 쪽에서 배너 뷰 컨테이너(mViewGroup) 설정 등이 이 안에서 이뤄지므로,
 * showBanner·showRewardVideoAd 등 어떤 AdMob 기능을 쓰든 반드시 먼저 호출해야 한다
 * (건너뛰면 네이티브에서 NPE로 크래시함 — 배너 연동 때 실제로 겪은 문제).
 */
export async function ensureAdMobInitialized(): Promise<void> {
  if (initialized) return;
  const { AdMob } = await import('@capacitor-community/admob');
  await AdMob.initialize({ initializeForTesting: ADMOB_IS_TESTING });
  initialized = true;
}

export function isRewardedAdSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * 리워드 영상 광고를 준비→노출하고, 사용자가 끝까지 봐서 실제 보상을 받았는지 여부를 반환한다.
 * 중간에 닫거나 로드 실패 시 false.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!isRewardedAdSupported()) return false;

  const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');

  try {
    await ensureAdMobInitialized();

    let rewarded = false;
    const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      rewarded = true;
    });

    await AdMob.prepareRewardVideoAd({ adId: REWARDED_AD_UNIT_ID, isTesting: ADMOB_IS_TESTING });
    await AdMob.showRewardVideoAd();

    await rewardListener.remove();
    return rewarded;
  } catch (err) {
    console.error('[admob] showRewardedAd 실패:', err);
    return false;
  }
}
