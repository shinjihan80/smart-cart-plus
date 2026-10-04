'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BellOff, X } from 'lucide-react';
import type { CartItem } from '@/types';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { selectExpiring } from '@/lib/expirySelectors';
import { groupExpiryPhrase } from '@/lib/expiryThresholds';
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

  const todayEntries = selectExpiring(items).today;
  const todayCount = todayEntries.length;
  if (todayCount === 0) return null;
  // P0-68(P0-53 재발) — "오늘 임박"을 고정 문구로 썼는데, 'today' 버킷은
  // 실제로 D-0과 D-1을 함께 묶어 D-1만 있어도 "오늘"이라 말했다.
  const phrase = groupExpiryPhrase(todayEntries.map((e) => e.dDay));

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
      className="relative bg-gray-900/5 border border-gray-900/10 rounded-[24px] flex items-stretch overflow-hidden"
    >
      {/* P1-88 — ✕를 absolute로 띄워 히트존만 키우자(touch-target-44)
          "켜기" 버튼 상단 21%를 덮어, 알림을 켜려던 탭이 안내를 하루
          숨기는 오동작이 났다(E2 실측). ✕를 다른 홈 배너와 같은 패턴
          (flex 형제, 실제 44px 폭 칼럼)으로 분리해 겹침 자체를 없앤다 —
          "켜기"는 그대로 본문 flex 행 안에 남는다. */}
      <div className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3">
        <span className="w-9 h-9 rounded-xl bg-gray-900/10 flex items-center justify-center shrink-0">
          <BellOff size={18} strokeWidth={2.2} className="text-gray-600" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">알림이 꺼져 있어요</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {phrase} 먹어야 할 식품 {todayCount}개를 못 알려드려요.
          </p>
        </div>
        <button
          onClick={handleEnable}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-900 text-white hover:opacity-90 transition-opacity"
        >
          켜기
        </button>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="알림 꺼짐 안내 오늘 안 보기"
        title="오늘 안 보기"
        className="w-11 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-900/10 transition-colors"
      >
        <X size={14} strokeWidth={2.4} />
      </button>
    </motion.div>
  );
}
