'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  isClothingItem,
  FASHION_GROUP,
  type CartItem,
  type ClothingItem,
} from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { currentSeasonByMonth, matchesSeason } from '@/lib/season';
import { SEASON_EMOJI } from '@/lib/recipes';
import { springTransition } from './shared';

export default function SeasonalUnstowBanner({ items }: { items: CartItem[] }) {
  const { updateItem } = useCart();
  const { showToast } = useToast();
  const season = currentSeasonByMonth();

  const candidates: ClothingItem[] = items.filter(isClothingItem).filter(
    (c) => c.hibernating
      && FASHION_GROUP[c.category] === '의류'
      && matchesSeason(c.weatherTags, season) === true,
  );

  if (candidates.length === 0) return null;

  function handleUnstowAll() {
    if (!confirm(`${season}철 옷 ${candidates.length}벌을 모두 꺼낼까요?`)) return;
    candidates.forEach((c) => updateItem(c.id, { hibernating: false }));
    showToast(`${candidates.length}벌 꺼냈어요.`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.06 }}
      className="rounded-[28px] bg-gradient-to-br from-brand-success/10 to-brand-primary/10 border border-brand-success/20 px-4 py-3.5 flex items-center gap-3"
    >
      <span className="text-2xl shrink-0">{SEASON_EMOJI[season]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-brand-success">{season}이 왔어요!</p>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
          보관해뒀던 {season}철 옷 <span className="font-semibold tabular-nums">{candidates.length}벌</span>을 꺼낼 때예요.
        </p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={handleUnstowAll}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-success text-white hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          모두 꺼내기
        </button>
        <Link
          href="/mypage"
          className="text-[10px] text-gray-500 text-center hover:underline"
        >
          개별 관리 →
        </Link>
      </div>
    </motion.div>
  );
}
