'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { mockCartItems } from '@/data/mockData';
import { CartItem }      from '@/types';
import CartItemCard      from '@/components/CartItemCard';
import TextImportModal   from '@/components/TextImportModal';
import { BentoGrid, getBentoSpan } from '@/components/BentoGrid';
import StatsWidget       from '@/components/StatsWidget';

export default function HomePage() {
  const [toast, setToast]         = useState<string | null>(null);
  const [items, setItems]         = useState<CartItem[]>(mockCartItems);
  const [showModal, setShowModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleReorder(item: CartItem) {
    showToast(`"${item.name}" 재구매 요청이 접수됐어요!`);
  }

  function handleDiscard(item: CartItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setFavorites((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
    showToast(`"${item.name}" 소진 처리됐어요.`);
  }

  function handleImport(newItems: CartItem[]) {
    setItems((prev) => [...prev, ...newItems]);
    showToast(`${newItems.length}개 상품이 추가됐어요!`);
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('즐겨찾기에서 제거했어요.');
      } else {
        next.add(id);
        showToast('즐겨찾기에 추가했어요!');
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen">

      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Smart Cart Plus</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">라이프스타일 AI 매니저</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white text-xs font-semibold px-3 py-1.5"
          >
            + 상품 추가
          </button>
        </div>
      </header>

      {/* ── 대시보드 콘텐츠 ── */}
      <div className="px-4 py-5">
        <BentoGrid>
          <StatsWidget items={items} />
          {items.map((item, index) => (
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
                isFavorite={favorites.has(item.id)}
                onReorder={handleReorder}
                onDiscard={handleDiscard}
                onToggleFavorite={toggleFavorite}
              />
            </motion.div>
          ))}
        </BentoGrid>

        {items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🛒</p>
            <p className="text-sm font-medium">아직 상품이 없어요</p>
            <p className="text-xs mt-1">상품 추가 버튼을 눌러 시작해보세요.</p>
          </div>
        )}
      </div>

      {/* ── 모달 ── */}
      {showModal && (
        <TextImportModal
          onClose={() => setShowModal(false)}
          onImport={handleImport}
        />
      )}

      {/* ── 토스트 ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4"
          >
            <div className="rounded-2xl bg-gray-900 text-white text-sm font-medium px-4 py-3 text-center shadow-lg">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
