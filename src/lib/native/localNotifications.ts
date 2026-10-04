'use client';

import { isNative } from './index';
import type { FoodItem } from '@/types';
import { getRemainingDays } from '@/lib/expirySelectors';
import { expiryDateStr, localMidnight } from '@/lib/dateMath';

// Android 앱당 예약 알림 상한(~500건) 안에 여유 있게 들어오도록, 가까운
// 품목부터 이 개수만 예약한다(품목당 알림 최대 2건이므로 실제 상한은
// 이 값의 2배 이하).
const MAX_SCHEDULED_ITEMS = 60;

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
 * 보관 기한 전날·당일 오전 9시에 로컬 알림을 예약한다. 서버 없이 기기
 * 안에서만 처리 — 앱이 로컬 전용 저장을 약속하고 있어(P0-12) 서버로
 * 식품 데이터를 보내는 진짜 푸시(FCM/APNs) 대신 선택.
 *
 * 예전엔 예약 시점의 dDay 스냅샷으로 "임박(today/soon) 버킷 안"인
 * 품목만 걸러 예약했다 — D-4 이상은 애초에 예약 자체가 안 됐고,
 * "나중에 재계산"은 아이템 데이터가 바뀌거나 앱을 다시 열 때만
 * 일어나서, 10일짜리 식품을 넣고 앱을 안 열면 알림이 영원히 안
 * 왔다. 본문도 예약 시점 dDay로 고정돼 D-3 품목이 실제 D-1이 되는
 * 날 "D-3"이라고 울렸다(P0-70, E2 코드 확인).
 *
 * 절대 만료일 기준으로 바꿔 스냅샷 문제 자체를 없앤다 — 모든 식품에
 * 대해 "만료 전날 09시(내일까지예요)"·"만료 당일 09시(오늘까지예요)"
 * 두 알림을 한 번에 미리 예약해 두면, 그 사이 앱을 한 번도 안 열어도
 * 정확한 시각에 정확한 문구로 울린다. 이미 지난 시각은 건너뛴다.
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
  // 가까운 만료일부터 — Android 예약 상한을 넘지 않도록 먼 미래 품목은
  // 이번 예약에서 제외한다(그 품목이 임박 창에 들어오면, items 변경
  // 감지로 다음 reschedule 때 자연히 포함된다).
  const sorted = [...foodItems]
    .filter((item) => getRemainingDays(item) >= 0)
    .sort((a, b) => getRemainingDays(a) - getRemainingDays(b))
    .slice(0, MAX_SCHEDULED_ITEMS);

  const candidates = sorted.flatMap((item) => {
    const expiry = localMidnight(expiryDateStr(item));
    const notifs: { id: number; title: string; body: string; schedule: { at: Date } }[] = [];

    const dayBefore = new Date(expiry);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(9, 0, 0, 0);
    if (dayBefore.getTime() > now.getTime()) {
      notifs.push({
        id:       hashId(`${item.id}:before`),
        title:    `⏰ "${item.name}" 보관 기한이 곧 끝나요`,
        body:     '내일까지예요. 냉장고에서 확인해보세요.',
        schedule: { at: dayBefore },
      });
    }

    const dayOf = new Date(expiry);
    dayOf.setHours(9, 0, 0, 0);
    if (dayOf.getTime() > now.getTime()) {
      notifs.push({
        id:       hashId(`${item.id}:of`),
        title:    `⏰ "${item.name}" 보관 기한이 곧 끝나요`,
        body:     '오늘까지예요. 냉장고에서 확인해보세요.',
        schedule: { at: dayOf },
      });
    }

    return notifs;
  });

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
