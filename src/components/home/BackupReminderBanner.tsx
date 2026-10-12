'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Save, X } from 'lucide-react';
import type { CartItem } from '@/types';
import { useBackupStatus, daysAgoLabel } from '@/lib/backup';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { useToast } from '@/context/ToastContext';
import { springTransition } from './shared';

/**
 * 재검토(/nemoa-review 비판 모드, C5 코드 확인) P0 — /manual·/help가
 * "7일 이상 백업하지 않으면 홈 화면에 백업 권장 배너가 표시됩니다"라고
 * 안내하는데, 실제로 그런 배너는 마이·설정 안에만 있고 홈에는 0줄도
 * 없었다. 이 앱의 유일한 데이터 보호 장치가 사용자의 파일 백업인데,
 * 마이 탭까지 들어가지 않는 사용자는 Safari 7일 정리나 캐시 삭제로
 * 데이터가 날아갈 때까지 경고를 한 번도 못 본다.
 *
 * items가 비어있으면(아직 등록한 게 없음) 보호할 데이터 자체가 없으니
 * 노출하지 않는다 — 신규 사용자에게 빈 카트 상태에서 "백업해주세요"는
 * 소음일 뿐이다.
 */
export default function BackupReminderBanner({ items }: { items: CartItem[] }) {
  const backup = useBackupStatus();
  const { isDismissedToday, dismiss, restore } = useDismissedAlerts();
  const { showToast } = useToast();

  if (items.length === 0) return null;
  if (!backup.isStale) return null;
  if (isDismissedToday('backup')) return null;

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dismiss('backup');
    showToast('오늘 하루 숨겼어요. 내일 다시 보여요.', () => restore('backup'));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="relative"
    >
      <div className="bg-gray-900/5 border border-gray-900/10 rounded-[24px] flex items-stretch overflow-hidden">
        <Link
          href="/settings"
          className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 hover:bg-gray-900/10 transition-colors"
        >
          <span className="w-9 h-9 rounded-xl bg-gray-900/10 flex items-center justify-center shrink-0">
            <Save size={18} strokeWidth={2.2} className="text-gray-600" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">
              {backup.lastBackupAt === null ? '아직 백업한 적 없어요' : `백업 ${daysAgoLabel(backup.daysSince)}`}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              브라우저 캐시가 비면 데이터가 사라질 수 있어요. 지금 백업해두세요.
            </p>
          </div>
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="백업 안내 오늘 안 보기"
          title="오늘 안 보기"
          className="w-11 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-900/10 transition-colors"
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      </div>
    </motion.div>
  );
}
