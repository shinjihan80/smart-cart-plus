'use client';

import { motion } from 'framer-motion';
import { CartItem } from '@/types';
import CartItemCard from './CartItemCard';
import { BentoGrid, getBentoSpan } from './BentoGrid';

interface FavoritesTabProps {
  items:            CartItem[];
  favorites:        Set<string>;
  onReorder:        (item: CartItem) => void;
  onDiscard:        (item: CartItem) => void;
  onToggleFavorite: (id: string) => void;
}

export default function FavoritesTab({
  items, favorites, onReorder, onDiscard, onToggleFavorite,
}: FavoritesTabProps) {
  const favItems = items.filter((item) => favorites.has(item.id));

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-6">
      {/* 상단 카운트 */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">❤️</span>
          <h2 className="text-base font-semibold text-gray-800">즐겨찾기 상품</h2>
          <span className="text-xs text-gray-400">{favItems.length}개</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 ml-7">자주 구매하는 상품을 모아놨어요</p>
      </div>

      {favItems.length > 0 ? (
        <BentoGrid>
          {favItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2 } }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={getBentoSpan(index)}
            >
              <CartItemCard
                item={item}
                wide={index % 3 === 0}
                isFavorite={true}
                onReorder={onReorder}
                onDiscard={onDiscard}
                onToggleFavorite={onToggleFavorite}
              />
            </motion.div>
          ))}
        </BentoGrid>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">❤️</p>
          <p className="text-sm font-medium">아직 즐겨찾기가 없어요</p>
          <p className="text-xs mt-1">주문 내역에서 🤍를 눌러 추가해보세요</p>
        </div>
      )}
    </div>
  );
}
