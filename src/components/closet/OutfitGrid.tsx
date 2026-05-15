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
          <span className="text-xs text-gray-400">← 스와이프 · 탭하면 상세</span>
        </div>

        {/* 가로 스와이프 캐러셀 — 1.3장 노출(다음 카드 살짝 보임)
            touch-action 미지정(=auto) → 브라우저 기본 동작 사용
            iOS Safari 는 auto 일 때 방향 우세 감지로 가로/세로 적절히 분리 */}
        <div
          className="-mx-5 px-5 flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollPaddingLeft: '1.25rem' }}
        >
          {outfits.map((o, i) => (
            <div
              key={o.id}
              className="snap-start shrink-0"
              style={{ width: 'calc((100% - 0.625rem) / 1.3)' }}
            >
              <OutfitCard outfit={o} index={i} onClick={() => setSelected(o)} />
            </div>
          ))}
          {/* 우측 패딩 보정 — 마지막 카드도 스냅 후 충분한 여백 */}
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
