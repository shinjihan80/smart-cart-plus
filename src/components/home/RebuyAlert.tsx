'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RotateCcw, X } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { estimateCycles } from '@/lib/purchaseCycle';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { useToast } from '@/context/ToastContext';
import { springTransition } from './shared';

/**
 * 재구매 알림 배너.
 *
 * 표시 조건:
 *  - discardHistory 가 2회 이상 소진된 식품의 평균 주기 계산
 *  - dueInDays ≤ 2 (곧 떨어지거나 이미 늦음) 이면서 현재 보유 안 하는 식품이 1개 이상
 *
 * 클릭 → /mypage?tab=shopping 의 ShoppingSuggestionsSection 으로 이동.
 *
 * 임박 식품 알림(UrgentAlert) 과 별개:
 *   - UrgentAlert: 보유 중인 식품의 임박 만료
 *   - RebuyAlert:  보유하지 않은 식품의 재구매 시점
 */
export default function RebuyAlert({ items }: { items: CartItem[] }) {
  const { discardHistory } = useCart();
  const { isDismissedToday, dismiss, restore } = useDismissedAlerts();
  const { showToast } = useToast();

  if (isDismissedToday('rebuy')) return null;

  const cycles = estimateCycles(discardHistory, 2);
  const haveNames = new Set(items.filter(isFoodItem).map((f) => f.name));

  // 히어로가 이미 같은 품목을 headline으로 짚었다고 여기서도 빼던 적이
  // 있었는데(P1-51), 유일한 재구매 임박 품목이 히어로에 뽑히면 "오늘 할
  // 일" 액션 존에서 통째로 사라지는 더 심각한 문제였다(P1-67, UrgentAlert
  // 와 동일 사유) — 액션 존은 중복 노출을 감수하고 항상 전체를 보여준다.
  const dueSoon = cycles
    .filter((c) => c.dueInDays <= 2)
    .filter((c) => !haveNames.has(c.name))
    .slice(0, 5);

  if (dueSoon.length === 0) return null;

  const overdueCount = dueSoon.filter((c) => c.dueInDays < 0).length;
  const top3 = dueSoon.slice(0, 3).map((c) => c.name).join(' · ');

  // UrgentAlert와 동일한 사유(P1-42) — 토스트+되돌리기로 안내.
  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dismiss('rebuy');
    showToast('오늘 하루 숨겼어요. 내일 다시 보여요.', () => restore('rebuy'));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="relative"
    >
      {/* P1-88 — UrgentAlert와 동일한 수정: ›는 카드 전체가 이미 Link라
          중복이라 제거, ✕는 flex 형제 칼럼으로 분리해 실제 44px 레이아웃
          공간을 갖게 해 의사요소 확장 겹침 자체를 없앤다. */}
      <div className="bg-amber-50 border border-amber-100 rounded-[24px] flex items-stretch overflow-hidden">
        <Link
          href="/mypage?tab=shopping"
          className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 hover:bg-amber-100/80 transition-colors"
        >
          <span className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <RotateCcw size={18} strokeWidth={2.2} className="text-amber-700" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-700">
              {dueSoon.length}개 식품 곧 떨어질 때
              {overdueCount > 0 && (
                <span className="ml-1 text-xs font-medium text-brand-warning">
                  · {overdueCount}개 늦음
                </span>
              )}
            </p>
            <p className="text-xs text-amber-700/80 mt-0.5 truncate">
              {top3}
              {dueSoon.length > 3 && ` 외 ${dueSoon.length - 3}개`}
            </p>
          </div>
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="오늘 안 보기"
          title="오늘 안 보기"
          className="w-11 shrink-0 flex items-center justify-center text-amber-700/60 hover:text-amber-900 hover:bg-amber-100/80 transition-colors"
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      </div>
    </motion.div>
  );
}
