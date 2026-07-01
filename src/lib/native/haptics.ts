'use client';

import { isNative } from './index';

/** 가벼운 진동 피드백 — 버튼 탭, 체크 등 */
export async function impactLight() {
  if (!isNative()) { vibrate(10); return; }
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

/** 중간 진동 — 확인, 저장 등 */
export async function impactMedium() {
  if (!isNative()) { vibrate(30); return; }
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

/** 강한 진동 — 삭제, 경고 등 */
export async function impactHeavy() {
  if (!isNative()) { vibrate(60); return; }
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Heavy });
}

/** 성공 알림 패턴 */
export async function notifySuccess() {
  if (!isNative()) { vibrate(20); return; }
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Success });
}

/** 웹 폴백 — 짧은 navigator.vibrate */
function vibrate(ms: number) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}
