'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { isEnrichedClothingItem, isClothingItem, FASHION_EMOJI, type ClothingItem, type WardrobeSection } from '@/types';
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
import { WARDROBE_SECTION_META, type WardrobeCell } from '@/lib/wardrobeModel';
import { getSectionForCategory } from '@/components/closet/WardrobeView';
import { springTransition, CARD_SHADOW, THICKNESS_STYLE, SEASON_TAG_STYLE, MATCH_STYLE } from './shared';

interface SwipeClothingCardProps {
  item:       ClothingItem;
  index:      number;
  onRemove:   (id: string) => void;
  onUpdate:   (id: string, updates: Partial<ClothingItem>) => void;
  matchBadge?: MatchBadge;
  /** 현재 옷장 config의 셀 목록 — 보관 위치 선택에 사용 */
  wardrobeCells?: WardrobeCell[];
  /** 부모가 관리하는 펼침 상태 — 한 번에 하나만 펼치게 */
  expanded?: boolean;
  onToggle?: () => void;
  /** 바텀시트 등 항상 펼친 컨텍스트에서 토글 버튼 숨김 */
  hideToggle?: boolean;
}

export default function SwipeClothingCard({ item, index, onRemove, onUpdate, matchBadge, wardrobeCells, expanded: expandedProp, onToggle, hideToggle }: SwipeClothingCardProps) {
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

  // 현재 보관 위치 — 수동 지정 우선, 없으면 카테고리 자동 배정
  const hasDouble = !!(wardrobeCells && wardrobeCells.some((c) => c.section === 'hanging_2'));
  const autoSection = getSectionForCategory(item.category, hasDouble);
  const currentWardrobeSection: WardrobeSection = (() => {
    if (!wardrobeCells) return autoSection;
    const manualValid = item.wardrobeSection && wardrobeCells.some((c) => c.section === item.wardrobeSection);
    const s = manualValid ? item.wardrobeSection! : autoSection;
    return wardrobeCells.some((c) => c.section === s) ? s : (wardrobeCells[0]?.section ?? s);
  })();

  const thick = THICKNESS_STYLE[item.thickness];
  const ThickIcon = thick.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200, transition: { duration: 0.18 } }}
      transition={{ ...springTransition, delay: Math.min(index, 6) * 0.03 }}
      className="relative overflow-hidden rounded-[32px]"
    >
      <div
        style={{ backgroundColor: 'rgb(255,255,255)', ...CARD_SHADOW }}
        onClick={toggleExpanded}
        className="rounded-[32px] border border-gray-50 p-5 flex flex-col cursor-pointer"
      >
        <div className="flex items-start gap-4">
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
            {/* 제목 줄: 제품명 | 사이즈 | 펼침 화살표 */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[15px] font-bold text-brand-ink truncate flex-1 leading-snug">{item.name}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <p className={`text-sm font-bold tabular-nums ${daysAgo !== null && daysAgo > 30 ? 'text-brand-warning' : 'text-gray-400'}`}>
                  {item.size}
                </p>
                {!hideToggle && (
                  <ChevronDown
                    size={15}
                    strokeWidth={2.4}
                    className={`text-gray-300 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                  />
                )}
              </div>
            </div>

            {item.memo && <p className="text-xs text-gray-400 truncate mb-2">{item.memo}</p>}

            {/* 핵심 정보: 카테고리 + 마지막 착용 */}
            <div className="flex items-center gap-2 text-xs text-gray-400 tabular-nums mb-3">
              <span>{item.category}</span>
              <span className="text-gray-200">·</span>
              <span className={daysAgo !== null && daysAgo > 30 ? 'text-brand-warning font-medium' : ''}>
                {daysAgo === null ? '아직 안 입음' :
                 daysAgo === 0    ? '오늘 입음' :
                 daysAgo <= 7     ? `${daysAgo}일 전 입음` :
                                    `${daysAgo}일째 안 입음`}
              </span>
            </div>

            {/* 진행바 — 마지막 착용 후 일수 (오래 될수록 채워짐, 60일 기준) */}
            {daysAgo !== null && daysAgo > 0 && (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    daysAgo > 60 ? 'bg-brand-warning' :
                    daysAgo > 30 ? 'bg-amber-400' :
                    'bg-brand-success'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, (daysAgo / 60) * 100))}%` }}
                />
              </div>
            )}

            {/* 시즌 + 매치 배지 */}
            {(matchBadge || (item.weatherTags && item.weatherTags.length > 0)) && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                {matchBadge && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${MATCH_STYLE[matchBadge.level]}`}
                    title={matchBadge.label}
                  >
                    <span>{matchBadge.emoji}</span>
                    <span>{matchBadge.label}</span>
                  </span>
                )}
                {item.weatherTags?.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${SEASON_TAG_STYLE[tag] ?? 'bg-gray-50 text-gray-500'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
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
              <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col gap-3">

                {/* 태그 칩 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {owner && (
                    <span className="inline-flex text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                      {owner.name}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${thick.bg} ${thick.text}`}>
                    <ThickIcon size={10} />
                    {item.thickness}
                  </span>
                  <span className="inline-flex text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap">
                    {item.material}
                  </span>
                  {sizeMatch.status !== 'unknown' && sizeMatch.label && (
                    <span
                      className={`inline-flex text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${
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

                {/* ── 보기 모드: 정보 행 테이블 ── */}
                {!editing && (
                  <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden text-sm">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">카테고리</span>
                      <span className="font-medium text-gray-700">{item.category}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">사이즈</span>
                      <span className="font-medium text-gray-700">
                        {item.size}
                        {sizeMatch.detail && (
                          <span className="ml-1 text-xs text-gray-400 font-normal">· {sizeReference?.name ?? '본인'} {sizeMatch.detail}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">소재</span>
                      <span className="font-medium text-gray-700">{item.material}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">두께</span>
                      <span className="font-medium text-gray-700">{item.thickness}</span>
                    </div>
                    {item.colorFamily && (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <span className="text-xs text-gray-400">컬러 패밀리</span>
                        <span className="font-medium text-gray-700">{item.colorFamily}</span>
                      </div>
                    )}
                    {isEnrichedClothingItem(item) && item.washingTip && (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <span className="text-xs text-gray-400">세탁 방법</span>
                        <span className="font-medium text-gray-700">{item.washingTip}</span>
                      </div>
                    )}
                    {item.weatherTags && item.weatherTags.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <span className="text-xs text-gray-400">추천 시즌</span>
                        <span className="font-medium text-gray-700">{item.weatherTags.join(', ')}</span>
                      </div>
                    )}
                    {wardrobeCells && wardrobeCells.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <span className="text-xs text-gray-400">보관 위치</span>
                        <span className="font-medium text-gray-700">
                          {WARDROBE_SECTION_META[currentWardrobeSection].emoji}{' '}
                          {WARDROBE_SECTION_META[currentWardrobeSection].label}
                          {!item.wardrobeSection && <span className="text-gray-300 text-xs ml-1">(자동)</span>}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">소유자</span>
                      <span className="font-medium text-gray-700">{owner ? owner.name : '공용'}</span>
                    </div>
                    {item.memo && (
                      <div className="flex items-start justify-between px-4 py-3 bg-gray-50 gap-4">
                        <span className="text-xs text-gray-400 shrink-0">메모</span>
                        <span className="font-medium text-gray-700 text-right">{item.memo}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 수정 모드: 사각형 폼 필드 ── */}
                {editing && (
                  <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                    {item.imageUrl && (
                      <button
                        type="button"
                        onClick={() => { onUpdate(item.id, { imageUrl: undefined }); showToast('사진을 삭제했어요.'); }}
                        className="self-start text-xs text-gray-400 hover:text-rose-500 transition-colors"
                      >
                        🗑️ 사진 삭제
                      </button>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">상품명</label>
                      <input
                        type="text"
                        aria-label={`${item.name} 상품명 수정`}
                        defaultValue={item.name}
                        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== item.name) onUpdate(item.id, { name: v }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">사이즈</label>
                      <input
                        type="text"
                        aria-label={`${item.name} 사이즈 수정`}
                        defaultValue={item.size}
                        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== item.size) onUpdate(item.id, { size: v }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">소재</label>
                      <input
                        type="text"
                        aria-label={`${item.name} 소재 수정`}
                        defaultValue={item.material}
                        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== item.material) onUpdate(item.id, { material: v }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">두께</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {(['얇음', '보통', '두꺼움'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => onUpdate(item.id, { thickness: t })}
                            className={`text-sm px-3 py-1 rounded-lg border transition-colors ${
                              item.thickness === t
                                ? 'bg-brand-primary text-white border-brand-primary'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    {wardrobeCells && wardrobeCells.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1.5">보관 위치</label>
                        <select
                          aria-label={`${item.name} 보관 위치 수정`}
                          value={currentWardrobeSection}
                          onChange={(e) => {
                            const next = e.target.value as WardrobeSection;
                            if (next !== currentWardrobeSection) onUpdate(item.id, { wardrobeSection: next });
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
                        >
                          {wardrobeCells.map((cell) => {
                            const meta = WARDROBE_SECTION_META[cell.section];
                            return <option key={cell.section} value={cell.section}>{meta.emoji} {meta.label}</option>;
                          })}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">소유자</label>
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => onUpdate(item.id, { ownerId: undefined })}
                          className={`text-sm px-3 py-1 rounded-lg border transition-colors ${
                            !item.ownerId
                              ? 'bg-gray-700 text-white border-gray-700'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          공용
                        </button>
                        {profiles.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => onUpdate(item.id, { ownerId: p.id })}
                            className={`text-sm px-3 py-1 rounded-lg border transition-colors ${
                              item.ownerId === p.id
                                ? 'bg-brand-primary text-white border-brand-primary'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">메모</label>
                      <input
                        type="text"
                        aria-label={`${item.name} 메모 수정`}
                        defaultValue={item.memo ?? ''}
                        placeholder="메모를 입력하세요"
                        onBlur={(e) => { const v = e.target.value.trim(); if (v !== (item.memo ?? '')) onUpdate(item.id, { memo: v || undefined }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
                      />
                    </div>
                  </div>
                )}

                {/* 착용 기록 박스 */}
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-3">
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

                {/* ── 액션 버튼 ── */}
                {editing ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); showToast(`"${item.name}" 저장됐어요.`); setEditing(false); }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-brand-primary text-white hover:opacity-90 transition-colors mt-1"
                  >
                    ✓ 저장하고 완료
                  </button>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      ✏️ 정보 수정
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); haptic('action'); onRemove(item.id); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
