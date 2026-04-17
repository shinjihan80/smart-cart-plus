'use client';

import { CartItem, isFoodItem, isClothingItem } from '@/types';
import FoodTags     from './FoodTags';
import ClothingTags from './ClothingTags';

interface Props {
  item: CartItem;
  onReorder: (item: CartItem) => void;
}

const CATEGORY_ICON: Record<string, string> = {
  식품:    '🛒',
  의류:    '👗',
  액세서리: '💍',
};

export default function CartItemCard({ item, onReorder }: Props) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col gap-y-1">
      {/* 상단: 카테고리 아이콘 + 상품명 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{CATEGORY_ICON[item.category] ?? '📦'}</span>
          <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{item.name}</p>
        </div>
        <span className="shrink-0 text-xs text-gray-400 mt-0.5">{item.category}</span>
      </div>

      {/* 중단: 태그 영역 */}
      {isFoodItem(item)     && <FoodTags     item={item} />}
      {isClothingItem(item) && <ClothingTags item={item} />}

      {/* 하단: 재구매하기 버튼 */}
      <div className="flex justify-end mt-3">
        <button
          onClick={() => onReorder(item)}
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white text-xs font-semibold px-4 py-2"
        >
          재구매하기
        </button>
      </div>
    </div>
  );
}
