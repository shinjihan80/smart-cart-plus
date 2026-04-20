'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { isEnrichedClothingItem, FASHION_EMOJI, type ClothingItem } from '@/types';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';
import type { MatchBadge } from '@/lib/weather';
import { springTransition, CARD_SHADOW, THICKNESS_STYLE, SEASON_TAG_STYLE, MATCH_STYLE } from './shared';

interface SwipeClothingCardProps {
  item:       ClothingItem;
  index:      number;
  onRemove:   (id: string) => void;
  onUpdate:   (id: string, updates: Partial<ClothingItem>) => void;
  matchBadge?: MatchBadge;
}

export default function SwipeClothingCard({ item, index, onRemove, onUpdate, matchBadge }: SwipeClothingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const x = useMotionValue(0);
  const bgColor = useTransform(
    x, [-120, -30, 0],
    ['rgb(255,241,242)', 'rgb(255,254,253)', 'rgb(255,255,255)'],
  );
  const removeOpacity = useTransform(x, [-120, -40], [1, 0]);

  const thick = THICKNESS_STYLE[item.thickness];
  const ThickIcon = thick.icon;

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -80) {
      navigator.vibrate?.(30);
      onRemove(item.id);
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
        onClick={() => setExpanded(!expanded)}
        className="rounded-[32px] border border-gray-50 p-5 flex flex-col relative z-10 cursor-grab"
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-11 h-11 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">{FASHION_EMOJI[item.category] ?? '📦'}</span>
            )}
          </div>
          <div className="shrink-0 w-10 text-center">
            <p className="text-lg font-extrabold tracking-tight text-gray-900">{item.size}</p>
            <p className="text-[8px] text-gray-400">사이즈</p>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
              {matchBadge && (
                <span
                  className={`shrink-0 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${MATCH_STYLE[matchBadge.level]}`}
                  title={matchBadge.label}
                >
                  <span>{matchBadge.emoji}</span>
                  <span>{matchBadge.label}</span>
                </span>
              )}
            </div>
            {item.memo && <p className="text-[9px] text-gray-400 truncate mt-0.5">📝 {item.memo}</p>}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
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
                    <span className="text-gray-400">카테고리</span>
                    <p className="text-gray-700 font-medium mt-0.5">{item.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">소재</span>
                    <p className="text-gray-700 font-medium mt-0.5">{item.material}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">두께</span>
                    <p className="text-gray-700 font-medium mt-0.5">{item.thickness}</p>
                  </div>
                  {item.colorFamily && (
                    <div>
                      <span className="text-gray-400">컬러 패밀리</span>
                      <p className="text-gray-700 font-medium mt-0.5">{item.colorFamily}</p>
                    </div>
                  )}
                  {isEnrichedClothingItem(item) && item.washingTip && (
                    <div className="col-span-2">
                      <span className="text-gray-400">세탁 방법</span>
                      <p className="text-gray-700 font-medium mt-0.5">{item.washingTip}</p>
                    </div>
                  )}
                  {item.weatherTags && item.weatherTags.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-400">추천 시즌</span>
                      <p className="text-gray-700 font-medium mt-0.5">{item.weatherTags.join(', ')}</p>
                    </div>
                  )}
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
                    const text = `👕 ${item.name}\n📏 ${item.size} · ${item.material}\n${item.memo ? `📝 ${item.memo}` : ''}`.trim();
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
