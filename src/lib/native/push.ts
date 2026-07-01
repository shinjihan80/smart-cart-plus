'use client';

import { isNative } from './index';

export interface PushToken {
  value:    string;
  platform: 'apns' | 'fcm' | 'web';
}

/**
 * 푸시 알림 권한 요청 + 토큰 등록.
 * - 네이티브: @capacitor/push-notifications (APNs / FCM)
 * - 웹: Web Push API (VAPID — NEXT_PUBLIC_VAPID_PUBLIC_KEY 필요)
 */
export async function registerPush(): Promise<PushToken | null> {
  if (isNative()) {
    return registerNativePush();
  }
  return registerWebPush();
}

async function registerNativePush(): Promise<PushToken | null> {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return null;

  await PushNotifications.register();

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'apns' : 'fcm';
      resolve({ value: token.value, platform });
    });
    PushNotifications.addListener('registrationError', () => resolve(null));
    // 5초 타임아웃
    setTimeout(() => resolve(null), 5000);
  });
}

async function registerWebPush(): Promise<PushToken | null> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return null;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return null;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  return { value: JSON.stringify(sub.toJSON()), platform: 'web' };
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  const buf     = new ArrayBuffer(raw.length);
  const view    = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

/** 앱 포그라운드에서 수신된 알림 리스너 등록 (네이티브 전용) */
export async function listenPushReceived(cb: (title: string, body: string) => void) {
  if (!isNative()) return;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  PushNotifications.addListener('pushNotificationReceived', (n) => {
    cb(n.title ?? '', n.body ?? '');
  });
}
