'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { type FoodItem, type FridgeSection } from '@/types';
import { FOOD_ICON, SEASON_ICON, SEASON_COLOR } from '@/lib/iconMap';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';
import { getFoodCategoryTone } from '@/lib/categoryImages';
import { useFridgeModel } from '@/lib/useFridgeModel';
import { FRIDGE_MODELS } from '@/lib/fridgeModel';
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
  item:      FoodItem;
  dDay:      number;
  index:     number;
  onDiscard: (id: string) => void;
  onUpdate:  (id: string, updates: Partial<FoodItem>) => void;
  /** 부모가 관리하는 펼침 상태 — 한 번에 하나만 펼치게 */
  expanded?: boolean;
  onToggle?: () => void;
}

export default function SwipeFoodCard({ item, dDay, index, onDiscard, onUpdate, expanded: expandedProp, onToggle }: SwipeFoodCardProps) {
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
  const [fridgeModelId] = useFridgeModel();
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
            {/* 제목 줄: 제품명 + D-Day 우측 작게 */}
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <p className="text-sm font-bold text-brand-ink truncate">{item.name}</p>
              <p className={`text-sm font-bold tabular-nums shrink-0 ${
                isUrgent ? 'text-brand-warning' : 'text-gray-500'
              }`}>
                {dDay <= 0 ? '만료' : `D-${dDay}`}
              </p>
            </div>

            {item.memo && <p className="text-xs text-gray-400 truncate mb-1.5">{item.memo}</p>}

            {/* 핵심 정보: 구매일 + 만료일 — 한 줄 (펼치면 자세히) */}
            <div className="flex items-center gap-2 text-xs text-gray-500 tabular-nums mb-1.5">
              <span>📅 구매 {item.purchaseDate}</span>
              <span className="text-gray-300">·</span>
              <span>
                ⏳ {dDay <= 0 ? '만료됨' : `${dDay}일 남음`}
              </span>
            </div>

            {/* 진행바 */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  dDay <= 2 ? 'bg-brand-warning' : dDay <= 5 ? 'bg-amber-400' : 'bg-brand-success'
                }`}
                style={{ width: `${Math.max(4, Math.min(100, (dDay / item.baseShelfLifeDays) * 100))}%` }}
              />
            </div>

            {/* 칼로리·영양소 — 한 줄 (펼치면 자세히) */}
            {item.nutritionFacts ? (
              <p className="text-xs text-gray-600 tabular-nums mt-1.5">
                🔥 <span className="font-semibold">{item.nutritionFacts.calories}</span>kcal
                <span className="text-gray-300"> · </span>
                단 {item.nutritionFacts.protein}g
                <span className="text-gray-300"> · </span>
                지 {item.nutritionFacts.fat}g
                <span className="text-gray-300"> · </span>
                탄 {item.nutritionFacts.carbs}g
              </p>
            ) : (
              <p className="text-xs text-gray-300 mt-1.5">영양 정보 없음 · 자세히 보기에서 수정</p>
            )}

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
                  <span className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${style.bg} ${style.text}`}>
                    <Icon size={10} />
                    {style.label}
                  </span>
                  {(() => {
                    const FoodIcon = FOOD_ICON[item.foodCategory] ?? FOOD_ICON['기타 식품'];
                    return (
                      <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap">
                        <FoodIcon size={11} strokeWidth={2} />
                        <span>{item.foodCategory ?? '기타'}</span>
                      </span>
                    );
                  })()}
                  {(() => {
                    const SeasonIcon = SEASON_ICON[season];
                    const seasonColor = SEASON_COLOR[season];
                    if (inSeason) {
                      return (
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${seasonColor.bg} ${seasonColor.text}`}
                        >
                          <SeasonIcon size={10} strokeWidth={2.4} />
                          <span>제철</span>
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {owner && (
                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                      {owner.name}
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

                {/* 구매일 · 보관 만료 — date input이 좁은 컬럼에서 겹치므로 한 줄씩 배치 */}
                <div>
                  <span className="text-gray-400">구매일</span>
                  {editing ? (
                    <input
                      type="date"
                      aria-label={`${item.name} 구매일 수정`}
                      defaultValue={item.purchaseDate}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (v && v !== item.purchaseDate) onUpdate(item.id, { purchaseDate: v });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="block w-full mt-0.5 text-xs text-gray-700 font-medium bg-white border border-brand-primary/30 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 tabular-nums"
                    />
                  ) : (
                    <p className="text-gray-700 font-medium mt-0.5 tabular-nums">{item.purchaseDate}</p>
                  )}
                </div>
                <div>
                  <span className="text-gray-400">보관 만료</span>
                  <p className={`font-medium tabular-nums mt-0.5 ${dDay <= 3 ? 'text-brand-warning' : 'text-gray-700'}`}>
                    {(() => {
                      const d = new Date(item.purchaseDate);
                      d.setDate(d.getDate() + item.baseShelfLifeDays);
                      return d.toISOString().split('T')[0];
                    })()}
                    <span className="text-gray-400 ml-1.5 text-xs">({dDay <= 0 ? '만료' : `${dDay}일 남음`})</span>
                  </p>
                </div>

                {/* 영양소 */}
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

                {/* 보관 가능 일수 */}
                <div>
                  <span className="text-gray-400">보관 가능 일수</span>
                  {editing ? (
                    <input
                      type="number"
                      aria-label={`${item.name} 보관 가능 일수 수정`}
                      defaultValue={item.baseShelfLifeDays}
                      min={1}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (v > 0 && v !== item.baseShelfLifeDays) onUpdate(item.id, { baseShelfLifeDays: v });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 mt-0.5 text-xs text-gray-700 font-medium bg-white border border-brand-primary/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 tabular-nums"
                    />
                  ) : (
                    <p className="text-gray-700 font-medium mt-0.5 tabular-nums">{item.baseShelfLifeDays}일</p>
                  )}
                </div>

                {/* 재구매 주기 — 소진 이력 2회+ 있으면 */}
                {cycle && !editing && (
                  <div>
                    <span className="text-gray-400">재구매 주기</span>
                    <p className="text-gray-700 font-medium mt-0.5">
                      🔁 보통 <span className="tabular-nums">{cycle.cycleDays}일</span> 주기
                      <span className="text-sm text-gray-400 ml-1 tabular-nums">· {cycle.occurrences}회 기록</span>
                    </p>
                  </div>
                )}

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

                {/* 보관 위치 — 편집 모드에서 변경 가능 */}
                <div>
                  <span className="text-gray-400">보관 위치</span>
                  {editing ? (
                    <select
                      aria-label={`${item.name} 보관 위치 수정`}
                      value={currentSection}
                      onChange={(e) => {
                        const next = e.target.value as FridgeSection;
                        if (next !== currentSection) onUpdate(item.id, { fridgeSection: next });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-brand-primary/30 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    >
                      {modelCells.map((cell) => {
                        const meta = FRIDGE_SECTION_META[cell.section];
                        return (
                          <option key={cell.section} value={cell.section}>
                            {meta.emoji} {meta.label}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <p className="text-gray-700 mt-0.5">
                      {FRIDGE_SECTION_META[currentSection].emoji} {FRIDGE_SECTION_META[currentSection].label}
                      {!item.fridgeSection && <span className="text-gray-300 ml-1">(자동 추천)</span>}
                    </p>
                  )}
                </div>

                {/* 액션 버튼 — 레시피 / 수정 / 소진 */}
                <div className="flex gap-1.5">
                  {recipeCount > 0 && !editing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRecipeBrowser(true); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                    >
                      📖 이 재료 레시피 {recipeCount}
                    </button>
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
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      editing
                        ? 'bg-brand-primary text-white hover:opacity-90'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {editing ? '✓ 저장하고 완료' : '✏️ 정보 수정'}
                  </button>
                </div>

                {/* 소진 (삭제) — 명확히 분리, 빨간 톤 */}
                {!editing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic('action');
                      onDiscard(item.id);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                  >
                    🗑️ 소진 처리
                  </button>
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
