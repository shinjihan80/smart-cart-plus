'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { isFoodItem } from '@/types';
import { scheduleExpiryNotification, getNotiState } from '@/lib/notificationScheduler';
import { isNative } from '@/lib/native';
import { rescheduleExpiryNotifications } from '@/lib/native/localNotifications';

/**
 * 앱 마운트 후 유통기한 임박 알림을 하루 1회 발송(웹 — Notification API).
 * UI 없음 — Providers 안에 배치.
 */
export default function NotificationScheduler() {
  const { items } = useCart();
  const lastNativeKey = useRef('');

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    const foodItems = items.filter(isFoodItem);
    if (foodItems.length === 0) return;
    // 마운트 후 3초 지연 — 앱 초기 렌더링 완료 후 실행
    const t = setTimeout(() => {
      void scheduleExpiryNotification(foodItems);
    }, 3000);
    return () => clearTimeout(t);
    // items가 hydrate되면 한 번만 실행 (하루 1회 체크는 scheduler 내부에서 처리)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 네이티브 앱 — 아이템이 바뀔 때마다 기기 로컬 알림을 다시 예약(서버 없이
  // OS가 앱이 꺼져 있어도 울려줌). 웹은 대상 아님(위 useEffect가 담당).
  useEffect(() => {
    if (!isNative()) return;
    if (!getNotiState().expiry) return;
    const foodItems = items.filter(isFoodItem);
    const key = foodItems.map((f) => `${f.id}:${f.purchaseDate}:${f.baseShelfLifeDays}`).sort().join('|');
    if (key === lastNativeKey.current) return;
    lastNativeKey.current = key;
    void rescheduleExpiryNotifications(foodItems);
  }, [items]);

  return null;
}
