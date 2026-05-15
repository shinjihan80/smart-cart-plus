'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle, X } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { springTransition } from './shared';

export default function UrgentAlert({ items }: { items: CartItem[] }) {
  const { isDismissedToday, dismiss } = useDismissedAlerts();

  if (isDismissedToday('urgent')) return null;

  const urgent = items.filter(isFoodItem)
    .map((f) => ({ name: f.name, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }))
    .filter((f) => f.dDay <= 1);

  if (urgent.length === 0) return null;

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dismiss('urgent');
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
              {urgent.length}개 식품 긴급 소비 필요
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
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-brand-warning/60 hover:text-brand-warning hover:bg-brand-warning/15 transition-colors"
      >
        <X size={12} strokeWidth={2.4} />
      </button>
    </motion.div>
  );
}
