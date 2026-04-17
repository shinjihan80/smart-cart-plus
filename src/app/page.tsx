'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { mockCartItems } from '@/data/mockData';
import { CartItem }      from '@/types';
import CartItemCard      from '@/components/CartItemCard';
import TextImportModal   from '@/components/TextImportModal';
import { BentoGrid, getBentoSpan } from '@/components/BentoGrid';
import StatsWidget       from '@/components/StatsWidget';
import FavoritesTab      from '@/components/FavoritesTab';
import MyPageTab         from '@/components/MyPageTab';

type NavTab = '주문 내역' | '즐겨찾기' | '마이페이지';

const NAV_ITEMS: { label: NavTab; emoji: string }[] = [
  { label: '주문 내역', emoji: '🛍️' },
  { label: '즐겨찾기', emoji: '❤️' },
  { label: '마이페이지', emoji: '👤' },
];

const TAB_SUBTITLE: Record<NavTab, string> = {
  '주문 내역': '← → 스와이프로 소진·재구매 처리',
  '즐겨찾기':  '자주 구매하는 상품 모음',
  '마이페이지': '통계 및 설정',
};

export default function HomePage() {
  const [toast, setToast]               = useState<string | null>(null);
  const [items, setItems]               = useState<CartItem[]>(mockCartItems);
  const [showModal, setShowModal]       = useState(false);
  const [activeTab, setActiveTab]       = useState<NavTab>('주문 내역');
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());
  const [discardCount, setDiscardCount] = useState(0);

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
    setDiscardCount((prev) => prev + 1);
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

  const AddButton = ({ mobile }: { mobile?: boolean }) => (
    <button
      onClick={() => setShowModal(true)}
      className={mobile
        ? 'shrink-0 rounded-2xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors'
        : 'rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white text-sm font-semibold px-4 py-2'
      }
    >
      + 상품 추가
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ 모바일 상단 헤더 ══ */}
      <header className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Smart Cart Plus</h1>
          <span className="text-xs text-gray-400">{items.length}개 상품</span>
        </div>
        <div className="px-4">
          <nav className="flex gap-x-6">
            {NAV_ITEMS.map(({ label }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`pb-2.5 text-sm transition-colors ${
                  activeTab === label
                    ? 'font-semibold text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ══ 데스크탑 레이아웃 ══ */}
      <div className="lg:flex lg:h-screen lg:overflow-hidden">

        {/* ── 사이드바 ── */}
        <aside className="hidden lg:flex lg:flex-col lg:w-56 xl:w-64 lg:shrink-0 bg-white border-r border-gray-100 lg:sticky lg:top-0 lg:h-screen">
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Smart Cart Plus</h1>
            <p className="text-xs text-gray-400 mt-0.5">라이프스타일 AI 매니저</p>
          </div>
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, emoji }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors text-left ${
                  activeTab === label
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <span className="text-base">{emoji}</span>
                {label}
                {label === '즐겨찾기' && favorites.size > 0 && (
                  <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">
                    {favorites.size}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">총 {items.length}개 상품 관리 중</p>
          </div>
        </aside>

        {/* ── 메인 콘텐츠 ── */}
        <main className="flex-1 lg:overflow-y-auto pb-24 lg:pb-0">

          {/* 데스크탑 상단 바 */}
          <div className="hidden lg:flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
            <div>
              <h2 className="text-base font-semibold text-gray-800">{activeTab}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{TAB_SUBTITLE[activeTab]}</p>
            </div>
            {activeTab === '주문 내역' && <AddButton />}
          </div>

          {/* ── 주문 내역 탭 ── */}
          {activeTab === '주문 내역' && (
            <div className="px-4 py-5 lg:px-8 lg:py-6">
              {/* 모바일 섹션 타이틀 */}
              <div className="mb-4 flex items-start justify-between lg:hidden">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">주문 내역</h2>
                  <p className="text-xs text-gray-400 mt-0.5">← → 스와이프로 소진·재구매</p>
                </div>
                <AddButton mobile />
              </div>

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
          )}

          {/* ── 즐겨찾기 탭 ── */}
          {activeTab === '즐겨찾기' && (
            <FavoritesTab
              items={items}
              favorites={favorites}
              onReorder={handleReorder}
              onDiscard={handleDiscard}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {/* ── 마이페이지 탭 ── */}
          {activeTab === '마이페이지' && (
            <MyPageTab
              items={items}
              favoriteCount={favorites.size}
              discardCount={discardCount}
            />
          )}
        </main>
      </div>

      {/* ══ 모바일 하단 네비게이션 ══ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-gray-100 flex">
        {NAV_ITEMS.map(({ label, emoji }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
              activeTab === label ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl relative">
              {emoji}
              {label === '즐겨찾기' && favorites.size > 0 && (
                <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {favorites.size}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* ══ 모달 ══ */}
      {showModal && (
        <TextImportModal
          onClose={() => setShowModal(false)}
          onImport={handleImport}
        />
      )}

      {/* ══ 토스트 ══ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4"
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
