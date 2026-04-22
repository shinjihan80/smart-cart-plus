'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { FOOD_EMOJI, type FoodItem } from '@/types';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';
import { useProfiles } from '@/lib/profile';
import { useToast } from '@/context/ToastContext';
import { currentSeasonByMonth } from '@/lib/season';
import { isSeasonalProduce } from '@/lib/seasonalProduce';
import { SEASON_EMOJI, countRecipesByIngredient, type Recipe } from '@/lib/recipes';
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
}

export default function SwipeFoodCard({ item, dDay, index, onDiscard, onUpdate }: SwipeFoodCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [recipeBrowser, setRecipeBrowser] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { profiles } = useProfiles();
  const { showToast } = useToast();
  const { isFavorite, toggle } = useRecipeFavorites();
  const owner = item.ownerId ? profiles.find((p) => p.id === item.ownerId) : null;
  const recipeCount = countRecipesByIngredient(item.name);
  const { discardHistory } = useCart();
  const cycle = estimateCycles(discardHistory, 2).find((c) => c.name === item.name);
  const x = useMotionValue(0);
  const bgColor = useTransform(
    x, [-120, -30, 0],
    ['rgb(255,241,242)', 'rgb(255,254,253)', 'rgb(255,255,255)'],
  );
  const discardOpacity = useTransform(x, [-120, -40], [1, 0]);
  const isUrgent = dDay <= 3;

  const style = STORAGE_STYLE[item.storageType];
  const Icon  = STORAGE_ICON[item.storageType];
  const season  = currentSeasonByMonth();
  const inSeason = isSeasonalProduce(item.name, season);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -80) {
      haptic('action');
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
          <span className="text-xs font-semibold text-brand-warning">소진</span>
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
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
              {inSeason && dDay <= 2 ? (
                <span
                  className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-semibold bg-gradient-to-r from-brand-warning/20 to-brand-primary/20 text-brand-warning border border-brand-warning/30"
                  title={`${season}철 제철인데 ${dDay <= 0 ? '오늘이 마지막' : `${dDay}일 뒤 만료`} — 놓치기 아까워요!`}
                >
                  ⚠️ {SEASON_EMOJI[season]} 제철 {dDay <= 0 ? '오늘!' : `D-${dDay}`}
                </span>
              ) : inSeason ? (
                <span
                  className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium bg-brand-primary/10 text-brand-primary"
                  title={`${season}철 제철 재료 — 지금이 가장 맛있어요`}
                >
                  {SEASON_EMOJI[season]} 제철
                </span>
              ) : null}
              {owner && (
                <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                  {owner.name}
                </span>
              )}
            </div>
            {item.memo && <p className="text-xs text-gray-400 truncate mt-0.5">📝 {item.memo}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-sm px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
                <Icon size={10} />
                {style.label}
              </span>
              <span className="text-sm px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium">
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
                <span className="text-xs text-gray-400 tabular-nums">{item.nutritionFacts.calories}kcal</span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-400 tabular-nums">단 {item.nutritionFacts.protein}g</span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-400 tabular-nums">지 {item.nutritionFacts.fat}g</span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-400 tabular-nums">탄 {item.nutritionFacts.carbs}g</span>
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
              <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
                {/* 이미지 — 편집 모드에서만 변경/삭제·추가 */}
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
                    <span className="text-sm font-medium">사진 추가</span>
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

                {/* 구매일 · 보관 만료 */}
                <div className="grid grid-cols-2 gap-2">
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
                        className="w-full mt-0.5 text-xs text-gray-700 font-medium bg-white border border-brand-primary/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 tabular-nums"
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
                    </p>
                  </div>
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

                {/* 액션 버튼 — 레시피 찾기 + 수정 토글 */}
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
                    className={`${recipeCount > 0 && !editing ? 'flex-1' : 'w-full'} py-2 rounded-xl text-xs font-semibold transition-colors ${
                      editing
                        ? 'bg-brand-primary text-white hover:opacity-90'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {editing ? '✓ 저장하고 완료' : '✏️ 정보 수정'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
