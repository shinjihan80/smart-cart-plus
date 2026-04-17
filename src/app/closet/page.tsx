'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { isClothingItem, type ClothingItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Wind, Thermometer, Droplets, Search } from 'lucide-react';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

const THICKNESS_STYLE = {
  얇음:   { bg: 'bg-sky-50',    text: 'text-sky-600',    icon: Wind },
  보통:   { bg: 'bg-slate-100', text: 'text-slate-600',  icon: Thermometer },
  두꺼움: { bg: 'bg-purple-50', text: 'text-purple-600', icon: Droplets },
} as const;

const CATEGORY_EMOJI: Record<string, string> = { 의류: '👗', 액세서리: '💍' };

const SEASON_TAG_STYLE: Record<string, string> = {
  봄: 'bg-pink-50 text-pink-500',
  여름: 'bg-amber-50 text-amber-500',
  가을: 'bg-orange-50 text-orange-500',
  겨울: 'bg-blue-50 text-blue-500',
};

// ── 스와이프 의류 카드 ────────────────────────────────────────────────────────
function SwipeClothingCard({
  item, index, onRemove,
}: {
  item: ClothingItem; index: number; onRemove: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const bgColor = useTransform(
    x, [-120, -30, 0],
    ['rgb(255,241,242)', 'rgb(255,254,253)', 'rgb(255,255,255)'],
  );
  const removeOpacity = useTransform(x, [-120, -40], [1, 0]);

  const thick = THICKNESS_STYLE[item.thickness];
  const ThickIcon = thick.icon;

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -80) onRemove(item.id);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
      transition={{ ...springTransition, delay: 0.1 + index * 0.04 }}
      className="relative overflow-hidden rounded-[32px]"
    >
      <div className="absolute inset-0 flex items-center justify-end px-6 pointer-events-none">
        <motion.div style={{ opacity: removeOpacity }} className="flex flex-col items-center gap-0.5">
          <span className="text-xl">🗑️</span>
          <span className="text-[9px] font-semibold text-brand-warning">삭제</span>
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -130, right: 0 }}
        dragElastic={0.12}
        style={{ x, backgroundColor: bgColor, ...CARD_SHADOW }}
        onDragEnd={handleDragEnd}
        className="rounded-[32px] border border-gray-50 p-5 flex items-center gap-4 relative z-10 cursor-grab"
      >
        <div className="shrink-0 w-14 text-center">
          <p className="text-2xl font-extrabold tracking-tight text-gray-900">{item.size}</p>
          <p className="text-[9px] text-gray-400 mt-0.5">사이즈</p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{CATEGORY_EMOJI[item.category] ?? '📦'}</span>
            <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${thick.bg} ${thick.text}`}>
              <ThickIcon size={10} />
              {item.thickness}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium">
              {item.material}
            </span>
            {item.weatherTags?.map((tag) => (
              <span
                key={tag}
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SEASON_TAG_STYLE[tag] ?? 'bg-gray-50 text-gray-400'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

type CategoryFilter = '전체' | '의류' | '액세서리';
type ClosetSort = 'name' | 'thickness';

const THICKNESS_ORDER = { 얇음: 0, 보통: 1, 두꺼움: 2 } as const;

export default function ClosetPage() {
  const { items: allItems, removeItem } = useCart();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('전체');
  const [sortBy, setSortBy] = useState<ClosetSort>('name');

  const allClothing = allItems.filter(isClothingItem);
  const items = allClothing
    .filter((i) => filter === '전체' || i.category === filter)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'name'
      ? a.name.localeCompare(b.name)
      : THICKNESS_ORDER[a.thickness] - THICKNESS_ORDER[b.thickness]
    );

  const clothesCount   = allClothing.filter((c) => c.category === '의류').length;
  const accessoryCount = allClothing.filter((c) => c.category === '액세서리').length;
  const thinCount      = allClothing.filter((c) => c.thickness === '얇음').length;
  const thickCount     = allClothing.filter((c) => c.thickness === '두꺼움').length;

  function handleRemove(id: string) {
    const name = allClothing.find((i) => i.id === id)?.name ?? '';
    removeItem(id);
    showToast(`"${name}" 삭제됐어요.`);
  }

  const FILTERS: { key: CategoryFilter; label: string }[] = [
    { key: '전체',     label: '전체' },
    { key: '의류',     label: '👗 의류' },
    { key: '액세서리', label: '💍 액세서리' },
  ];

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 옷장</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">의류·액세서리 {allClothing.length}개 · ← 밀어서 삭제</p>
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">
        {/* 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className={CARD}
          style={CARD_SHADOW}
        >
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{items.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">전체</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-brand-primary tabular-nums">{clothesCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">의류</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-500 tabular-nums">{accessoryCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">액세서리</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-sky-500 tabular-nums">{thinCount}/{thickCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">얇/두꺼</p>
            </div>
          </div>
        </motion.div>

        {/* 검색 + 필터 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품 검색"
              className="w-full pl-8 pr-3 py-2 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-brand-primary text-white'
                    : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortBy(sortBy === 'name' ? 'thickness' : 'name')}
            className="text-[10px] text-gray-400 px-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {sortBy === 'name' ? '🔤 이름순' : '🧥 두께순'}
          </button>
        </div>

        {/* 아이템 리스트 (스와이프 삭제) */}
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <SwipeClothingCard
              key={item.id}
              item={item}
              index={index}
              onRemove={handleRemove}
            />
          ))}
        </AnimatePresence>

        {items.length === 0 && allClothing.length > 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium">검색 결과가 없어요</p>
            <button onClick={() => { setSearch(''); setFilter('전체'); }} className="text-xs text-brand-primary mt-1">
              필터 초기화
            </button>
          </div>
        )}

        {allClothing.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👔</p>
            <p className="text-sm font-medium">옷장이 비어있어요</p>
            <p className="text-xs mt-1">+ 버튼을 눌러 의류를 추가해보세요.</p>
          </div>
        )}
      </div>

    </div>
  );
}
