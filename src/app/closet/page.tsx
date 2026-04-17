'use client';

import { motion } from 'framer-motion';
import { isClothingItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { Wind, Thermometer, Droplets } from 'lucide-react';

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

export default function ClosetPage() {
  const { items: allItems } = useCart();
  const items = allItems.filter(isClothingItem);
  const clothesCount    = items.filter((c) => c.category === '의류').length;
  const accessoryCount  = items.filter((c) => c.category === '액세서리').length;
  const thinCount       = items.filter((c) => c.thickness === '얇음').length;
  const thickCount      = items.filter((c) => c.thickness === '두꺼움').length;

  return (
    <div>
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 옷장</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">의류·액세서리 {items.length}개 관리 중</p>
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

        {/* 아이템 리스트 */}
        {items.map((item, index) => {
          const thick = THICKNESS_STYLE[item.thickness];
          const ThickIcon = thick.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 + index * 0.06 }}
              className={`${CARD} flex items-center gap-4`}
              style={CARD_SHADOW}
            >
              {/* 사이즈 */}
              <div className="shrink-0 w-14 text-center">
                <p className="text-2xl font-extrabold tracking-tight text-gray-900">
                  {item.size}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">사이즈</p>
              </div>

              {/* 상품 정보 */}
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
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👔</p>
            <p className="text-sm font-medium">옷장이 비어있어요</p>
            <p className="text-xs mt-1">홈에서 의류를 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
