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
 * 홈 상단 퀵 링크 4칸 — 각 링크별 배지는 동적으로 계산.
 * - 🌸 제철: 이번 계절에 놓친 재료가 있으면 N개 배지
 * - 👨‍🍳 레시피: 임박 식재료 있으면 빨간 점
 * - 🛒 쇼핑: shoppingList 개수 배지
 * - 👥 프로필: 배지 없음 (추후 팅크 알림 용)
 */
export default function QuickLinks({
  items, history,
}: { items: CartItem[]; history: DiscardRecord[] }) {
  const season = currentSeasonByMonth();
  const { list: shopping } = useShoppingList();

  const foods = items.filter(isFoodItem);
  const urgentCount = foods.filter((f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 1).length;

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

  const cards: Array<{ href: string; emoji: string; label: string; badge?: string; dot?: boolean }> = [
    { href: '/seasonal', emoji: '🌸', label: '제철 달력',   badge: missedCount > 0 ? String(missedCount) : undefined },
    { href: '/fridge',   emoji: '👨‍🍳', label: '레시피 찾기', dot: urgentCount > 0 },
    { href: '/mypage',   emoji: '🛒', label: '쇼핑 리스트', badge: shopping.length > 0 ? String(shopping.length) : undefined },
    { href: '/settings#profiles', emoji: '👥', label: '프로필 설정' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.03 }}
      className="grid grid-cols-4 gap-2"
    >
      {cards.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="relative flex flex-col items-center gap-1 py-2 rounded-2xl bg-white border border-gray-100 hover:border-brand-primary/20 hover:bg-brand-primary/5 active:scale-95 transition-all"
        >
          <span className="text-xl">{c.emoji}</span>
          <span className="text-[10px] font-medium text-gray-600">{c.label}</span>
          {c.badge && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
              {c.badge}
            </span>
          )}
          {c.dot && !c.badge && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-warning" />
          )}
        </Link>
      ))}
    </motion.div>
  );
}
