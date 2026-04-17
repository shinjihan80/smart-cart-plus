'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { isFoodItem, type FoodItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { calcRemainingDays } from '@/components/FoodTags';
import { Snowflake, Thermometer, Package } from 'lucide-react';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

const STORAGE_ICON = { 냉장: Snowflake, 냉동: Thermometer, 실온: Package } as const;
const STORAGE_STYLE = {
  냉장: { bg: 'bg-sky-50',    text: 'text-sky-600',    label: '냉장' },
  냉동: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: '냉동' },
  실온: { bg: 'bg-amber-50',  text: 'text-amber-600',  label: '실온' },
} as const;

// ── 스와이프 아이템 카드 ──────────────────────────────────────────────────────
function SwipeFoodCard({
  item,
  dDay,
  index,
  onDiscard,
}: {
  item: FoodItem;
  dDay: number;
  index: number;
  onDiscard: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const bgColor = useTransform(
    x, [-120, -30, 0],
    ['rgb(255,241,242)', 'rgb(255,254,253)', 'rgb(255,255,255)'],
  );
  const discardOpacity = useTransform(x, [-120, -40], [1, 0]);
  const isUrgent = dDay <= 3;

  const style = STORAGE_STYLE[item.storageType];
  const Icon  = STORAGE_ICON[item.storageType];

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -80) onDiscard(item.id);
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
      {/* 뒤 레이어 */}
      <div className="absolute inset-0 flex items-center justify-end px-6 pointer-events-none">
        <motion.div style={{ opacity: discardOpacity }} className="flex flex-col items-center gap-0.5">
          <span className="text-xl">🗑️</span>
          <span className="text-[9px] font-semibold text-brand-warning">소진</span>
        </motion.div>
      </div>

      {/* 앞 레이어 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -130, right: 0 }}
        dragElastic={0.12}
        style={{ x, backgroundColor: bgColor, ...CARD_SHADOW }}
        onDragEnd={handleDragEnd}
        className="rounded-[32px] border border-gray-50 p-5 flex items-center gap-4 relative z-10 cursor-grab"
      >
        <div className="shrink-0 w-16 text-center">
          <p className={`text-2xl font-extrabold tracking-tight tabular-nums ${
            isUrgent ? 'text-brand-warning' : 'text-gray-900'
          }`}>
            {dDay <= 0 ? '만료' : `D-${dDay}`}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
              <Icon size={10} />
              {style.label}
            </span>
            <span className="text-[10px] text-gray-400 tabular-nums">
              {item.baseShelfLifeDays}일 보관
            </span>
          </div>
        </div>

        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          dDay <= 0 ? 'bg-gray-400' :
          dDay <= 2 ? 'bg-brand-warning' :
          dDay <= 5 ? 'bg-amber-400' :
          'bg-brand-success'
        }`} />
      </motion.div>
    </motion.div>
  );
}

export default function FridgePage() {
  const { items: allItems, removeItem } = useCart();
  const [toast, setToast] = useState<string | null>(null);

  const items = allItems.filter(isFoodItem)
    .map((f) => ({ ...f, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }))
    .sort((a, b) => a.dDay - b.dDay);

  const urgentCount = items.filter((i) => i.dDay <= 3).length;
  const coldCount   = items.filter((i) => i.storageType === '냉장').length;
  const frozenCount = items.filter((i) => i.storageType === '냉동').length;

  function handleDiscard(id: string) {
    const name = items.find((i) => i.id === id)?.name ?? '';
    removeItem(id);
    setToast(`"${name}" 소진 처리됐어요.`);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 냉장고</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">식품 {items.length}개 · ← 밀어서 소진 처리</p>
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
              <p className="text-2xl font-extrabold text-sky-600 tabular-nums">{coldCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">냉장</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-indigo-600 tabular-nums">{frozenCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">냉동</p>
            </div>
            <div>
              <p className={`text-2xl font-extrabold tabular-nums ${urgentCount > 0 ? 'text-brand-warning' : 'text-gray-900'}`}>
                {urgentCount}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">임박</p>
            </div>
          </div>
        </motion.div>

        {/* 아이템 리스트 (스와이프 삭제) */}
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <SwipeFoodCard
              key={item.id}
              item={item}
              dDay={item.dDay}
              index={index}
              onDiscard={handleDiscard}
            />
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🧊</p>
            <p className="text-sm font-medium">냉장고가 비어있어요</p>
            <p className="text-xs mt-1">+ 버튼을 눌러 식품을 추가해보세요.</p>
          </div>
        )}
      </div>

      {/* 토스트 */}
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
