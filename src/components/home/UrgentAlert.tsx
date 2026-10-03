'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle, X } from 'lucide-react';
import type { CartItem } from '@/types';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { selectExpiring } from '@/lib/expirySelectors';
import { useToast } from '@/context/ToastContext';
import { springTransition } from './shared';

export default function UrgentAlert({ items }: { items: CartItem[] }) {
  const { isDismissedToday, dismiss, restore } = useDismissedAlerts();
  const { showToast } = useToast();

  if (isDismissedToday('urgent')) return null;

  // 이미 기한이 지난 항목은 "오늘까지 먹어야 할"에서 제외 — 상한 걸 먹으라고
  // 권하던 버그(P0-30). 지난 항목은 히어로 메시지(dailyMessage.ts)가 별도 문구로
  // 안내한다. 히어로가 headline으로 짚은 품목을 여기서도 빼던 적이 있었는데
  // (P1-51), 유일한 긴급 품목이 히어로에 뽑히면 "오늘 할 일" 액션 존에서
  // 그 품목이 통째로 사라지는 더 심각한 문제였다(P1-67, C1·C8 독립 지적) —
  // 배너 블라인드니스가 걸리는 히어로 안에만 정보가 있으면 사실상 안 보인
  // 것과 같다. 액션 존은 중복 노출을 감수하고 항상 전체를 보여준다.
  const urgent = selectExpiring(items).today
    .map((e) => ({ name: e.item.name, dDay: e.dDay }));

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
            {/* 헤드라인은 본문 줄(바로 아래, text-sm)보다 작으면 안 된다 —
                본문을 text-sm으로 올린 과거 수정(C1·C4, 오늘 당장 처리할
                유일한 항목이라 홈에서 가장 작은 글자가 되면 안 됨)이 정작
                제목을 text-xs에 그대로 둬 "제목 < 본문" 역전을 새로 만들었다
                (P1-49, E3 발견). 본문은 그대로 두고 제목을 text-sm으로 맞춤
                — bold+경고색은 유지돼 위계는 그대로 살아있음. */}
            <p className="text-sm font-bold text-brand-warning">
              {headline} 먹어야 할 식품 {urgent.length}개
            </p>
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
        className="touch-target-44 absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-brand-warning/60 hover:text-brand-warning hover:bg-brand-warning/15 transition-colors"
      >
        <X size={12} strokeWidth={2.4} />
      </button>
    </motion.div>
  );
}
