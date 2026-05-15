'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ClothingItem } from '@/types';
import { generateOutfits, type Outfit } from '@/lib/outfitMatcher';
import { useWearLog, daysSince } from '@/lib/wearLog';
import OutfitCard from './OutfitCard';
import OutfitDetailModal from './OutfitDetailModal';
import { springTransition, CARD, CARD_SHADOW } from './shared';
import type { Season } from '@/lib/season';

interface OutfitGridProps {
  items: ClothingItem[];
  count?: number;
  season?: Season;
  thickness?: string[];
}

/**
 * 코디 그리드 — 옷장에서 자동 생성한 N개 코디.
 *
 * v4 (스크롤 보존 우선):
 * - 캐러셀/스와이프 모두 제거 → 2열 세로 그리드
 * - touch 가로채는 요소 0개 → 페이지 스크롤 100% 보장
 * - 페이지 스크롤로 모든 코디 자연스럽게 탐색
 */
export default function OutfitGrid({ items, count = 6, season, thickness }: OutfitGridProps) {
  const { log } = useWearLog();
  const [selected, setSelected] = useState<Outfit | null>(null);

  const outfits = useMemo(() => {
    if (items.length < 3) return [];
    const idleByItem: Record<string, number> = {};
    for (const item of items) {
      const dates = log[item.id] ?? [];
      idleByItem[item.id] = dates.length > 0 ? daysSince(dates[0]) : 9999;
    }
    return generateOutfits(items, idleByItem, { season, thickness, count });
  }, [items, log, season, thickness, count]);

  if (outfits.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.06 }}
        className={CARD}
        style={CARD_SHADOW}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">
            👗 오늘 입을 코디
          </h3>
          <span className="text-[10px] text-gray-300">v1.5.4</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {outfits.map((o, i) => (
            <OutfitCard key={o.id} outfit={o} index={i} onClick={() => setSelected(o)} />
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          {outfits.length}개 코디 · 카드 탭하면 상세
        </p>
      </motion.div>

      <OutfitDetailModal outfit={selected} onClose={() => setSelected(null)} />
    </>
  );
}
