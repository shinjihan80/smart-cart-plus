'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFoodItem, type StorageType, type FoodGroup, type FridgeSection, FOOD_GROUP } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { calcRemainingDays } from '@/components/FoodTags';
import { Search, LayoutGrid, List } from 'lucide-react';
import { useSearchShortcut } from '@/lib/useSearchShortcut';
import PaletteButton from '@/components/PaletteButton';
import EmojiIcon from '@/components/EmojiIcon';

import { springTransition, CARD, CARD_SHADOW } from '@/components/fridge/shared';
import SwipeFoodCard           from '@/components/fridge/SwipeFoodCard';
import NutritionBalanceSection from '@/components/fridge/NutritionBalanceSection';
import FeelingLuckySection     from '@/components/fridge/FeelingLuckySection';
import RecipeSection           from '@/components/fridge/RecipeSection';
import RebuySection            from '@/components/fridge/RebuySection';
import SeasonalProduceSection  from '@/components/fridge/SeasonalProduceSection';
import SectionErrorBoundary    from '@/components/SectionErrorBoundary';
import { FridgeView }          from '@/components/fridge/FridgeView';
import { SectionDetailSheet }  from '@/components/fridge/SectionDetailSheet';
import { isSeasonalProduce, SEASONAL_PRODUCE, type SeasonalProduce } from '@/lib/seasonalProduce';
import { currentSeasonByMonth } from '@/lib/season';
import { SEASON_ICON }          from '@/lib/iconMap';
import { useProfiles }         from '@/lib/profile';
import { usePersistedState }   from '@/lib/usePersistedState';
import { useFridgeModel }      from '@/lib/useFridgeModel';
import { recommendFridgeSection, FRIDGE_SECTION_META } from '@/lib/fridgeSection';
import { FRIDGE_MODELS, resolveSectionForModel } from '@/lib/fridgeModel';
import { getFoodCategoryTone } from '@/lib/categoryImages';

type StorageFilter = '전체' | StorageType;
type GroupFilter   = '전체' | FoodGroup;
type SortKey       = 'dDay' | 'name' | 'seasonal';
type FridgeTab     = 'fridge' | 'suggest' | 'shopping';

const FRIDGE_TABS: { id: FridgeTab; emoji: string; label: string }[] = [
  { id: 'fridge',   emoji: '🧊', label: '냉장고' },
  { id: 'suggest',  emoji: '💡', label: '추천' },
  { id: 'shopping', emoji: '🛒', label: '장보기' },
];

const isFridgeTab = (v: unknown): v is FridgeTab =>
  v === 'fridge' || v === 'suggest' || v === 'shopping';

const SORT_CYCLE: Record<SortKey, { next: SortKey; label: string }> = {
  dDay:     { next: 'name',     label: '📅 임박순' },
  name:     { next: 'seasonal', label: '🔤 이름순' },
  seasonal: { next: 'dDay',     label: '🌸 제철 먼저' },
};

const QUICK_ADD_FOODS: { name: string; foodCategory: import('@/types').FoodCategory; storageType: StorageType; days: number }[] = [
  { name: '우유 1L',    foodCategory: '유제품',      storageType: '냉장', days: 10 },
  { name: '달걀 10구',  foodCategory: '정육·계란',   storageType: '냉장', days: 21 },
  { name: '식빵',       foodCategory: '빵·베이커리', storageType: '실온', days: 4  },
  { name: '바나나',     foodCategory: '채소·과일',   storageType: '실온', days: 5  },
  { name: '닭가슴살',   foodCategory: '정육·계란',   storageType: '냉동', days: 60 },
  { name: '요거트',     foodCategory: '유제품',      storageType: '냉장', days: 14 },
];

const STORAGE_FILTERS: { key: StorageFilter; label: string }[] = [
  { key: '전체', label: '전체' },
  { key: '냉장', label: '❄️ 냉장' },
  { key: '냉동', label: '🧊 냉동' },
  { key: '실온', label: '📦 실온' },
];

