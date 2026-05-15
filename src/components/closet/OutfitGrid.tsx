'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
 * 코디 그리드 — 옷장에서 자동 생성한 N개 코디를 이미지 콜라주 카드로 노출.
 *
 * 캐러셀 구현 — **framer-motion drag="x"**.
 * 이유: iOS Safari 에서 native overflow-x 스크롤러 위에서 손가락을 위/아래로
 * 움직이면 페이지 세로 스크롤이 막히는 버그가 있음. framer-motion 의 drag 는
 * touchAction: 'pan-y' 와 결합하면 가로 우세 제스처일 때만 drag 가 활성화되고,
 * 세로 우세 제스처는 브라우저에 그대로 넘어가 페이지 스크롤이 정상 작동함.
 *
 * - 카드 클릭 → 상세 모달 + "오늘 입었어요" 버튼
 * - 텍스트 최소 (라벨만 오버레이)
 * - 옷이 3벌 미만이면 안 그림
 * - 다음 카드 0.3 만큼 미리 보임 (스와이프 가능 힌트)
 */
export default function OutfitGrid({ items, count = 6, season, thickness }: OutfitGridProps) {
  const { log } = useWearLog();
  const [selected, setSelected] = useState<Outfit | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef    = useRef<HTMLDivElement>(null);
  const [dragLimit, setDragLimit] = useState(0); // 좌측으로 끌 수 있는 최대 거리(px)

  const outfits = useMemo(() => {
    if (items.length < 3) return [];
    const idleByItem: Record<string, number> = {};
    for (const item of items) {
      const dates = log[item.id] ?? [];
      idleByItem[item.id] = dates.length > 0 ? daysSince(dates[0]) : 9999;
    }
    return generateOutfits(items, idleByItem, { season, thickness, count });
  }, [items, log, season, thickness, count]);

  // 트랙 폭 측정 — dragConstraints 계산
  useEffect(() => {
    function measure() {
      const viewport = viewportRef.current;
      const track    = trackRef.current;
      if (!viewport || !track) return;
      const overflow = track.scrollWidth - viewport.clientWidth;
      setDragLimit(Math.max(0, overflow));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [outfits]);

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

        {/* viewport — 클립 영역. CARD p-5 양끝까지 풀 블리드 */}
        <div ref={viewportRef} className="-mx-5 px-5 overflow-hidden">
          {/* track — 가로로 늘어선 카드들. drag="x" 로 끌고, touchAction: pan-y 로 세로 통과 */}
          <motion.div
            ref={trackRef}
            drag="x"
            dragConstraints={{ right: 0, left: -dragLimit }}
            dragElastic={0.1}
            dragMomentum
            className="flex gap-2.5 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'pan-y' }}
          >
            {outfits.map((o, i) => (
              <div
                key={o.id}
                className="shrink-0"
                style={{ width: 'calc((100vw - 2.5rem - 0.625rem) / 1.3)', maxWidth: '320px' }}
              >
                <OutfitCard outfit={o} index={i} onClick={() => setSelected(o)} />
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          {outfits.length}개 코디 · 좌우로 끌어보세요
        </p>
      </motion.div>

      <OutfitDetailModal outfit={selected} onClose={() => setSelected(null)} />
    </>
  );
}
