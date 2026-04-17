'use client';

import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { CartItem, isFoodItem, isClothingItem } from '@/types';
import FoodTags    from './FoodTags';
import ClothingTags from './ClothingTags';

interface Props {
  item:              CartItem;
  wide?:             boolean;
  isFavorite?:       boolean;
  onReorder:         (item: CartItem) => void;
  onDiscard:         (item: CartItem) => void;
  onToggleFavorite?: (id: string) => void;
}

const CATEGORY_ICON: Record<string, string> = {
  식품:    '🥦',
  의류:    '👗',
  액세서리: '💍',
};

/**
 * CartItemCard — 벤토 UI + 스와이프 인터랙션
 *
 * 스와이프 동작:
 *   왼쪽 (-80px 초과)  →  🗑️ 소진/버리기 → onDiscard 호출
 *   오른쪽 (+80px 초과) →  🔄 재구매     → onReorder 호출
 *   중간 놓기           →  원위치 스냅백
 *
 * 디자인 토큰:
 *   - rounded-3xl (기존 rounded-2xl에서 업그레이드)
 *   - shadow 없음 + border border-gray-100
 *   - 핵심 숫자 text-3xl font-bold (FoodTags/ClothingTags에서 처리)
 */
export default function CartItemCard({ item, wide, isFavorite, onReorder, onDiscard, onToggleFavorite }: Props) {
  const x = useMotionValue(0);

  // 드래그 위치에 따라 카드 배경색 변환
  const bgColor = useTransform(
    x,
    [-120, -40, 0, 40, 120],
    [
      'rgb(255, 241, 242)', // rose-50 (소진)
      'rgb(255, 253, 251)',
      'rgb(255, 255, 255)', // white (기본)
      'rgb(253, 253, 255)',
      'rgb(238, 242, 255)', // indigo-50 (재구매)
    ],
  );

  // 액션 아이콘 투명도
  const discardOpacity  = useTransform(x, [-120, -40], [1, 0]);
  const reorderOpacity  = useTransform(x, [40, 120], [0, 1]);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -80) onDiscard(item);
    else if (info.offset.x > 80) onReorder(item);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl">

      {/* ── 뒤 레이어: 액션 아이콘 ── */}
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
        <motion.div style={{ opacity: reorderOpacity }} className="flex flex-col items-center gap-1">
          <span className="text-2xl">🔄</span>
          <span className="text-[10px] font-semibold text-brand-primary">재구매</span>
        </motion.div>
        <motion.div style={{ opacity: discardOpacity }} className="flex flex-col items-center gap-1">
          <span className="text-2xl">🗑️</span>
          <span className="text-[10px] font-semibold text-rose-500">소진</span>
        </motion.div>
      </div>

      {/* ── 앞 레이어: 드래그 가능 카드 ── */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -130, right: 130 }}
        dragElastic={0.12}
        style={{ x, backgroundColor: bgColor }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
        className="rounded-3xl border border-gray-100 p-4 flex flex-col cursor-grab relative z-10"
      >
        {/* 상단: 카테고리 아이콘 + 상품명 + 카테고리 라벨 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{CATEGORY_ICON[item.category] ?? '📦'}</span>
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
              {item.name}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {onToggleFavorite && (
              <button
                aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                className="text-base leading-none hover:scale-110 transition-transform"
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>
            )}
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {item.category}
            </span>
          </div>
        </div>

        {/* 중단: 태그 영역 */}
        {isFoodItem(item)     && <FoodTags     item={item} wide={wide} />}
        {isClothingItem(item) && <ClothingTags item={item} wide={wide} />}

        {/* 스와이프 힌트 (처음 한 번만) */}
        <div className="mt-3 flex items-center justify-center gap-1 opacity-20">
          <span className="text-[9px] text-gray-400">← 밀어서 소진 · 재구매 →</span>
        </div>
      </motion.div>
    </div>
  );
}
