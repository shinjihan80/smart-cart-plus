'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BellOff, X } from 'lucide-react';
import type { CartItem } from '@/types';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { selectExpiring } from '@/lib/expirySelectors';
import { useToast } from '@/context/ToastContext';
import { requestPermission } from '@/lib/notificationScheduler';
import { isNative } from '@/lib/native';
import {
  requestLocalNotificationPermission,
  getLocalNotificationPermissionState,
} from '@/lib/native/localNotifications';
import { springTransition } from './shared';

/**
 * 알림이 꺼진 채 오늘 임박 식품이 있을 때 "오늘 할 일" 존 최상단에 뜨는
 * 조건부 배너(P1-61①, C1·C4·C9 3인 독립 지적 + E1 "리텐션 관점 단일
 * 최대 누수 지점").
 *
 * 벨 아이콘 점의 의미를 "권한 꺼짐"→"안 읽은 알림"으로 바꾼 수정(정당함,
 * 예전엔 눌러도 설정으로 가 오독 유발)이 권한 꺼짐 신호를 알림함 안쪽으로만
 * 옮겨버려, 정작 알림함에 들어갈 이유가 없는 사용자에게 신호가 전혀
 * 도달하지 않았다. 알림이 가장 필요한 순간(오늘 임박 식품 있음)에만,
 * 그것도 하루 1회만 노출해 배너 남용(E3 우려)과 절충한다.
 */
export default function NotificationOffBanner({ items }: { items: CartItem[] }) {
  const { isDismissedToday, dismiss, restore } = useDismissedAlerts();
  const { showToast } = useToast();
  const [permState, setPermState] = useState<NotificationPermission | 'unsupported' | 'checking'>('checking');

  useEffect(() => {
    if (isNative()) {
      void getLocalNotificationPermissionState().then(setPermState);
      return;
    }
    setPermState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  }, []);

  if (isDismissedToday('noti-off')) return null;
  if (permState === 'checking' || permState === 'unsupported' || permState === 'granted') return null;

  const todayCount = selectExpiring(items).today.length;
  if (todayCount === 0) return null;

  async function handleEnable() {
    const granted = isNative() ? await requestLocalNotificationPermission() : await requestPermission();
    if (granted) {
      setPermState('granted');
      showToast('알림이 켜졌어요.');
    } else {
      showToast('알림 권한이 거부됐어요. 휴대폰 설정에서 변경해주세요.');
    }
  }

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dismiss('noti-off');
    showToast('오늘 하루 숨겼어요. 내일 다시 보여요.', () => restore('noti-off'));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="relative bg-gray-900/5 border border-gray-900/10 rounded-[24px] px-4 py-3 flex items-center gap-3"
    >
      <span className="w-9 h-9 rounded-xl bg-gray-900/10 flex items-center justify-center shrink-0">
        <BellOff size={18} strokeWidth={2.2} className="text-gray-600" />
      </span>
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-sm font-bold text-gray-800">알림이 꺼져 있어요</p>
        <p className="text-sm text-gray-500 mt-0.5">
          오늘 임박 식품 {todayCount}개를 못 알려드려요.
        </p>
      </div>
      <button
        onClick={handleEnable}
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-900 text-white hover:opacity-90 transition-opacity"
      >
        켜기
      </button>
      <button
        onClick={handleDismiss}
        aria-label="알림 꺼짐 안내 오늘 안 보기"
        title="오늘 안 보기"
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-900/10 transition-colors"
      >
        <X size={12} strokeWidth={2.4} />
      </button>
    </motion.div>
  );
}
