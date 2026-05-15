'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { estimateCycles } from '@/lib/purchaseCycle';
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

  const cycles = estimateCycles(discardHistory, 2);
  const haveNames = new Set(items.filter(isFoodItem).map((f) => f.name));

  const dueSoon = cycles
    .filter((c) => c.dueInDays <= 2)
    .filter((c) => !haveNames.has(c.name))
    .slice(0, 5);

  if (dueSoon.length === 0) return null;

  const overdueCount = dueSoon.filter((c) => c.dueInDays < 0).length;
  const top3 = dueSoon.slice(0, 3).map((c) => c.name).join(' · ');

  return (
    <Link href="/mypage?tab=shopping" className="block">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="bg-amber-50 border border-amber-100 rounded-[24px] px-4 py-3 flex items-center gap-3 hover:bg-amber-100/80 transition-colors"
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
        <ChevronRight size={16} strokeWidth={2.2} className="text-amber-700 shrink-0" />
      </motion.div>
    </Link>
  );
}
