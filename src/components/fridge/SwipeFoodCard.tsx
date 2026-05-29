'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { type FoodItem, type FridgeSection } from '@/types';
import { FOOD_ICON, SEASON_ICON, SEASON_COLOR } from '@/lib/iconMap';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';
import { getFoodCategoryTone } from '@/lib/categoryImages';
import { FRIDGE_MODELS, type FridgeModelId } from '@/lib/fridgeModel';
import { FRIDGE_SECTION_META, recommendFridgeSection } from '@/lib/fridgeSection';
import { useProfiles } from '@/lib/profile';
import { useToast } from '@/context/ToastContext';
import { currentSeasonByMonth } from '@/lib/season';
import { isSeasonalProduce } from '@/lib/seasonalProduce';
import { countRecipesByIngredient, type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import RecipeBrowserModal from '@/components/RecipeBrowserModal';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { haptic } from '@/lib/haptics';
import { estimateCycles } from '@/lib/purchaseCycle';
import { useCart } from '@/context/CartContext';
import { springTransition, CARD_SHADOW, STORAGE_ICON, STORAGE_STYLE } from './shared';

interface SwipeFoodCardProps {
  item:         FoodItem;
  dDay:         number;
  index:        number;
  fridgeModelId: FridgeModelId;
  onDiscard: (id: string) => void;
  onUpdate:  (id: string, updates: Partial<FoodItem>) => void;
  /** 부모가 관리하는 펼침 상태 — 한 번에 하나만 펼치게 */
  expanded?: boolean;
  onToggle?: () => void;
  /** 바텀시트 등 항상 펼친 컨텍스트에서 토글 버튼 숨김 */
  hideToggle?: boolean;
}

export default function SwipeFoodCard({ item, dDay, index, fridgeModelId, onDiscard, onUpdate, expanded: expandedProp, onToggle, hideToggle }: SwipeFoodCardProps) {
  const [expandedLocal, setExpandedLocal] = useState(false);
  const expanded = expandedProp ?? expandedLocal;
  const toggleExpanded = onToggle ?? (() => setExpandedLocal((v) => !v));
  const [editing, setEditing]   = useState(false);
  const [recipeBrowser, setRecipeBrowser] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { profiles } = useProfiles();
  const { showToast } = useToast();
  const { isFavorite, toggle } = useRecipeFavorites();
  const owner = item.ownerId ? profiles.find((p) => p.id === item.ownerId) : null;
  const recipeCount = countRecipesByIngredient(item.name);
  const modelCells = FRIDGE_MODELS[fridgeModelId].cells;
  const currentSection = item.fridgeSection ?? recommendFridgeSection(item);
  const { discardHistory } = useCart();
  const cycle = estimateCycles(discardHistory, 2).find((c) => c.name === item.name);
  const isUrgent = dDay <= 3;

  const style = STORAGE_STYLE[item.storageType];
  const Icon  = STORAGE_ICON[item.storageType];
  const season  = currentSeasonByMonth();
  const inSeason = isSeasonalProduce(item.name, season);

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
            const tone = getFoodCategoryTone(item.foodCategory);
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
                {/* 변경 가능 표시 — 사진 우하단에 항상 작게 보임 */}
                <span
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white/95 flex items-center justify-center text-[12px] shadow-md ring-1 ring-gray-100"
                  aria-hidden
                >
                  📷
                </span>
              </button>
            );
          })()}

          {/* 본문: 제목 + 메타 + 진행바 */}
          <div className="flex-1 min-w-0">
            {/* 제목 줄: 제품명 | D-Day | 펼침 화살표 */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[15px] font-bold text-brand-ink truncate flex-1 leading-snug">{item.name}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <p className={`text-sm font-bold tabular-nums ${
                  isUrgent ? 'text-brand-warning' : 'text-gray-400'
                }`}>
                  {dDay <= 0 ? '만료' : `D-${dDay}`}
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

            {/* 핵심 정보: 구매일 + 만료일 — 한 줄 (펼치면 자세히) */}
            <div className="flex items-center gap-2 text-xs text-gray-400 tabular-nums mb-3">
              <span>📅 {item.purchaseDate.slice(5).replace('-', '/')}</span>
              <span className="text-gray-200">·</span>
              <span className={isUrgent ? 'text-brand-warning font-medium' : ''}>
                {dDay <= 0 ? '만료됨' : `${dDay}일 남음`}
              </span>
            </div>

            {/* 진행바 */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  dDay <= 2 ? 'bg-brand-warning' : dDay <= 5 ? 'bg-amber-400' : 'bg-brand-success'
                }`}
                style={{ width: `${Math.max(4, Math.min(100, (dDay / item.baseShelfLifeDays) * 100))}%` }}
              />
            </div>

            {/* 칼로리·영양소 — 한 줄 (펼치면 자세히) */}
            {item.nutritionFacts ? (
              <p className="text-xs text-gray-500 tabular-nums mt-2.5">
                🔥 <span className="font-semibold">{item.nutritionFacts.calories}</span>kcal
                <span className="text-gray-300"> · </span>
                단 {item.nutritionFacts.protein}g
                <span className="text-gray-300"> · </span>
                지 {item.nutritionFacts.fat}g
                <span className="text-gray-300"> · </span>
                탄 {item.nutritionFacts.carbs}g
              </p>
            ) : (
              <p className="text-[11px] text-gray-300 mt-2.5">영양 정보 없음</p>
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
                  <span className={`inline-flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${style.bg} ${style.text}`}>
                    <Icon size={10} />{style.label}
                  </span>
                  {(() => {
                    const FoodIcon = FOOD_ICON[item.foodCategory] ?? FOOD_ICON['기타 식품'];
                    return (
                      <span className="inline-flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap">
                        <FoodIcon size={11} strokeWidth={2} />{item.foodCategory ?? '기타'}
                      </span>
                    );
                  })()}
                  {inSeason && (() => {
                    const SeasonIcon = SEASON_ICON[season];
                    const seasonColor = SEASON_COLOR[season];
                    return (
                      <span className={`inline-flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${seasonColor.bg} ${seasonColor.text}`}>
                        <SeasonIcon size={10} strokeWidth={2.4} />제철
                      </span>
                    );
                  })()}
                  {owner && (
                    <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                      {owner.name}
                    </span>
                  )}
                </div>

                {/* ── 보기 모드: 정보 행 테이블 ── */}
                {!editing && (
                  <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden text-sm">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">구매일</span>
                      <span className="font-medium text-gray-700 tabular-nums">{item.purchaseDate}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">보관 만료</span>
                      <span className={`font-medium tabular-nums ${dDay <= 3 ? 'text-brand-warning' : 'text-gray-700'}`}>
                        {(() => { const d = new Date(item.purchaseDate); d.setDate(d.getDate() + item.baseShelfLifeDays); return d.toISOString().split('T')[0]; })()}
                        <span className="ml-1.5 text-xs text-gray-400">({dDay <= 0 ? '만료' : `${dDay}일`})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">보관 일수</span>
                      <span className="font-medium text-gray-700 tabular-nums">{item.baseShelfLifeDays}일</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">보관 위치</span>
                      <span className="font-medium text-gray-700">
                        {FRIDGE_SECTION_META[currentSection].emoji} {FRIDGE_SECTION_META[currentSection].label}
                        {!item.fridgeSection && <span className="text-gray-300 text-xs ml-1">(자동)</span>}
                      </span>
                    </div>
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
                    {item.nutritionFacts && (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <span className="text-xs text-gray-400">영양</span>
                        <span className="font-medium text-gray-600 tabular-nums text-xs">
                          🔥{item.nutritionFacts.calories}kcal · 단{item.nutritionFacts.protein} · 지{item.nutritionFacts.fat} · 탄{item.nutritionFacts.carbs}g
                        </span>
                      </div>
                    )}
                    {cycle && (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <span className="text-xs text-gray-400">재구매 주기</span>
                        <span className="font-medium text-gray-700">🔁 {cycle.cycleDays}일 <span className="text-xs text-gray-400">({cycle.occurrences}회)</span></span>
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
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">구매일</label>
                      <input
                        type="date"
                        aria-label={`${item.name} 구매일 수정`}
                        defaultValue={item.purchaseDate}
                        onBlur={(e) => { const v = e.target.value; if (v && v !== item.purchaseDate) onUpdate(item.id, { purchaseDate: v }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 tabular-nums transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">보관 가능 일수</label>
                      <input
                        type="number"
                        aria-label={`${item.name} 보관 가능 일수 수정`}
                        defaultValue={item.baseShelfLifeDays}
                        min={1}
                        onBlur={(e) => { const v = parseInt(e.target.value, 10); if (v > 0 && v !== item.baseShelfLifeDays) onUpdate(item.id, { baseShelfLifeDays: v }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 tabular-nums transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">보관 위치</label>
                      <select
                        aria-label={`${item.name} 보관 위치 수정`}
                        value={currentSection}
                        onChange={(e) => { const next = e.target.value as FridgeSection; if (next !== currentSection) onUpdate(item.id, { fridgeSection: next }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
                      >
                        {modelCells.map((cell) => {
                          const meta = FRIDGE_SECTION_META[cell.section];
                          return <option key={cell.section} value={cell.section}>{meta.emoji} {meta.label}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">소유자</label>
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => onUpdate(item.id, { ownerId: undefined })}
                          className={`text-sm px-3 py-1 rounded-lg border transition-colors ${!item.ownerId ? 'bg-gray-700 text-white border-gray-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                          공용
                        </button>
                        {profiles.map((p) => (
                          <button key={p.id} onClick={() => onUpdate(item.id, { ownerId: p.id })}
                            className={`text-sm px-3 py-1 rounded-lg border transition-colors ${item.ownerId === p.id ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
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
                    {recipeCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setRecipeBrowser(true); }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                      >
                        📖 레시피 {recipeCount}개
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      ✏️ 정보 수정
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); haptic('action'); onDiscard(item.id); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-colors"
                    >
                      🗑️ 소진 처리
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {recipeBrowser && (
        <RecipeBrowserModal
          initialSearch={item.name}
          onSelect={(recipe) => {
            setRecipeBrowser(false);
            setSelectedRecipe(recipe);
          }}
          onClose={() => setRecipeBrowser(false)}
        />
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          matchedItems={[item.name]}
          isFavorite={isFavorite(selectedRecipe.id)}
          onToggleFavorite={() => toggle(selectedRecipe.id)}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </motion.div>
  );
}
