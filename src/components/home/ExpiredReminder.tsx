'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import type { CartItem } from '@/types';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { selectExpiring } from '@/lib/expirySelectors';
import { useToast } from '@/context/ToastContext';
import { addNotificationLogEntry } from '@/lib/notificationLog';
import { todayLocalStr } from '@/lib/dateMath';
import { springTransition } from './shared';

/**
 * 재검토(/nemoa-review 비판 모드, C5 코드 확인) P0 — 히어로는 "9개가
 * 기한이 지났어요"라고 하는데, 바로 아래 "오늘 할 일"에는 UrgentAlert가
 * today/soon 버킷만 그려(expired는 의도적으로 제외, P0-30 재발 방지)
 * 아무 자식도 없으면 TodoEmptyState가 "오늘은 할 일이 없어요 🎉"를
 * 띄웠다. 같은 화면 안에서 "지났어요"와 "할 일 없음 🎉"이 동시에 보여
 * 둘 다 못 믿게 됐다.
 *
 * UrgentAlert와 같은 today 버킷을 또 그리는 게 아니라, expired 전용으로
 * 분리된 배너를 액션 존에도 하나 둔다 — 히어로가 이미 짚었어도(배너
 * 블라인드니스로 안 보일 수 있음, P1-67과 같은 논리) 액션 존은 항상
 * 전체를 보여줘 "할 일 없음" 문구가 뜰 길을 막는다. 톤은 UrgentAlert의
 * "먹어야 할"(경고/주황)과 구분해 "치워야 할"(중립/빨강) 문구로.
 */
export default function ExpiredReminder({ items }: { items: CartItem[] }) {
  const { isDismissedToday, dismiss, restore } = useDismissedAlerts();
  const { showToast } = useToast();

  const expired = selectExpiring(items).expired.map((e) => e.item.name);

  // 재검토(비판 모드) P1-81 — UrgentAlert와 같은 이유로 알림함에도 기록.
  // 훅은 이른 반환보다 위에서 호출해야 해 조건은 effect 안에서 확인한다.
  useEffect(() => {
    if (expired.length === 0) return;
    addNotificationLogEntry({
      kind: 'expired',
      title: `기한이 지난 식품 ${expired.length}개`,
      body: expired.join(', '),
      dedupeKey: `expired:${todayLocalStr()}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired.length]);

  if (isDismissedToday('expired')) return null;
  if (expired.length === 0) return null;

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dismiss('expired');
    showToast('오늘 하루 숨겼어요. 내일 다시 보여요.', () => restore('expired'));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="relative"
    >
      <div className="bg-red-50 border border-red-100 rounded-[24px] flex items-stretch overflow-hidden">
        <Link
          href="/fridge?tab=food"
          className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 hover:bg-red-100/60 transition-colors"
        >
          <span className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={18} strokeWidth={2.2} className="text-red-600" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-600">
              기한이 지난 식품 {expired.length}개
            </p>
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {expired.join(', ')}
            </p>
          </div>
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="기한 초과 알림 오늘 안 보기"
          title="오늘 안 보기"
          className="w-11 shrink-0 flex items-center justify-center text-red-600/60 hover:text-red-600 hover:bg-red-100/60 transition-colors"
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      </div>
    </motion.div>
  );
}
