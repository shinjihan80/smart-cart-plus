'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { isFoodItem, isClothingItem, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { springTransition } from './shared';

export default function QuickStats({ items }: { items: CartItem[] }) {
  const food    = items.filter(isFoodItem).length;
  const clothes = items.filter(isClothingItem).length;
  const urgent  = items.filter(isFoodItem).filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length;

  const stats = [
    { label: '전체',  value: items.length, color: 'text-gray-900',       href: '/mypage' },
    { label: '식품',  value: food,         color: 'text-sky-600',         href: '/fridge' },
    { label: '의류',  value: clothes,      color: 'text-brand-primary',   href: '/closet' },
    { label: '임박',  value: urgent,       color: urgent > 0 ? 'text-brand-warning' : 'text-gray-900', href: '/fridge' },
  ];

  return (
    <div className="col-span-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.05 }}
        className="flex justify-between px-2"
      >
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 hover:bg-gray-100 transition-colors"
          >
            <span className={`text-xl font-extrabold tabular-nums ${s.color}`}>{s.value}</span>
            <span className="text-[10px] text-gray-400 font-medium">{s.label}</span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
