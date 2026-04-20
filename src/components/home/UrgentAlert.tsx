'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { springTransition } from './shared';

export default function UrgentAlert({ items }: { items: CartItem[] }) {
  const urgent = items.filter(isFoodItem)
    .map((f) => ({ name: f.name, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }))
    .filter((f) => f.dDay <= 1);

  if (urgent.length === 0) return null;

  return (
    <Link href="/fridge" className="col-span-2 block">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="bg-brand-warning/10 border border-brand-warning/20 rounded-[24px] px-4 py-3 flex items-center gap-3"
      >
        <span className="text-xl">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-brand-warning">
            {urgent.length}개 식품 긴급 소비 필요
          </p>
          <p className="text-[10px] text-gray-500 truncate mt-0.5">
            {urgent.map((u) => u.name).join(', ')}
          </p>
        </div>
        <ChevronRight size={14} className="text-brand-warning/50 shrink-0" />
      </motion.div>
    </Link>
  );
}
