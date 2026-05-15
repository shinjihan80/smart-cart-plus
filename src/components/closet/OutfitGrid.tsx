'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ClothingItem } from '@/types';
import { generateOutfits, type Outfit } from '@/lib/outfitMatcher';
import { useWearLog, daysSince } from '@/lib/wearLog';
import { useSavedOutfits } from '@/lib/savedOutfits';
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
 * v5: 가로 스와이프 캐러셀 복구 (1.3장 노출)
 *   - 진짜 원인이었던 body 스크롤 잠금 버그(OutfitDetailModal useModalA11y) 수정 후
 *     이제 가로 스와이프 캐러셀도 안전하게 사용 가능
 *   - native overflow-x-auto + scroll-snap-mandatory
 *   - 카드 폭 calc((100% - 0.625rem) / 1.3) → 다음 카드 30% 미리 보임
 */
export default function OutfitGrid({ items, count = 6, season, thickness }: OutfitGridProps) {
  const { log } = useWearLog();
  const { outfits: saved } = useSavedOutfits();
  const [selected, setSelected] = useState<Outfit | null>(null);

  // 저장 코디에서 함께 입은 쌍 추출
  const coWornPairs = useMemo(() => {
    const pairs = new Map<string, Set<string>>();
    for (const o of saved) {
      const ids = Object.values(o.slots).filter((id): id is string => !!id);
      for (let i = 0; i < ids.length; i += 1) {
        for (let j = i + 1; j < ids.length; j += 1) {
          if (!pairs.has(ids[i])) pairs.set(ids[i], new Set());
          if (!pairs.has(ids[j])) pairs.set(ids[j], new Set());
          pairs.get(ids[i])!.add(ids[j]);
          pairs.get(ids[j])!.add(ids[i]);
        }
      }
    }
    return pairs;
  }, [saved]);

  const outfits = useMemo(() => {
    if (items.length < 3) return [];
    const idleByItem: Record<string, number> = {};
    for (const item of items) {
      const dates = log[item.id] ?? [];
      idleByItem[item.id] = dates.length > 0 ? daysSince(dates[0]) : 9999;
    }
    return generateOutfits(items, idleByItem, { season, thickness, count, coWornPairs });
  }, [items, log, season, thickness, count, coWornPairs]);

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
          <span className="text-xs text-gray-400">← 스와이프 · 탭하면 상세</span>
        </div>

        {/* 가로 스와이프 캐러셀 — 1.3장 노출
            body 스크롤 잠금 버그가 해소되어 native overflow-x 로 안전하게 작동 */}
        <div
          className="-mx-5 px-5 flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1"
          style={{ scrollPaddingLeft: '1.25rem' }}
        >
          {outfits.map((o) => (
            <div
              key={o.id}
              className="snap-start shrink-0"
              style={{ width: 'calc((100% - 0.625rem) / 1.3)' }}
            >
              <OutfitCard outfit={o} onClick={() => setSelected(o)} />
            </div>
          ))}
          <div className="shrink-0 w-1" aria-hidden />
        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          {outfits.length}개 코디 · 좌우로 넘겨보세요
        </p>
      </motion.div>

      <OutfitDetailModal outfit={selected} onClose={() => setSelected(null)} />
    </>
  );
}
