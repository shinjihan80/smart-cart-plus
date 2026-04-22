'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { isEnrichedClothingItem, isClothingItem, FASHION_EMOJI, type ClothingItem } from '@/types';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';
import type { MatchBadge } from '@/lib/weather';
import { useWearLog, daysSince } from '@/lib/wearLog';
import { useCart } from '@/context/CartContext';
import { haptic } from '@/lib/haptics';
import { useToast } from '@/context/ToastContext';
import { useProfiles } from '@/lib/profile';
import { compareSize } from '@/lib/sizeRecommend';
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
  const [editing, setEditing]   = useState(false);
  const { getEntry, markWorn, undoLast, getCoWornWith } = useWearLog();
  const { items: allItems } = useCart();
  const { showToast } = useToast();
  const { profiles } = useProfiles();
  const owner = item.ownerId ? profiles.find((p) => p.id === item.ownerId) : null;
  // 사이즈 매칭 — 소유자가 지정되어 있으면 해당 프로필 기준, 아니면 본인(isMain)
  const sizeReference = owner ?? profiles.find((p) => p.isMain) ?? null;
  const sizeMatch = sizeReference ? compareSize(item.category, item.size, sizeReference.body) : { status: 'unknown' as const, label: '' };
  const wear = getEntry(item.id);
  const wornToday = wear.lastWorn === new Date().toISOString().split('T')[0];
  const daysAgo = wear.lastWorn ? daysSince(wear.lastWorn) : null;
  const coWorn = getCoWornWith(item.id, 3)
    .map((co) => {
      const found = allItems.find((i) => i.id === co.id);
      if (!found || !isClothingItem(found)) return null;
      return { item: found, count: co.count };
    })
    .filter((x): x is { item: ClothingItem; count: number } => x !== null);
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
      haptic('action');
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
          <span className="text-[10px] font-semibold text-brand-warning">삭제</span>
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
              {matchBadge && (
                <span
                  className={`shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${MATCH_STYLE[matchBadge.level]}`}
                  title={matchBadge.label}
                >
                  <span>{matchBadge.emoji}</span>
                  <span>{matchBadge.label}</span>
                </span>
              )}
              {daysAgo !== null && (
                <span
                  className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    daysAgo === 0 ? 'bg-brand-success/10 text-brand-success' :
                    daysAgo <= 7 ? 'bg-gray-100 text-gray-500' :
                    daysAgo <= 30 ? 'bg-amber-50 text-amber-600' :
                    'bg-brand-warning/10 text-brand-warning'
                  }`}
                  title={`마지막 착용: ${wear.lastWorn}`}
                >
                  {daysAgo === 0 ? '오늘 착용' : `${daysAgo}일 전`}
                </span>
              )}
              {owner && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                  {owner.name}
                </span>
              )}
              {sizeMatch.status !== 'unknown' && sizeMatch.label && (
                <span
                  className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    sizeMatch.status === 'match' ? 'bg-brand-success/10 text-brand-success' :
                    sizeMatch.status === 'close' ? 'bg-sky-50 text-sky-600' :
                    'bg-brand-warning/10 text-brand-warning'
                  }`}
                  title={sizeMatch.detail}
                >
                  {sizeMatch.label}
                </span>
              )}
            </div>
            {item.memo && <p className="text-[10px] text-gray-400 truncate mt-0.5">📝 {item.memo}</p>}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${thick.bg} ${thick.text}`}>
                <ThickIcon size={10} />
                {item.thickness}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium">
                {item.material}
              </span>
              {item.weatherTags?.map((tag) => (
                <span
                  key={tag}
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${SEASON_TAG_STYLE[tag] ?? 'bg-gray-50 text-gray-400'}`}
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
              <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2.5 text-[11px]">
                {/* 이미지 — 편집 모드에서만 변경/삭제 버튼, 없으면 "사진 추가" 버튼 */}
                {item.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    {editing && (
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
                    )}
                  </div>
                ) : editing ? (
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
                    <span className="text-[11px] font-medium">사진 추가</span>
                  </button>
                ) : null}

                {/* 상품명 */}
                <div>
                  <span className="text-gray-400">상품명</span>
                  {editing ? (
                    <input
                      type="text"
                      aria-label={`${item.name} 상품명 수정`}
                      defaultValue={item.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== item.name) onUpdate(item.id, { name: v });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full mt-0.5 text-xs text-gray-800 font-medium bg-white border border-brand-primary/30 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  ) : (
                    <p className="text-xs text-gray-800 font-medium mt-0.5">{item.name}</p>
                  )}
                </div>

                {/* 사이즈 · 소재 · 두께 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">카테고리</span>
                    <p className="text-gray-700 font-medium mt-0.5">{item.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">사이즈</span>
                    {editing ? (
                      <input
                        type="text"
                        aria-label={`${item.name} 사이즈 수정`}
                        defaultValue={item.size}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== item.size) onUpdate(item.id, { size: v });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-brand-primary/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    ) : (
                      <p className="text-gray-700 font-medium mt-0.5">
                        {item.size}
                        {sizeMatch.detail && (
                          <span className="ml-1 text-[10px] text-gray-400 font-normal">
                            · {sizeReference?.name ?? '본인'} {sizeMatch.detail}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400">소재</span>
                    {editing ? (
                      <input
                        type="text"
                        aria-label={`${item.name} 소재 수정`}
                        defaultValue={item.material}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== item.material) onUpdate(item.id, { material: v });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-brand-primary/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    ) : (
                      <p className="text-gray-700 font-medium mt-0.5">{item.material}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400">두께</span>
                    {editing ? (
                      <div className="flex gap-1 mt-0.5">
                        {(['얇음', '보통', '두꺼움'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { thickness: t }); }}
                            className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                              item.thickness === t
                                ? 'bg-brand-primary text-white'
                                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-700 font-medium mt-0.5">{item.thickness}</p>
                    )}
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

                {/* 소유자 */}
                <div>
                  <span className="text-gray-400">소유자</span>
                  {editing ? (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { ownerId: undefined }); }}
                        className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                          !item.ownerId
                            ? 'bg-gray-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        공용
                      </button>
                      {profiles.map((p) => (
                        <button
                          key={p.id}
                          onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { ownerId: p.id }); }}
                          className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                            item.ownerId === p.id
                              ? 'bg-brand-primary text-white'
                              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                      <a
                        href="/settings#profiles"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-dashed border-brand-primary/40 text-brand-primary hover:bg-brand-primary/5 transition-colors"
                      >
                        + 추가
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-700 font-medium mt-0.5">{owner ? owner.name : '공용'}</p>
                  )}
                </div>

                {/* 메모 */}
                <div>
                  <span className="text-gray-400">메모</span>
                  {editing ? (
                    <input
                      type="text"
                      aria-label={`${item.name} 메모 수정`}
                      defaultValue={item.memo ?? ''}
                      placeholder="메모를 입력하세요"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (item.memo ?? '')) onUpdate(item.id, { memo: v || undefined });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-brand-primary/30 rounded-xl px-2.5 py-1.5 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  ) : (
                    <p className="text-gray-700 mt-0.5">{item.memo || <span className="text-gray-300">—</span>}</p>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400">착용 기록</p>
                    <p className="text-xs font-medium text-gray-700 tabular-nums">
                      {wear.count}회 · {wear.lastWorn ? `마지막 ${wear.lastWorn}` : '아직 없음'}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {wornToday ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          undoLast(item.id);
                          haptic('tap');
                          showToast(`"${item.name}" 오늘 착용 기록을 취소했어요.`);
                        }}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                      >
                        기록 취소
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markWorn(item.id);
                          haptic('toggle');
                          showToast(`"${item.name}" 오늘 착용 기록 완료 👕`);
                        }}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-primary text-white hover:opacity-90 transition-opacity"
                      >
                        👕 오늘 입었어요
                      </button>
                    )}
                    <label
                      onClick={(e) => e.stopPropagation()}
                      title="다른 날짜 기록"
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      📅
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          markWorn(item.id, e.target.value);
                          haptic('tap');
                          showToast(`"${item.name}" ${e.target.value} 착용으로 기록했어요.`);
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* 같이 입은 조합 — 3회+ 공동 착용한 옷 */}
                {coWorn.length > 0 && (
                  <div className="border-t border-gray-100 pt-2.5">
                    <p className="text-[11px] text-gray-400 mb-1.5">같이 자주 입는 조합</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {coWorn.map((co) => (
                        <div key={co.item.id} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-primary/5 border border-brand-primary/15 text-brand-primary">
                          <span>{FASHION_EMOJI[co.item.category] ?? '👕'}</span>
                          <span className="font-medium truncate max-w-[100px]">{co.item.name}</span>
                          <span className="text-[10px] text-brand-primary/60 tabular-nums">· {co.count}회</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editing) {
                      showToast(`"${item.name}" 저장됐어요.`);
                      setEditing(false);
                    } else {
                      setEditing(true);
                    }
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
                    editing
                      ? 'bg-brand-primary text-white hover:opacity-90'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {editing ? '✓ 저장하고 완료' : '✏️ 정보 수정'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
