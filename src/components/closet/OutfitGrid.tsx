'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
 * v3 (페이지 스크롤 보존을 위한 단순화):
 * - drag·overflow-x 모두 제거 → 페이지 스크롤 절대 안 막힘
 * - 인덱스 기반 슬라이드 + ◀ ▶ 화살표 / 인디케이터로 카드 전환
 * - 모든 touch 는 페이지로 그대로 통과
 */
export default function OutfitGrid({ items, count = 6, season, thickness }: OutfitGridProps) {
  const { log } = useWearLog();
  const [selected, setSelected] = useState<Outfit | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

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

  // 한 번에 1.3 카드 노출 — 카드 폭은 컨테이너의 ~77%
  // translateX 로 슬라이드 — 가로/세로 touch 절대 가로채지 않음
  const cardPercent = 100 / 1.3; // ≈ 76.92%
  const gapPercent  = 2.5;       // gap 비율 (시각적 보정)
  const offset = -activeIdx * (cardPercent + gapPercent);

  const canPrev = activeIdx > 0;
  const canNext = activeIdx < outfits.length - 1;

  function prev() { if (canPrev) setActiveIdx(activeIdx - 1); }
  function next() { if (canNext) setActiveIdx(activeIdx + 1); }

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
          <span className="text-[10px] text-gray-300">v1.5.3</span>
        </div>

        {/* viewport — 카드 슬라이드 클립 영역 */}
        <div className="-mx-5 px-5 overflow-hidden">
          {/* track — translateX 로 슬라이드. touch 이벤트 절대 가로채지 않음 */}
          <div
            ref={trackRef}
            className="flex gap-[2.5%] transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${offset}%)` }}
          >
            {outfits.map((o, i) => (
              <div
                key={o.id}
                className="shrink-0"
                style={{ width: `${cardPercent}%` }}
              >
                <OutfitCard outfit={o} index={i} onClick={() => setSelected(o)} />
              </div>
            ))}
          </div>
        </div>

        {/* 컨트롤 — 좌우 화살표 + 인디케이터 */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={prev}
            disabled={!canPrev}
            aria-label="이전 코디"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              canPrev
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-1.5">
            {outfits.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                aria-label={`${i + 1}번째 코디`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIdx
                    ? 'w-5 bg-brand-primary'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            disabled={!canNext}
            aria-label="다음 코디"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              canNext
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          {activeIdx + 1} / {outfits.length} · 화살표 또는 점으로 이동
        </p>
      </motion.div>

      <OutfitDetailModal outfit={selected} onClose={() => setSelected(null)} />
    </>
  );
}
