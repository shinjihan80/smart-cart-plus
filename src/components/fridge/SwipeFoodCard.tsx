'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { FOOD_EMOJI, type FoodItem } from '@/types';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';
import { springTransition, CARD_SHADOW, STORAGE_ICON, STORAGE_STYLE } from './shared';

interface SwipeFoodCardProps {
  item:      FoodItem;
  dDay:      number;
  index:     number;
  onDiscard: (id: string) => void;
  onUpdate:  (id: string, updates: Partial<FoodItem>) => void;
}

export default function SwipeFoodCard({ item, dDay, index, onDiscard, onUpdate }: SwipeFoodCardProps) {
  const [expanded, setExpanded] = useState(false);
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
    if (info.offset.x < -80) {
      navigator.vibrate?.(30);
      onDiscard(item.id);
    }
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
        <motion.div style={{ opacity: discardOpacity }} className="flex flex-col items-center gap-0.5">
          <span className="text-xl">🗑️</span>
          <span className="text-[9px] font-semibold text-brand-warning">소진</span>
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -130, right: 0 }}
        dragElastic={0.12}
        style={{ x, backgroundColor: bgColor, ...CARD_SHADOW }}
        onDragEnd={handleDragEnd}
        onClick={() => setExpanded(!expanded)}
        className="rounded-[32px] border border-gray-50 p-5 flex flex-col relative z-10 cursor-grab"
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-11 h-11 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">{FOOD_EMOJI[item.foodCategory] ?? '📦'}</span>
            )}
          </div>
          <div className="shrink-0 w-14 text-center">
            <p className={`text-xl font-extrabold tracking-tight tabular-nums ${
              isUrgent ? 'text-brand-warning' : 'text-gray-900'
            }`}>
              {dDay <= 0 ? '만료' : `D-${dDay}`}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
            {item.memo && <p className="text-[9px] text-gray-400 truncate mt-0.5">📝 {item.memo}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
                <Icon size={10} />
                {style.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium">
                {FOOD_EMOJI[item.foodCategory] ?? '📦'} {item.foodCategory ?? '기타'}
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    dDay <= 2 ? 'bg-brand-warning' : dDay <= 5 ? 'bg-amber-400' : 'bg-brand-success'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, (dDay / item.baseShelfLifeDays) * 100))}%` }}
                />
              </div>
            </div>
            {item.nutritionFacts && (
              <div className="flex gap-2 mt-1.5">
                <span className="text-[9px] text-gray-400 tabular-nums">{item.nutritionFacts.calories}kcal</span>
                <span className="text-[9px] text-gray-300">|</span>
                <span className="text-[9px] text-gray-400 tabular-nums">단 {item.nutritionFacts.protein}g</span>
                <span className="text-[9px] text-gray-300">|</span>
                <span className="text-[9px] text-gray-400 tabular-nums">지 {item.nutritionFacts.fat}g</span>
                <span className="text-[9px] text-gray-300">|</span>
                <span className="text-[9px] text-gray-400 tabular-nums">탄 {item.nutritionFacts.carbs}g</span>
              </div>
            )}
          </div>

          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            dDay <= 0 ? 'bg-gray-400' :
            dDay <= 2 ? 'bg-brand-warning' :
            dDay <= 5 ? 'bg-amber-400' :
            'bg-brand-success'
          }`} />
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2.5 text-[10px]">
                {item.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                      <button
                        aria-label="사진 변경"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const file = await pickImage();
                          if (!file) return;
                          const dataUrl = await resizeAndEncode(file);
                          onUpdate(item.id, { imageUrl: dataUrl });
                        }}
                        className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-xs hover:bg-black/60"
                      >📷</button>
                      <button
                        aria-label="사진 삭제"
                        onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { imageUrl: undefined }); }}
                        className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-xs hover:bg-black/60"
                      >✕</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const file = await pickImage();
                      if (!file) return;
                      const dataUrl = await resizeAndEncode(file);
                      onUpdate(item.id, { imageUrl: dataUrl });
                    }}
                    className="h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-1.5 text-gray-400 hover:border-brand-primary/30 hover:text-brand-primary transition-colors"
                  >
                    <span className="text-lg">📷</span>
                    <span className="text-[10px] font-medium">사진 추가</span>
                  </button>
                )}
                <div>
                  <span className="text-gray-400">상품명</span>
                  <input
                    type="text"
                    defaultValue={item.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== item.name) onUpdate(item.id, { name: v });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-0.5 text-xs text-gray-800 font-medium bg-gray-50 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">구매일</span>
                    <input
                      type="date"
                      defaultValue={item.purchaseDate}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (v && v !== item.purchaseDate) onUpdate(item.id, { purchaseDate: v });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full mt-0.5 text-xs text-gray-700 font-medium bg-gray-50 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums"
                    />
                  </div>
                  <div>
                    <span className="text-gray-400">보관 만료</span>
                    <p className={`font-medium tabular-nums mt-0.5 ${dDay <= 3 ? 'text-brand-warning' : 'text-gray-700'}`}>
                      {(() => {
                        const d = new Date(item.purchaseDate);
                        d.setDate(d.getDate() + item.baseShelfLifeDays);
                        return d.toISOString().split('T')[0];
                      })()}
                    </p>
                  </div>
                </div>
                {item.nutritionFacts && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400">칼로리</span>
                      <p className="text-gray-700 font-medium tabular-nums mt-0.5">{item.nutritionFacts.calories} kcal</p>
                    </div>
                    <div>
                      <span className="text-gray-400">영양소</span>
                      <p className="text-gray-700 font-medium tabular-nums mt-0.5">
                        단{item.nutritionFacts.protein} · 지{item.nutritionFacts.fat} · 탄{item.nutritionFacts.carbs}g
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">보관 가능 일수</span>
                  <input
                    type="number"
                    defaultValue={item.baseShelfLifeDays}
                    min={1}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (v > 0 && v !== item.baseShelfLifeDays) onUpdate(item.id, { baseShelfLifeDays: v });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 mt-0.5 text-xs text-gray-700 font-medium bg-gray-50 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums"
                  />
                </div>
                <div>
                  <span className="text-gray-400">메모</span>
                  <input
                    type="text"
                    defaultValue={item.memo ?? ''}
                    placeholder="메모를 입력하세요"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (item.memo ?? '')) onUpdate(item.id, { memo: v || undefined });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-0.5 text-xs text-gray-800 bg-gray-50 rounded-xl px-2.5 py-1.5 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const text = `🧊 ${item.name}\n📅 D-${dDay} (${item.storageType})\n${item.memo ? `📝 ${item.memo}` : ''}`.trim();
                    navigator.clipboard.writeText(text);
                    navigator.vibrate?.(15);
                  }}
                  className="w-full py-1.5 rounded-xl bg-gray-50 text-[10px] text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  📋 정보 복사하기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
