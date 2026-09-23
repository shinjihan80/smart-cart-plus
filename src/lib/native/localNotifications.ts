'use client';

import { isNative } from './index';
import type { FoodItem } from '@/types';
import { getRemainingDays } from '@/lib/expirySelectors';
import { classifyExpiry } from '@/lib/expiryThresholds';

const SCHEDULED_IDS_KEY = 'nemoa-local-noti-ids';

/**
 * 문자열 id를 32bit 양수 정수로 — LocalNotifications는 숫자 id만 받는다.
 * 매번 같은 아이템은 같은 id로 매핑돼야 취소·재예약이 정확하다.
 */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 2147483646) + 1; // 0 회피 (일부 OS에서 id 0 예약 실패)
}

export async function requestLocalNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  } catch {
    return false;
  }
}

export async function hasLocalNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    return perm.display === 'granted';
  } catch {
    return false;
  }
}

/** 'granted' | 'denied' | 'default' — 설정 화면 배너 분기용 (web Notification.permission과 맞춘 3단) */
export async function getLocalNotificationPermissionState(): Promise<'granted' | 'denied' | 'default'> {
  if (!isNative()) return 'default';
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') return 'granted';
    if (perm.display === 'denied') return 'denied';
    return 'default';
  } catch {
    return 'default';
  }
}

/**
 * 보관 기한이 임박한 식품마다 D-1 오전 9시(이미 D-1 이하면 1분 뒤) 로컬 알림을
 * 예약한다. 서버 없이 기기 안에서만 처리 — 앱이 로컬 전용 저장을 약속하고
 * 있어(P0-12) 서버로 식품 데이터를 보내는 진짜 푸시(FCM/APNs) 대신 선택.
 *
 * 호출할 때마다 이전에 예약한 것부터 전부 취소하고 현재 아이템 기준으로
 * 다시 만든다 — 아이템을 지우거나 날짜를 고쳐도 낡은 알림이 안 남는다.
 */
export async function rescheduleExpiryNotifications(foodItems: readonly FoodItem[]): Promise<void> {
  if (!isNative()) return;

  let LocalNotifications: typeof import('@capacitor/local-notifications').LocalNotifications;
  try {
    ({ LocalNotifications } = await import('@capacitor/local-notifications'));
  } catch {
    return;
  }

  const granted = await hasLocalNotificationPermission();
  if (!granted) return;

  await cancelAllExpiryNotifications();

  const now = new Date();
  const candidates = foodItems
    .map((item) => {
      const dDay = getRemainingDays(item);
      const bucket = classifyExpiry(dDay);
      if (bucket !== 'today' && bucket !== 'soon') return null; // 임박 창 밖 — 나중에 재계산됨
      const fireAt = new Date();
      fireAt.setDate(fireAt.getDate() + Math.max(dDay - 1, 0));
      fireAt.setHours(9, 0, 0, 0);
      if (fireAt.getTime() <= now.getTime()) fireAt.setMinutes(fireAt.getMinutes() + 1);
      return {
        id:       hashId(item.id),
        title:    dDay <= 0 ? `⏰ "${item.name}" 보관 기한이 지났어요` : `⏰ "${item.name}" 보관 기한이 곧 끝나요`,
        body:     dDay <= 0 ? '냉장고에서 확인해주세요.' : `D-${dDay} — 오늘 안에 확인해보세요.`,
        schedule: { at: fireAt },
      };
    })
    .filter((n): n is NonNullable<typeof n> => n !== null);

  if (candidates.length > 0) {
    await LocalNotifications.schedule({ notifications: candidates });
  }
  try {
    localStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(candidates.map((n) => n.id)));
  } catch { /* ignore */ }
}

export async function cancelAllExpiryNotifications(): Promise<void> {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const raw = localStorage.getItem(SCHEDULED_IDS_KEY);
    const ids: number[] = raw ? JSON.parse(raw) : [];
    if (ids.length > 0) {
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    }
    localStorage.removeItem(SCHEDULED_IDS_KEY);
  } catch { /* ignore */ }
}
