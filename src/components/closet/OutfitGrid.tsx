'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ClothingItem } from '@/types';
import type { Outfit } from '@/lib/outfitMatcher';
import { useTodayOutfits } from '@/lib/useTodayOutfits';
import type { WeatherSnapshot } from '@/lib/weather';
import OutfitCard from './OutfitCard';
import dynamic from 'next/dynamic';
const OutfitDetailModal = dynamic(() => import('./OutfitDetailModal'), { ssr: false });
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface OutfitGridProps {
  items: ClothingItem[];
  count?: number;
  weather: WeatherSnapshot | null;
}

/**
 * 코디 그리드 — 옷장에서 자동 생성한 N개 코디.
 *
 * v6: 히어로 카드 1장 + 이전/다음 넘기기로 재설계.
 *   - v5의 "1.3장 노출 가로 캐러셀"은 카드가 작아 아이템을 알아보기 어렵고
 *     다음 카드가 슬쩍 잘려 보이는 게 오히려 산만하다는 피드백으로 교체.
 *   - 지금은 큰 카드 1장(4:3)을 화면 폭 그대로 보여주고, 좌우 화살표 +
 *     점 인디케이터로 나머지 후보를 넘겨본다 — "오늘 뭘 입을지" 하나를
 *     또렷하게 보여주는 데 집중.
 */
export default function OutfitGrid({ items, count = 6, weather }: OutfitGridProps) {
  const outfits = useTodayOutfits(items, weather, count);
  const [selected, setSelected] = useState<Outfit | null>(null);
  const [index, setIndex] = useState(0);

  if (outfits.length === 0) return null;

  const safeIndex = Math.min(index, outfits.length - 1);
  const current   = outfits[safeIndex];

  function go(delta: number) {
    setIndex((i) => (Math.min(i, outfits.length - 1) + delta + outfits.length) % outfits.length);
  }

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
          <span className="text-xs text-gray-400 tabular-nums">{safeIndex + 1}/{outfits.length}</span>
        </div>

        {/* 큰 히어로 카드 1장 — 아이템이 또렷이 보이도록 화면 폭 그대로.
            화살표는 카드 위에 얹지 않고 카드 아래 별도 줄에 둔다 — 이전엔
            콜라주 이미지 위에 absolute로 겹쳐 그림을 가리고, 36px라 터치
            타깃(44px) 기준에도 못 미쳤다(전문단 E2 발견). */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <OutfitCard outfit={current} onClick={() => setSelected(current)} size="hero" />
          </motion.div>
        </AnimatePresence>

        {outfits.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="이전 코디"
              className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ChevronLeft size={20} strokeWidth={2.4} />
            </button>
            {outfits.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}번째 코디 보기`}
                aria-current={i === safeIndex}
                className="w-9 h-9 shrink-0 flex items-center justify-center"
              >
                <span className={`block h-1.5 rounded-full transition-all ${i === safeIndex ? 'w-5 bg-brand-primary' : 'w-1.5 bg-gray-200'}`} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="다음 코디"
              className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ChevronRight size={20} strokeWidth={2.4} />
            </button>
          </div>
        )}
      </motion.div>

      <OutfitDetailModal outfit={selected} onClose={() => setSelected(null)} />
    </>
  );
}
