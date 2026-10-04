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
  const lastWebKey = useRef('');
  const hasRunWebOnce = useRef(false);

  // P2-49 — 마운트 시 1회만 실행하면, 그날 처음 열었을 때 임박 품목이
  // 없거나 권한이 없어 발송이 안 됐을 경우 같은 세션에서 나중에 품목을
  // 등록해도 다시 검사하지 않았다(E2 코드 확인, "알림이 고장났다"로
  // 오인). scheduleExpiryNotification 자체가 이미 하루 1회 발송 성공
  // 가드를 내부에 갖고 있으므로(CHECKED_KEY), items가 바뀔 때마다 다시
  // 불러도 안전 — 네이티브 쪽과 동일한 key 비교로 같은 구성이면 재호출을
  // 건너뛴다.
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    const foodItems = items.filter(isFoodItem);
    if (foodItems.length === 0) return;
    const key = foodItems.map((f) => `${f.id}:${f.purchaseDate}:${f.baseShelfLifeDays}`).sort().join('|');
    if (key === lastWebKey.current) return;
    lastWebKey.current = key;
    // 마운트 직후 첫 실행만 3초 지연(초기 렌더링 완료 후) — 이후 품목
    // 변경에 따른 재호출은 바로 실행.
    const delay = hasRunWebOnce.current ? 0 : 3000;
    hasRunWebOnce.current = true;
    const t = setTimeout(() => {
      void scheduleExpiryNotification(foodItems);
    }, delay);
    return () => clearTimeout(t);
  }, [items]);

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
