'use client';

import { motion } from 'framer-motion';
import { foodItems } from '@/data/mockData';
import { calcRemainingDays } from '@/components/FoodTags';
import { Snowflake, Thermometer, Package } from 'lucide-react';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

const STORAGE_ICON = { 냉장: Snowflake, 냉동: Thermometer, 실온: Package } as const;
const STORAGE_STYLE = {
  냉장: { bg: 'bg-sky-50',    text: 'text-sky-600',     label: '냉장' },
  냉동: { bg: 'bg-indigo-50', text: 'text-indigo-600',  label: '냉동' },
  실온: { bg: 'bg-amber-50',  text: 'text-amber-600',   label: '실온' },
} as const;

export default function FridgePage() {
  const items = foodItems
    .map((f) => ({ ...f, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }))
    .sort((a, b) => a.dDay - b.dDay);

  const urgentCount = items.filter((i) => i.dDay <= 3).length;
  const coldCount   = items.filter((i) => i.storageType === '냉장').length;
  const frozenCount = items.filter((i) => i.storageType === '냉동').length;
  const roomCount   = items.filter((i) => i.storageType === '실온').length;

  return (
    <div>
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 냉장고</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">식품 {items.length}개 관리 중</p>
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

        {/* 아이템 리스트 */}
        {items.map((item, index) => {
          const style = STORAGE_STYLE[item.storageType];
          const Icon = STORAGE_ICON[item.storageType];
          const isUrgent = item.dDay <= 3;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 + index * 0.06 }}
              className={`${CARD} flex items-center gap-4`}
              style={CARD_SHADOW}
            >
              {/* D-Day */}
              <div className="shrink-0 w-16 text-center">
                <p className={`text-2xl font-extrabold tracking-tight tabular-nums ${
                  isUrgent ? 'text-brand-warning' : 'text-gray-900'
                }`}>
                  {item.dDay <= 0 ? '만료' : `D-${item.dDay}`}
                </p>
              </div>

              {/* 상품 정보 */}
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

              {/* 상태 인디케이터 */}
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                item.dDay <= 0 ? 'bg-gray-400' :
                item.dDay <= 2 ? 'bg-brand-warning' :
                item.dDay <= 5 ? 'bg-amber-400' :
                'bg-brand-success'
              }`} />
            </motion.div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🧊</p>
            <p className="text-sm font-medium">냉장고가 비어있어요</p>
            <p className="text-xs mt-1">홈에서 식품을 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
