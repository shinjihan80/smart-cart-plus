'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { currentSeasonByMonth, seasonStart } from '@/lib/season';
import {
  SEASONAL_PRODUCE,
  isSeasonalProduce,
} from '@/lib/seasonalProduce';
import { SEASON_EMOJI } from '@/lib/recipes';
import { CARD, CARD_SHADOW, springTransition } from './shared';

interface DiscardRecord {
  name:     string;
  category: string;
  date:     string;
}

interface Props {
  items:   CartItem[];
  history: DiscardRecord[];
}

/**
 * 홈 벤토 — 이번 계절 제철 재료를 얼마나 섭렵했는지 진행도 카드.
 * 0%면 시작 유도, 100%면 축하, 중간이면 놓친 개수 + 마이페이지 링크.
 * 보유/소진 둘 다 '경험'으로 카운트해 미세한 활동도 인정.
 */
export default function SeasonalChecklistWidget({ items, history }: Props) {
  const season = currentSeasonByMonth();

  const { tried, total, percent } = useMemo(() => {
    const winStart = seasonStart(season);
    const allInSeason = SEASONAL_PRODUCE.filter((p) => p.seasons.includes(season));
    const triedNames = new Set<string>();

    // 현재 보유 중 제철
    for (const it of items) {
      if (!isFoodItem(it)) continue;
      if (!isSeasonalProduce(it.name, season)) continue;
      const base = allInSeason.find((p) => p.name === it.name || it.name.includes(p.name));
      if (base) triedNames.add(base.name);
    }
    // 이번 계절에 소진한 제철
    for (const h of history) {
      if (h.category !== '식품') continue;
      if (!h.date || h.date < winStart) continue;
      if (!isSeasonalProduce(h.name, season)) continue;
      const base = allInSeason.find((p) => p.name === h.name || h.name.includes(p.name));
      if (base) triedNames.add(base.name);
    }

    const total = allInSeason.length;
    return {
      tried: triedNames.size,
      total,
      percent: total === 0 ? 0 : Math.round((triedNames.size / total) * 100),
    };
  }, [items, history, season]);

  if (total === 0) return null;
  const missed = total - tried;
  const pct = Math.max(0, Math.min(100, percent));

  return (
    <Link href="/mypage" className="col-span-2 block">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.18 }}
        className={CARD}
        style={CARD_SHADOW}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0">{SEASON_EMOJI[season]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-700">
                이번 {season} 제철 체크리스트
              </p>
              <span className="text-[11px] font-bold text-brand-primary tabular-nums shrink-0">
                {tried}/{total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  pct === 100 ? 'bg-brand-success' : pct >= 50 ? 'bg-brand-primary' : 'bg-amber-400'
                }`}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {pct === 100
                ? `${season}철 제철 재료를 모두 드셨어요! 👏`
                : pct === 0
                ? `아직 시작 안 했어요. ${total}종 중 첫 재료를 담아보세요.`
                : `${missed}종 더 남았어요 · 탭해서 전체 보기`}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0" />
        </div>
      </motion.div>
    </Link>
  );
}
