'use client';

import { useEffect } from 'react';
import { maybeShowLaunchRewardAd } from '@/lib/launchMilestone';

/** 앱 실행마다 1회 호출 — 3번째 실행마다 리워드 광고를 노출한다. 렌더링할 UI 없음. */
export default function LaunchRewardAdTrigger() {
  useEffect(() => {
    maybeShowLaunchRewardAd();
  }, []);

  return null;
}
