'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Refrigerator, Shirt, Flower2, ChefHat,
  ShoppingCart, BarChart3, Users, Settings,
  type LucideIcon,
} from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { currentSeasonByMonth, seasonStart } from '@/lib/season';
import { SEASONAL_PRODUCE, isSeasonalProduce } from '@/lib/seasonalProduce';
import { useShoppingList } from '@/lib/shoppingList';
import { springTransition } from './shared';

interface DiscardRecord { name: string; category: string; date: string; }

interface CategoryItem {
  href:      string;
  Icon:      LucideIcon;
  label:     string;
  bgClass:   string;   // 파스텔 배경
  iconClass: string;   // 아이콘 색
  badge?:    string;
  dot?:      boolean;
}

/**
 * 카테고리 그리드 (iOS 앱 아이콘 스타일)
 *
 * - 둥근 사각형 타일 (rounded-2xl) + 파스텔 배경
 * - Lucide 라인 아이콘 (이모지 대신)
 * - 8개 카테고리 × 4열 × 2행
 */
export default function QuickLinks({
  items, history,
}: { items: CartItem[]; history: DiscardRecord[] }) {
  const season = currentSeasonByMonth();
  const { list: shopping } = useShoppingList();

  const foods = items.filter(isFoodItem);
  const urgentCount = foods.filter((f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 1).length;
  const foodCount = foods.length;
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

  const categories: CategoryItem[] = [
    { href: '/fridge',             Icon: Refrigerator, label: '냉장고', bgClass: 'bg-blue-50',    iconClass: 'text-blue-500',    badge: foodCount > 0 ? String(foodCount) : undefined },
    { href: '/closet',             Icon: Shirt,        label: '옷장',   bgClass: 'bg-rose-50',    iconClass: 'text-rose-500',    badge: clothesCount > 0 ? String(clothesCount) : undefined },
    { href: '/seasonal',           Icon: Flower2,      label: '제철',   bgClass: 'bg-emerald-50', iconClass: 'text-emerald-500', badge: missedCount > 0 ? String(missedCount) : undefined },
    { href: '/fridge',             Icon: ChefHat,      label: '레시피', bgClass: 'bg-amber-50',   iconClass: 'text-amber-500',   dot: urgentCount > 0 },
    { href: '/mypage?tab=shopping',Icon: ShoppingCart, label: '쇼핑',   bgClass: 'bg-sky-50',     iconClass: 'text-sky-500',     badge: shopping.length > 0 ? String(shopping.length) : undefined },
    { href: '/mypage',             Icon: BarChart3,    label: '활동',   bgClass: 'bg-violet-50',  iconClass: 'text-violet-500'   },
    { href: '/settings#profiles',  Icon: Users,        label: '프로필', bgClass: 'bg-orange-50',  iconClass: 'text-orange-500'   },
    { href: '/settings',           Icon: Settings,     label: '설정',   bgClass: 'bg-gray-100',   iconClass: 'text-gray-600'     },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.03 }}
      className="grid grid-cols-4 gap-y-4"
    >
      {categories.map((c) => (
        <Link
          key={`${c.href}-${c.label}`}
          href={c.href}
          className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div className={`relative w-14 h-14 rounded-2xl ${c.bgClass} flex items-center justify-center`}>
            <c.Icon
              size={26}
              strokeWidth={1.8}
              className={c.iconClass}
              aria-hidden
            />
            {c.badge && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-accent text-white text-[10px] font-bold flex items-center justify-center tabular-nums ring-2 ring-white">
                {c.badge}
              </span>
            )}
            {c.dot && !c.badge && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-accent ring-2 ring-white" />
            )}
          </div>
          <span className="text-xs font-semibold text-brand-ink tracking-tight">{c.label}</span>
        </Link>
      ))}
    </motion.div>
  );
}
