'use client';

import { calcRemainingDays } from '@/components/FoodTags';
import type { FoodItem } from '@/types';

export interface NotiState { expiry: boolean; codi: boolean; deal: boolean }

const NOTI_KEY      = 'smart-cart-noti';
const CHECKED_KEY   = 'nemoa-noti-checked-date'; // 하루 1회 체크
const PERM_KEY      = 'nemoa-noti-permission';

/** localStorage에서 알림 설정 읽기 */
export function getNotiState(): NotiState {
  try {
    const raw = localStorage.getItem(NOTI_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { expiry: p.expiry ?? true, codi: p.codi ?? true, deal: p.deal ?? false };
    }
  } catch { /* ignore */ }
  return { expiry: true, codi: true, deal: false };
}

/** Notification 권한 요청 */
export async function requestPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  const result = await Notification.requestPermission();
  localStorage.setItem(PERM_KEY, result);
  return result === 'granted';
}

/** Service Worker를 통해 알림 표시 (background-safe) */
async function showNotification(title: string, body: string, tag: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      tag,
      icon:   '/icon-192.png',
      badge:  '/icon-192.png',
      data:   { url: '/' },
    });
  } catch {
    // SW showNotification 실패 시 인앱 Notification 폴백
    if (document.visibilityState !== 'visible') return;
    new Notification(title, { body, tag, icon: '/icon-192.png' });
  }
}

/**
 * 유통기한 임박 식품 알림.
 * 하루에 한 번만 실행. D-1·D-Day 항목 존재 시 알림 발송.
 */
export async function scheduleExpiryNotification(foodItems: FoodItem[]) {
  if (!getNotiState().expiry) return;

  const today = new Date().toDateString();
  if (localStorage.getItem(CHECKED_KEY) === today) return;
  localStorage.setItem(CHECKED_KEY, today);

  if (!(await requestPermission())) return;

  const urgent = foodItems.filter((item) => {
    const d = calcRemainingDays(item.purchaseDate, item.baseShelfLifeDays);
    return d >= 0 && d <= 1;
  });
  if (urgent.length === 0) return;

  const names = urgent.slice(0, 3).map((i) => i.name).join(', ');
  const more  = urgent.length > 3 ? ` 외 ${urgent.length - 3}개` : '';
  await showNotification(
    `⏰ 오늘 소비해야 할 식품 ${urgent.length}개`,
    `${names}${more}`,
    'nemoa-expiry',
  );
}

/**
 * 날씨·코디 알림 (오전 8시 이후 하루 1회).
 * 텍스트만 전달 — 날씨 데이터는 호출자가 조합해 넘긴다.
 */
export async function scheduleCodiNotification(message: string) {
  if (!getNotiState().codi) return;
  if (!(await requestPermission())) return;
  await showNotification('👗 오늘의 코디 추천', message, 'nemoa-codi');
}
