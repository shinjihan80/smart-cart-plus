'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle, X } from 'lucide-react';
import type { CartItem } from '@/types';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { selectExpiring } from '@/lib/expirySelectors';
import { useToast } from '@/context/ToastContext';
import { springTransition } from './shared';

export default function UrgentAlert({
  items, excludeNames,
}: { items: CartItem[]; excludeNames?: ReadonlySet<string> }) {
  const { isDismissedToday, dismiss, restore } = useDismissedAlerts();
  const { showToast } = useToast();

  if (isDismissedToday('urgent')) return null;

  // 이미 기한이 지난 항목은 "오늘까지 먹어야 할"에서 제외 — 상한 걸 먹으라고
  // 권하던 버그(P0-30). 지난 항목은 히어로 메시지(dailyMessage.ts)가 별도 문구로 안내한다.
  // 바로 위 히어로가 이미 headline으로 짚은 품목(driverName)도 여기서 다시
  // 나오면 같은 이름이 한 화면에 두 번 찍힌다 — 그 품목만 제외(P1-51).
  const urgent = selectExpiring(items).today
    .map((e) => ({ name: e.item.name, dDay: e.dDay }))
    .filter((u) => !excludeNames?.has(u.name));

  if (urgent.length === 0) return null;

  // 'today' 버킷은 dDay 0·1을 함께 묶는데(EXPIRY_TODAY_DAYS=1), 헤드라인을
  // "오늘까지"로 고정해두면 히어로 dedup으로 진짜 D-0 품목이 빠졌을 때 남은
  // 품목이 전부 D-1인데도 "오늘까지"라고 말하게 된다 — 냉장고 목록에선 같은
  // 품목이 "1일 남음"으로 나와 모순돼 보인다(P0-53). 실제 남은 집합의 dDay로
  // 헤드라인을 고른다.
  const maxDay = Math.max(...urgent.map((u) => u.dDay));
  const headline = maxDay === 0 ? '오늘까지' : urgent.every((u) => u.dDay === 1) ? '내일까지' : '오늘·내일';

  // X만 누르면 어떤 동작인지 글자 설명이 없고(aria-label만), 다시 보는
  // 방법(설정 > 알림 설정 > "오늘 안 보기")도 안내가 안 돼 영구히 사라진
  // 것처럼 느껴졌다(P1-42, C10 발견) — 실제로는 자정에 자동 복구되고
  // 설정에서도 즉시 되살릴 수 있지만, 그 사실이 화면 어디에도 없었다.
  // 앱의 다른 삭제/소진 동작과 똑같이 토스트+되돌리기로 안내.
  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dismiss('urgent');
    showToast('오늘 하루 숨겼어요. 내일 다시 보여요.', () => restore('urgent'));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="relative"
    >
      <Link href="/fridge" className="block">
        <div className="bg-brand-warning/10 border border-brand-warning/20 rounded-[24px] px-4 py-3 flex items-center gap-3 hover:bg-brand-warning/15 transition-colors">
          <span className="w-9 h-9 rounded-xl bg-brand-warning/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} strokeWidth={2.2} className="text-brand-warning" />
          </span>
          <div className="flex-1 min-w-0 pr-6">
            <p className="text-xs font-bold text-brand-warning">
              {headline} 먹어야 할 식품 {urgent.length}개
            </p>
            {/* 이 줄만은 형제(RebuyAlert 등)와 맞추지 않는다 — 오늘 당장
                처리해야 할 유일한 항목이라 홈에서 가장 작은 글자가 되면
                안 된다는 걸 페르소나 검토(C1·C4)에서 확인 */}
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {urgent.map((u) => u.name).join(', ')}
            </p>
          </div>
          <ChevronRight size={14} className="text-brand-warning/50 shrink-0" />
        </div>
      </Link>
      <button
        onClick={handleDismiss}
        aria-label="임박 식품 알림 오늘 안 보기"
        title="오늘 안 보기"
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-brand-warning/60 hover:text-brand-warning hover:bg-brand-warning/15 transition-colors"
      >
        <X size={12} strokeWidth={2.4} />
      </button>
    </motion.div>
  );
}
