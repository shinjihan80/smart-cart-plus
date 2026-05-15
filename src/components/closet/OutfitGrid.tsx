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
  /** 표시할 코디 개수 (기본 6) */
  count?: number;
  /** 현재 계절 (자동 매칭에 사용) */
  season?: Season;
  /** 권장 두께 (날씨 기반, 옵션) */
  thickness?: string[];
}

/**
 * 코디 그리드 — 옷장에서 자동 생성한 N개 코디를 이미지 콜라주 그리드로 노출.
 *
 * - 카드 클릭 → 상세 모달 + "오늘 입었어요" 버튼
 * - 텍스트 최소 (라벨만 오버레이)
 * - 옷이 3벌 미만이면 안 그림
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
          <span className="text-xs text-gray-400">탭하면 상세</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {outfits.map((o, i) => (
            <OutfitCard key={o.id} outfit={o} index={i} onClick={() => setSelected(o)} />
          ))}
        </div>
      </motion.div>

      <OutfitDetailModal outfit={selected} onClose={() => setSelected(null)} />
    </>
  );
}
