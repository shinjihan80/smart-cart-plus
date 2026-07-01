'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { isFoodItem } from '@/types';
import { scheduleExpiryNotification } from '@/lib/notificationScheduler';

/**
 * 앱 마운트 후 유통기한 임박 알림을 하루 1회 발송.
 * UI 없음 — Providers 안에 배치.
 */
export default function NotificationScheduler() {
  const { items } = useCart();

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

  return null;
}
