'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { isFoodItem, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { currentSeasonByMonth, seasonStart } from '@/lib/season';
import { SEASONAL_PRODUCE, isSeasonalProduce } from '@/lib/seasonalProduce';
import { useShoppingList } from '@/lib/shoppingList';
import { springTransition } from './shared';

interface DiscardRecord { name: string; category: string; date: string; }

/**
 * 카테고리 아이콘 그리드 (롯데면세점·SSG 스타일)
 * 8개 원형 아이콘 + 라벨, 4열 × 2행.
 *
 * 각 버튼:
 *  - 원형 배경 (연한 파스텔)
 *  - 이모지 or 아이콘
 *  - 라벨 (text-xs)
 *  - 배지 (숫자 또는 🔴 점)
 */
export default function QuickLinks({
  items, history,
}: { items: CartItem[]; history: DiscardRecord[] }) {
  const season = currentSeasonByMonth();
  const { list: shopping } = useShoppingList();

  const foods = items.filter(isFoodItem);
  const urgentCount = foods.filter((f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 1).length;
  const foodCount   = foods.length;
  const clothesCount = items.filter((i) => i.category !== '식품').length;

  // 제철 놓친 개수
  const missedCount = (() => {
    const winStart = seasonStart(season);
    const triedNames = new Set<string>();
    for (const f of foods) {
      if (!isSeasonalProduce(f.name, season)) continue;
      const base = SEASONAL_PRODUCE.find((p) => p.seasons.includes(season) && (p.name === f.name || f.name.includes(p.name)));
      if (base) triedNames.add(base.name);
    }
    for (const h of history) {
      if (h.category !== '식품' || !h.date || h.date < winStart) continue;
      if (!isSeasonalProduce(h.name, season)) continue;
      const base = SEASONAL_PRODUCE.find((p) => p.seasons.includes(season) && (p.name === h.name || h.name.includes(p.name)));
      if (base) triedNames.add(base.name);
    }
    const total = SEASONAL_PRODUCE.filter((p) => p.seasons.includes(season)).length;
    return total - triedNames.size;
  })();

  const cards: Array<{
    href:   string;
    icon:   string;
    label:  string;
    bg:     string;   // 원형 배경 (연한 파스텔)
    badge?: string;
    dot?:   boolean;
  }> = [
    { href: '/fridge',             icon: '🧊', label: '냉장고', bg: 'bg-sky-50',     badge: foodCount    > 0 ? String(foodCount) : undefined },
    { href: '/closet',             icon: '👔', label: '옷장',   bg: 'bg-indigo-50',  badge: clothesCount > 0 ? String(clothesCount) : undefined },
    { href: '/seasonal',           icon: '🌸', label: '제철',   bg: 'bg-pink-50',    badge: missedCount  > 0 ? String(missedCount) : undefined },
    { href: '/fridge',             icon: '👨‍🍳', label: '레시피', bg: 'bg-amber-50',   dot: urgentCount > 0 },
    { href: '/mypage#shopping',    icon: '🛒', label: '쇼핑',   bg: 'bg-emerald-50', badge: shopping.length > 0 ? String(shopping.length) : undefined },
    { href: '/mypage',             icon: '📊', label: '활동',   bg: 'bg-violet-50'   },
    { href: '/settings#profiles',  icon: '👥', label: '프로필', bg: 'bg-rose-50'     },
    { href: '/settings',           icon: '⚙️', label: '설정',   bg: 'bg-gray-100'    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.03 }}
      className="grid grid-cols-4 gap-y-3"
    >
      {cards.map((c) => (
        <Link
          key={`${c.href}-${c.label}`}
          href={c.href}
          className="relative flex flex-col items-center gap-1.5 py-1 active:scale-95 transition-transform"
        >
          <div className={`relative w-12 h-12 rounded-full ${c.bg} flex items-center justify-center`}>
            <span className="text-xl leading-none">{c.icon}</span>
            {c.badge && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center tabular-nums ring-2 ring-white">
                {c.badge}
              </span>
            )}
            {c.dot && !c.badge && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-warning ring-2 ring-white" />
            )}
          </div>
          <span className="text-xs font-medium text-gray-700 tracking-tight">{c.label}</span>
        </Link>
      ))}
    </motion.div>
  );
}