const GROUP_FILTERS: { key: GroupFilter; label: string }[] = [
  { key: '전체',     label: '전체' },
  { key: '신선식품', label: '🥬 신선' },
  { key: '가공식품', label: '🍜 가공' },
  { key: '음료·간식', label: '🧃 음료·간식' },
];

export default function FridgePage() {
  const { items: allItems, addItems, updateItem, removeItem, undoRemove, discardHistory } = useCart();
  const { showToast } = useToast();
  const { profiles } = useProfiles();
  const [search, setSearch]         = useState('');
  const [storageFilter, setStorageFilter] = usePersistedState<StorageFilter>(
    'nemoa-fridge-storage', '전체',
    (raw) => (raw === '전체' || raw === '냉장' || raw === '냉동' || raw === '실온') ? raw : null,
  );
  const [groupFilter, setGroupFilter] = usePersistedState<GroupFilter>(
    'nemoa-fridge-group', '전체',
    (raw) => (raw === '전체' || raw === '신선식품' || raw === '가공식품' || raw === '음료·간식' || raw === '기타') ? raw : null,
  );
  const [sortBy, setSortBy] = usePersistedState<SortKey>(
    'nemoa-fridge-sort', 'dDay',
    (raw) => (raw === 'dDay' || raw === 'name' || raw === 'seasonal') ? raw : null,
  );
  const [ownerFilter, setOwnerFilter] = usePersistedState<string>(
    'nemoa-fridge-owner', '전체',
    (raw) => typeof raw === 'string' ? raw : null,
  );
  const [quickAddOwner, setQuickAddOwner] = useState<string | undefined>(undefined);
  const [seasonalOnly, setSeasonalOnly] = usePersistedState<boolean>(
    'nemoa-fridge-seasonal-only', false,
    (raw) => typeof raw === 'boolean' ? raw : null,
  );
  const [viewMode, setViewMode] = usePersistedState<'visual' | 'list'>(
    'nemoa-fridge-view', 'visual',
    (raw) => (raw === 'visual' || raw === 'list') ? raw : null,
  );
  const [activeTab, setActiveTab] = usePersistedState<FridgeTab>(
    'nemoa-fridge-tab', 'fridge',
    (raw) => (isFridgeTab(raw) ? raw : null),
  );
  const [fridgeModelId] = useFridgeModel();
  const [activeSection, setActiveSection] = useState<FridgeSection | null>(null);
  const [expandedFoodId, setExpandedFoodId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchInputRef, () => setSearch(''));
  const season = currentSeasonByMonth();

  const allFood = allItems.filter(isFoodItem)
    .map((f) => ({ ...f, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }));

  const items = allFood
    .filter((i) => storageFilter === '전체' || i.storageType === storageFilter)
    .filter((i) => groupFilter === '전체' || (FOOD_GROUP[i.foodCategory] ?? '기타') === groupFilter)
    .filter((i) => {
      if (ownerFilter === '전체') return true;
      if (ownerFilter === '공용') return !i.ownerId;
      return i.ownerId === ownerFilter;
    })
    .filter((i) => !seasonalOnly || isSeasonalProduce(i.name, season))
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'dDay') return a.dDay - b.dDay;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // seasonal: 제철 먼저 → 동률이면 임박순
      const aSeason = isSeasonalProduce(a.name, season) ? 0 : 1;
      const bSeason = isSeasonalProduce(b.name, season) ? 0 : 1;
      if (aSeason !== bSeason) return aSeason - bSeason;
      return a.dDay - b.dDay;
    });

  const seasonalCount = allFood.filter((i) => isSeasonalProduce(i.name, season)).length;

  const urgentCount = allFood.filter((i) => i.dDay <= 3).length;
  const coldCount   = allFood.filter((i) => i.storageType === '냉장').length;
  const frozenCount = allFood.filter((i) => i.storageType === '냉동').length;

  const foodGroupCounts = (['신선식품', '가공식품', '음료·간식'] as FoodGroup[]).map((g) => ({
    group: g,
    count: allFood.filter((f) => (FOOD_GROUP[f.foodCategory] ?? '기타') === g).length,
  })).filter((g) => g.count > 0);

  function handleDiscard(id: string) {
    const name = allFood.find((i) => i.id === id)?.name ?? '';
    removeItem(id);
    showToast(`"${name}" 소진 처리됐어요.`, undoRemove);
  }

  function pickSection(input: { name: string; foodCategory: import('@/types').FoodCategory; storageType: StorageType }) {
    const recommended = recommendFridgeSection(input);
    const zone = FRIDGE_SECTION_META[recommended].zone;
    return resolveSectionForModel(fridgeModelId, recommended, zone);
  }

  function handleQuickAdd(preset: typeof QUICK_ADD_FOODS[number]) {
    const { added } = addItems([{
      id: `qa-${Date.now()}`,
      name: preset.name,
      category: '식품',
      foodCategory: preset.foodCategory,
      storageType: preset.storageType,
      baseShelfLifeDays: preset.days,
      purchaseDate: new Date().toISOString().split('T')[0],
      ownerId: quickAddOwner,
      fridgeSection: pickSection(preset),
    }]);
    if (added > 0) showToast(`"${preset.name}" 추가됐어요!`);
    else showToast(`"${preset.name}" 이미 있어요.`);
  }

  function handleRebuy(name: string) {
    const input = { name, foodCategory: '기타 식품' as const, storageType: '냉장' as const };
    const { added } = addItems([{
      id: `rb-${Date.now()}`,
      name,
      category: '식품',
      foodCategory: '기타 식품',
      storageType: '냉장',
      baseShelfLifeDays: 7,
      purchaseDate: new Date().toISOString().split('T')[0],
      fridgeSection: pickSection(input),
    }]);
    if (added > 0) showToast(`"${name}" 재구매 등록됐어요!`);
    else showToast(`"${name}" 이미 있어요.`);
  }

  function handleSeasonalAdd(p: SeasonalProduce) {
    const { added } = addItems([{
      id: `sp-${Date.now()}`,
      name: p.name,
      category: '식품',
      foodCategory: p.foodCategory,
      storageType: p.storageType,
      baseShelfLifeDays: p.baseShelfLifeDays,
      purchaseDate: new Date().toISOString().split('T')[0],
      ownerId: quickAddOwner,
      fridgeSection: pickSection(p),
    }]);
    if (added > 0) showToast(`"${p.name}" 담았어요! 제철이라 가장 맛있을 때예요.`);
    else showToast(`"${p.name}" 이미 있어요.`);
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 냉장고</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {FRIDGE_MODELS[fridgeModelId].label} · 식품 {allFood.length}개
            </p>
          </div>
          <PaletteButton />
        </div>
        <div role="tablist" aria-label="냉장고 탭" className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {FRIDGE_TABS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(t.id)}
                className={[
                  'shrink-0 text-sm font-semibold px-3 py-1.5 rounded-full transition-colors',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                ].join(' ')}
              >
                <span className="mr-1">{t.emoji}</span>{t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">

        {/* ─── 냉장고 탭 ────────────────────────────── */}
        {activeTab === 'fridge' && (
          <>
            {/* 시각화/리스트 토글 — 인라인 */}
            <div className="flex items-center justify-end">
              <div role="tablist" aria-label="보기 방식" className="flex bg-gray-100 rounded-full p-0.5">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'visual'}
                  onClick={() => setViewMode('visual')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    viewMode === 'visual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <LayoutGrid size={12} strokeWidth={2.4} />
                  <span>냉장고</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <List size={12} strokeWidth={2.4} />
                  <span>리스트</span>
                </button>
              </div>
            </div>

            {/* 시각화 — 위계상 1순위 */}
            {viewMode === 'visual' && allFood.length > 0 && (
              <FridgeView
                modelId={fridgeModelId}
                items={items}
                onSectionClick={setActiveSection}
              />
            )}

            {/* 요약 4수치 (시각화 아래 작게) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className={CARD}
              style={CARD_SHADOW}
            >
              <div className="flex justify-between text-center">
                <div className="flex-1">
                  <p className="text-xl font-extrabold text-gray-900 tabular-nums">{allFood.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">전체</p>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-extrabold text-sky-600 tabular-nums">{coldCount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">냉장</p>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-extrabold text-indigo-600 tabular-nums">{frozenCount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">냉동</p>
                </div>
                <div className="flex-1">
                  <p className={`text-xl font-extrabold tabular-nums ${urgentCount > 0 ? 'text-brand-warning' : 'text-gray-900'}`}>
                    {urgentCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">임박</p>
                </div>
              </div>
              {foodGroupCounts.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-gray-50">
                  {foodGroupCounts.map(({ group, count }) => (
                    <span key={group} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium tabular-nums">
                      {group} {count}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 프로필 필터 */}
            {profiles.length >= 2 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setOwnerFilter('전체')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                ownerFilter === '전체'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              전체 보기
            </button>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setOwnerFilter(p.id)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  ownerFilter === p.id
                    ? 'bg-brand-primary text-white'
                    : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={() => setOwnerFilter('공용')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                ownerFilter === '공용'
                  ? 'bg-gray-500 text-white'
                  : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              공용
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
              {STORAGE_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStorageFilter(key)}
                  className={`shrink-0 px-2.5 py-1 rounded-2xl text-xs font-medium transition-colors ${
                    storageFilter === key
                      ? 'bg-brand-primary text-white'
                      : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortBy(SORT_CYCLE[sortBy].next)}
              className="text-sm text-gray-400 px-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {SORT_CYCLE[sortBy].label}
            </button>
          </div>
          <div className="flex gap-1.5 items-center overflow-x-auto scrollbar-hide -mx-1 px-1">
            {GROUP_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setGroupFilter(key)}
                className={`shrink-0 px-2.5 py-1 rounded-2xl text-xs font-medium transition-colors ${
                  groupFilter === key
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
            {seasonalCount > 0 && (
              <button
                onClick={() => setSeasonalOnly(!seasonalOnly)}
                title={`${season}철 제철 재료만 보기 · ${seasonalCount}개`}
                className={`shrink-0 px-2.5 py-1 rounded-2xl text-xs font-medium transition-colors ${
                  seasonalOnly
                    ? 'bg-brand-primary text-white'
                    : 'bg-white border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5'
                }`}
              >
                {(() => {
                  const Icon = SEASON_ICON[season];
                  return (
                    <span className="inline-flex items-center gap-1">
                      <Icon size={11} strokeWidth={2.4} />
                      <span>제철 {seasonalCount}</span>
                    </span>
                  );
                })()}
              </button>
            )}
          </div>
        </div>

            {/* 아이템 리스트 — viewMode === 'list'일 때만 표시 */}
            {viewMode === 'list' && (
              storageFilter === '전체' && groupFilter === '전체' && !search && !seasonalOnly ? (
                <>
                  {(['신선식품', '가공식품', '음료·간식', '기타'] as FoodGroup[]).map((grp) => {
                    const group = items.filter((i) => (FOOD_GROUP[i.foodCategory] ?? '기타') === grp);
                    if (group.length === 0) return null;
                    const grpEmoji = grp === '신선식품' ? '🥬' : grp === '가공식품' ? '🍜' : grp === '음료·간식' ? '🧃' : '📦';
                    return (
                      <div key={grp}>
                        <div className="flex items-center gap-2 mb-2 mt-1">
                          <span className="text-sm px-2 py-0.5 rounded-full font-semibold bg-brand-primary/10 text-brand-primary">
                            {grpEmoji} {grp} {group.length}
                          </span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <AnimatePresence mode="popLayout">
                          <div className="flex flex-col gap-3">
                            {group.map((item, index) => (
                              <SwipeFoodCard
                                key={item.id}
                                item={item}
                                dDay={item.dDay}
                                index={index}
                                onDiscard={handleDiscard}
                                onUpdate={updateItem}
                                expanded={expandedFoodId === item.id}
                                onToggle={() => setExpandedFoodId(expandedFoodId === item.id ? null : item.id)}
                              />
                            ))}
                          </div>
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <SwipeFoodCard
                      key={item.id}
                      item={item}
                      dDay={item.dDay}
                      index={index}
                      onDiscard={handleDiscard}
                      onUpdate={updateItem}
                      expanded={expandedFoodId === item.id}
                      onToggle={() => setExpandedFoodId(expandedFoodId === item.id ? null : item.id)}
                    />
                  ))}
                </AnimatePresence>
              )
            )}

            {items.length === 0 && allFood.length > 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="flex justify-center mb-2"><EmojiIcon emoji="🔍" size={28} className="text-gray-400" /></div>
                <p className="text-sm font-medium">검색 결과가 없어요</p>
                <button onClick={() => { setSearch(''); setStorageFilter('전체'); setGroupFilter('전체'); }} className="text-xs text-brand-primary mt-1">
                  필터 초기화
                </button>
              </div>
            )}

            {allFood.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="flex justify-center mb-3"><EmojiIcon emoji="🧊" size={32} className="text-gray-400" /></div>
                <p className="text-sm font-medium">냉장고가 비어있어요</p>
                <p className="text-xs mt-1">+ 버튼을 눌러 식품을 추가해보세요.</p>
              </div>
            )}
          </>
        )}

        {/* ─── 추천 탭 ────────────────────────────── */}
        {activeTab === 'suggest' && (
          <>
            <SectionErrorBoundary label="제철 재료">
              <SeasonalProduceSection
                currentNames={allFood.map((f) => f.name)}
                onQuickAdd={handleSeasonalAdd}
              />
            </SectionErrorBoundary>

            <SectionErrorBoundary label="영양 밸런스">
              <NutritionBalanceSection foods={allFood} />
            </SectionErrorBoundary>

            <SectionErrorBoundary label="오늘 뭐 먹지">
              <FeelingLuckySection foods={allFood} />
            </SectionErrorBoundary>

            <SectionErrorBoundary label="레시피 추천">
              <RecipeSection foods={allFood} />
            </SectionErrorBoundary>
          </>
        )}

        {/* ─── 장보기 탭 ────────────────────────────── */}
        {activeTab === 'shopping' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className={CARD}
              style={CARD_SHADOW}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <EmojiIcon emoji="⚡" size={16} className="text-gray-600" />
                <span className="text-xs text-gray-400 font-medium">빠른 추가</span>
              </div>
              {profiles.length >= 2 && (
                <div className="flex gap-1 mb-2 flex-wrap items-center">
                  <span className="text-sm text-gray-400">누구 것:</span>
                  <button
                    onClick={() => setQuickAddOwner(undefined)}
                    className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
                      !quickAddOwner
                        ? 'bg-gray-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    공용
                  </button>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setQuickAddOwner(p.id)}
                      className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
                        quickAddOwner === p.id
                          ? 'bg-brand-primary text-white'
                          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_ADD_FOODS.map((preset) => {
                  const tone = getFoodCategoryTone(preset.foodCategory);
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleQuickAdd(preset)}
                      className="flex items-center gap-1.5 text-xs pl-1 pr-2.5 py-1 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-brand-primary/5 hover:border-brand-primary/20 hover:text-brand-primary active:scale-95 transition-all"
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${tone.bg}`}>
                        <span className="text-base leading-none" aria-hidden>{tone.emoji}</span>
                      </div>
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <RebuySection
              history={discardHistory}
              currentNames={allFood.map((f) => f.name)}
              onQuickAdd={handleRebuy}
            />
          </>
        )}
      </div>

      {/* 칸 상세 바텀 시트 — 시각화에서 칸 탭 시 */}
      <SectionDetailSheet
        section={activeSection}
        items={
          activeSection
            ? items.filter((i) => {
                const sec = i.fridgeSection ?? recommendFridgeSection(i);
                return sec === activeSection;
              })
            : []
        }
        onClose={() => setActiveSection(null)}
        onDiscard={handleDiscard}
        onUpdate={updateItem}
      />
    </div>
  );
}
