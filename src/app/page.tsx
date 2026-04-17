'use client';

import { useState } from 'react';
import { mockCartItems } from '@/data/mockData';
import { CartItem }      from '@/types';
import CartItemCard      from '@/components/CartItemCard';
import TextImportModal   from '@/components/TextImportModal';

type NavTab = '주문 내역' | '즐겨찾기' | '마이페이지';

const NAV_ITEMS: { label: NavTab; emoji: string }[] = [
  { label: '주문 내역', emoji: '🛍️' },
  { label: '즐겨찾기', emoji: '❤️' },
  { label: '마이페이지', emoji: '👤' },
];

export default function HomePage() {
  const [toast, setToast]         = useState<string | null>(null);
  const [items, setItems]         = useState<CartItem[]>(mockCartItems);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('주문 내역');

  function handleReorder(item: CartItem) {
    setToast(`"${item.name}" 재구매 요청이 접수됐어요!`);
    setTimeout(() => setToast(null), 2500);
  }

  function handleImport(newItems: CartItem[]) {
    setItems((prev) => [...prev, ...newItems]);
    setToast(`${newItems.length}개 상품이 추가됐어요!`);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ 모바일 상단 헤더 (데스크탑에서 숨김) ══ */}
      <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Smart Cart Plus</h1>
          <span className="text-xs text-gray-400">{items.length}개 상품</span>
        </div>
        {/* 모바일 탭 바 */}
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

      {/* ══ 데스크탑 레이아웃 래퍼 ══ */}
      <div className="lg:flex lg:h-screen lg:overflow-hidden">

        {/* ── 데스크탑 사이드바 (모바일에서 숨김) ── */}
        <aside className="hidden lg:flex lg:flex-col lg:w-56 xl:w-64 lg:shrink-0 bg-white border-r border-gray-100 lg:sticky lg:top-0 lg:h-screen">
          {/* 로고 */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Smart Cart Plus</h1>
            <p className="text-xs text-gray-400 mt-0.5">라이프스타일 AI 매니저</p>
          </div>

          {/* 사이드 네비게이션 */}
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
              </button>
            ))}
          </nav>

          {/* 사이드바 하단 */}
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">총 {items.length}개 상품 관리 중</p>
          </div>
        </aside>

        {/* ── 메인 콘텐츠 영역 ── */}
        <main className="flex-1 lg:overflow-y-auto pb-20 lg:pb-0">

          {/* 데스크탑 상단 바 (모바일에서 숨김) */}
          <div className="hidden lg:flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 sticky top-0 z-10">
            <div>
              <h2 className="text-base font-semibold text-gray-800">{activeTab}</h2>
              <p className="text-xs text-gray-400 mt-0.5">구매하신 상품의 보관 상태와 정보를 확인하세요.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white text-sm font-semibold px-4 py-2"
            >
              + 텍스트로 추가
            </button>
          </div>

          {/* 콘텐츠 패딩 영역 */}
          <div className="px-4 py-5 lg:px-8 lg:py-6">

            {/* 모바일 전용: 섹션 타이틀 + 추가 버튼 */}
            <div className="mb-4 flex items-start justify-between lg:hidden">
              <div>
                <h2 className="text-base font-semibold text-gray-800">{activeTab}</h2>
                <p className="text-xs text-gray-400 mt-0.5">보관 상태와 정보를 확인하세요.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="shrink-0 rounded-2xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                + 텍스트로 추가
              </button>
            </div>

            {/* 카드 그리드 — 모바일 1열 / 태블릿 2열 / 데스크탑 3열 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((item) => (
                <CartItemCard key={item.id} item={item} onReorder={handleReorder} />
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🛒</p>
                <p className="text-sm font-medium">아직 상품이 없어요</p>
                <p className="text-xs mt-1">텍스트로 추가 버튼을 눌러 시작해보세요.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══ 모바일 하단 네비게이션 (데스크탑에서 숨김) ══ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 flex">
        {NAV_ITEMS.map(({ label, emoji }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              activeTab === label ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* ══ 텍스트 임포트 모달 ══ */}
      {showModal && (
        <TextImportModal
          onClose={() => setShowModal(false)}
          onImport={handleImport}
        />
      )}

      {/* ══ 토스트 알림 ══ */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4">
          <div className="rounded-2xl bg-gray-900 text-white text-sm font-medium px-4 py-3 text-center shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
