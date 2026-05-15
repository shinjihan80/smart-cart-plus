'use client';

import { getFashionCategoryTone } from '@/lib/categoryImages';
import { outfitItemList, type Outfit } from '@/lib/outfitMatcher';

interface OutfitCardProps {
  outfit:  Outfit;
  onClick: () => void;
  index?:  number;
}

/**
 * 코디 카드 — 이미지 콜라주 위주.
 *
 * - 정사각형 카드, 2x2 그리드 콜라주
 * - 텍스트는 라벨만 (오버레이)
 * - 사진 없는 아이템은 카테고리 톤 + 이모지로 대체
 * - 클릭하면 상세 모달
 *
 * NOTE: framer-motion 의 whileTap/whileHover 는 포인터 캡쳐가 발생해
 * 가로 캐러셀 내부 세로 스크롤을 막을 수 있어 일반 <button>+CSS 로 구현
 */
export default function OutfitCard({ outfit, onClick, index: _index = 0 }: OutfitCardProps) {
  const items = outfitItemList(outfit).slice(0, 4); // 최대 4개 표시
  const filled = items.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square w-full overflow-hidden rounded-3xl bg-gray-50 ring-1 ring-gray-100 hover:ring-brand-primary/30 transition-all active:scale-[0.97]"
      style={{ touchAction: 'manipulation' }}
      aria-label={`${outfit.label} 코디 상세 보기`}
    >
      {/* 이미지 콜라주 — 2x2 또는 1x2 */}
      {filled === 1 ? (
        <SlotBox item={items[0]} />
      ) : filled === 2 ? (
        <div className="grid grid-cols-2 h-full w-full">
          <SlotBox item={items[0]} />
          <SlotBox item={items[1]} />
        </div>
      ) : (
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
          <SlotBox item={items[0]} />
          <SlotBox item={items[1]} />
          <SlotBox item={items[2]} />
          {items[3]
            ? <SlotBox item={items[3]} />
            : (
              <div className="flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                +
              </div>
            )}
        </div>
      )}

      {/* 라벨 오버레이 — 하단 그라데이션 */}
      <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
        <p className="text-xs font-bold text-white truncate text-left">
          {outfit.label}
        </p>
        <p className="text-[10px] text-white/80 truncate text-left">
          {filled}개 아이템 · 탭하면 상세
        </p>
      </div>
    </button>
  );
}

function SlotBox({ item }: { item: import('@/types').ClothingItem }) {
  const tone = getFashionCategoryTone(item.category);
  return (
    <div className={`relative w-full h-full overflow-hidden ${tone.bg} flex items-center justify-center`}>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <span className="text-3xl" aria-hidden>{tone.emoji}</span>
      )}
    </div>
  );
}
