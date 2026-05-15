'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { isEnrichedClothingItem, isClothingItem, FASHION_EMOJI, type ClothingItem } from '@/types';
import { FASHION_ICON } from '@/lib/iconMap';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';
import { getFashionCategoryTone } from '@/lib/categoryImages';
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
  /** 부모가 관리하는 펼침 상태 — 한 번에 하나만 펼치게 */
  expanded?: boolean;
  onToggle?: () => void;
}

export default function SwipeClothingCard({ item, index, onRemove, onUpdate, matchBadge, expanded: expandedProp, onToggle }: SwipeClothingCardProps) {
  const [expandedLocal, setExpandedLocal] = useState(false);
  const expanded = expandedProp ?? expandedLocal;
  const toggleExpanded = onToggle ?? (() => setExpandedLocal((v) => !v));
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

  const thick = THICKNESS_STYLE[item.thickness];
  const ThickIcon = thick.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
      transition={{ ...springTransition, delay: 0.1 + index * 0.04 }}
      className="relative overflow-hidden rounded-[32px]"
    >
      <div
        style={{ backgroundColor: 'rgb(255,255,255)', ...CARD_SHADOW }}
        onClick={toggleExpanded}
        className="rounded-[32px] border border-gray-50 p-5 flex flex-col cursor-pointer"
      >
        <div className="flex items-start gap-3">
          {/* 좌측: 큰 사진 — 탭하면 변경/추가. 사진이 배경처럼 영역 꽉 채움. */}
          {(() => {
            const tone = getFashionCategoryTone(item.category);
            return (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  const file = await pickImage();
                  if (!file) return;
                  try {
                    const dataUrl = await resizeAndEncode(file);
                    onUpdate(item.id, { imageUrl: dataUrl });
                    showToast('사진이 변경됐어요.');
                  } catch {
                    showToast('사진 변경 실패');
                  }
                }}
                aria-label={item.imageUrl ? `${item.name} 사진 변경` : `${item.name} 사진 추가`}
                title={item.imageUrl ? '탭해서 사진 변경' : '탭해서 사진 추가'}
                className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center ${tone.bg} hover:ring-2 hover:ring-brand-primary/30 active:scale-95 transition-all`}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl" aria-hidden>{tone.emoji}</span>
                )}
                <span
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white/95 flex items-center justify-center text-[12px] shadow-md ring-1 ring-gray-100"
                  aria-hidden
                >
                  📷
                </span>
              </button>
            );
          })()}

          <div className="flex-1 min-w-0">
            {/* 제목 줄: 제품명 + 사이즈 우측 작게 */}
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <p className="text-sm font-bold text-brand-ink truncate">{item.name}</p>
              <p className="text-sm font-bold text-gray-500 tabular-nums shrink-0">{item.size}</p>
            </div>

            {item.memo && <p className="text-xs text-gray-400 truncate mb-1.5">{item.memo}</p>}

            {/* 핵심 칩만 — 카테고리 + 추천 시즌 (펼치면 자세히) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
                {FASHION_EMOJI[item.category]} {item.category}
              </span>
              {item.weatherTags?.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${SEASON_TAG_STYLE[tag] ?? 'bg-gray-50 text-gray-500'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 상세 버튼 — 카드 하단, 펼침 토글 */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
          aria-expanded={expanded}
          className="mt-3 -mb-1 w-full flex items-center justify-center gap-1 py-2 text-xs font-semibold text-gray-500 hover:text-brand-primary hover:bg-gray-50 rounded-xl transition-colors"
        >
          {expanded ? (
            <>닫기 <ChevronUp size={14} strokeWidth={2.4} /></>
          ) : (
            <>상세 보기 <ChevronDown size={14} strokeWidth={2.4} /></>
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
                {/* 자세한 칩 — 펼침 시에만 노출 (collapsed에서 숨긴 정보) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {matchBadge && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${MATCH_STYLE[matchBadge.level]}`}
                      title={matchBadge.label}
                    >
                      <span>{matchBadge.emoji}</span>
                      <span>{matchBadge.label}</span>
                    </span>
                  )}
                  {daysAgo !== null && (
                    <span
                      className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
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
                    <span className="inline-flex text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                      {owner.name}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${thick.bg} ${thick.text}`}>
                    <ThickIcon size={10} />
                    {item.thickness}
                  </span>
                  <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap">
                    {item.material}
                  </span>
                  {sizeMatch.status !== 'unknown' && sizeMatch.label && (
                    <span
                      className={`inline-flex text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
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

                {/* 사진 — 편집 + imageUrl 있을 때만 '삭제' 옵션 (변경은 카드 상단 썸네일 탭) */}
                {editing && item.imageUrl && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { imageUrl: undefined }); showToast('사진을 삭제했어요.'); }}
                    className="self-start text-xs text-gray-500 hover:text-brand-warning"
                  >
                    🗑️ 사진 삭제
                  </button>
                )}

                {/* 상품명 — 편집 모드에서만 노출 (비편집 시 카드 상단에 이미 표시되어 중복 제거) */}
                {editing && (
                  <div>
                    <span className="text-gray-400">상품명</span>
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
                  </div>
                )}

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
                          <span className="ml-1 text-xs text-gray-400 font-normal">
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
                            className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
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
                        className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
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
                          className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
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
                        className="text-sm px-2 py-0.5 rounded-full bg-white border border-dashed border-brand-primary/40 text-brand-primary hover:bg-brand-primary/5 transition-colors"
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
                    <p className="text-sm text-gray-400">착용 기록</p>
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
                        className="text-sm font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
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
                        className="text-sm font-semibold px-2.5 py-1 rounded-full bg-brand-primary text-white hover:opacity-90 transition-opacity"
                      >
                        👕 오늘 입었어요
                      </button>
                    )}
                    <label
                      onClick={(e) => e.stopPropagation()}
                      title="다른 날짜 기록"
                      className="text-sm font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
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
                    <p className="text-sm text-gray-400 mb-1.5">같이 자주 입는 조합</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {coWorn.map((co) => {
                        const Icon = FASHION_ICON[co.item.category] ?? FASHION_ICON['기타 액세서리'];
                        return (
                          <div key={co.item.id} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                            <Icon size={11} strokeWidth={2} />
                            <span className="font-medium truncate max-w-[100px]">{co.item.name}</span>
                            <span className="text-xs text-gray-500 tabular-nums">· {co.count}회</span>
                          </div>
                        );
                      })}
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

                {/* 삭제 — 명확히 분리, 빨간 톤 */}
                {!editing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic('action');
                      onRemove(item.id);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                  >
                    🗑️ 삭제
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
