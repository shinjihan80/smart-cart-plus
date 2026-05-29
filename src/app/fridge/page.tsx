'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFoodItem, type StorageType, type FoodGroup, type FridgeSection, FOOD_GROUP } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { calcRemainingDays } from '@/components/FoodTags';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { useSearchShortcut } from '@/lib/useSearchShortcut';
import PaletteButton from '@/components/PaletteButton';
import EmojiIcon from '@/components/EmojiIcon';
import ShoppingMallCard from '@/components/ShoppingMallCard';

import { springTransition, CARD, CARD_SHADOW } from '@/components/fridge/shared';
import SwipeFoodCard           from '@/components/fridge/SwipeFoodCard';
import NutritionBalanceSection from '@/components/fridge/NutritionBalanceSection';
import FeelingLuckySection     from '@/components/fridge/FeelingLuckySection';
import RecipeSection           from '@/components/fridge/RecipeSection';
import RebuySection            from '@/components/fridge/RebuySection';
import SeasonalProduceSection  from '@/components/fridge/SeasonalProduceSection';
import SectionErrorBoundary    from '@/components/SectionErrorBoundary';
import { FridgeView }          from '@/components/fridge/FridgeView';
import { FridgeModelPicker }   from '@/components/fridge/FridgeModelPicker';
import { SectionDetailSheet }  from '@/components/fridge/SectionDetailSheet';
import { isSeasonalProduce, type SeasonalProduce } from '@/lib/seasonalProduce';
import { currentSeasonByMonth } from '@/lib/season';
import { SEASON_ICON }          from '@/lib/iconMap';
import { useProfiles }         from '@/lib/profile';
import { usePersistedState }   from '@/lib/usePersistedState';
import { useFridgeInstances, DEFAULT_FRIDGE_INSTANCE } from '@/lib/useFridgeInstances';
import { InstanceMetaEditor } from '@/components/InstanceMetaEditor';
import { recommendFridgeSection, FRIDGE_SECTION_META } from '@/lib/fridgeSection';
import { FRIDGE_MODELS, resolveSectionForModel } from '@/lib/fridgeModel';
import { getFoodCategoryTone } from '@/lib/categoryImages';

type StorageFilter = '전체' | StorageType;
type GroupFilter   = '전체' | FoodGroup;
type SortKey       = 'dDay' | 'name' | 'seasonal';
type FridgeTab     = 'fridge' | 'food' | 'suggest' | 'shopping';

const RELATION_EMOJI: Record<string, string> = {
  본인: '👤', 배우자: '💞', 자녀: '🧒', 부모: '🧑‍🦳', 기타: '👥',
};

const FRIDGE_TABS: { id: FridgeTab; emoji: string; label: string }[] = [
  { id: 'fridge',   emoji: '🧊', label: '냉장고' },
  { id: 'food',     emoji: '🍽️', label: '음식' },
  { id: 'suggest',  emoji: '💡', label: '추천' },
  { id: 'shopping', emoji: '🛒', label: '장보기' },
];

const isFridgeTab = (v: unknown): v is FridgeTab =>
  v === 'fridge' || v === 'food' || v === 'suggest' || v === 'shopping';

const SORT_CYCLE: Record<SortKey, { next: SortKey; label: string }> = {
  dDay:     { next: 'name',     label: '📅 임박순' },
  name:     { next: 'seasonal', label: '🔤 이름순' },
  seasonal: { next: 'dDay',     label: '🌸 제철 먼저' },
};
const SORT_PLAIN: Record<SortKey, string> = {
  dDay: '임박순', name: '이름순', seasonal: '제철 먼저',
};
const FOOD_GROUP_EMOJI: Record<string, string> = {
  신선식품: '🥬', 가공식품: '🍜', '음료·간식': '🧃', 기타: '📦',
};

const QUICK_ADD_FOODS: { name: string; foodCategory: import('@/types').FoodCategory; storageType: StorageType; days: number }[] = [
  { name: '우유 1L',    foodCategory: '유제품',      storageType: '냉장', days: 10 },
  { name: '달걀 10구',  foodCategory: '정육·계란',   storageType: '냉장', days: 21 },
  { name: '식빵',       foodCategory: '빵·베이커리', storageType: '실온', days: 4  },
  { name: '바나나',     foodCategory: '채소·과일',   storageType: '실온', days: 5  },
  { name: '닭가슴살',   foodCategory: '정육·계란',   storageType: '냉동', days: 60 },
  { name: '요거트',     foodCategory: '유제품',      storageType: '냉장', days: 14 },
];

export default function FridgePage() {
  const { items: allItems, addItems, updateItem, removeItem, undoRemove, discardHistory, loadSampleData } = useCart();
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
  const [viewMode, setViewMode] = usePersistedState<'visual' | 'list' | 'compact'>(
    'nemoa-fridge-view', 'visual',
    (raw) => (raw === 'visual' || raw === 'list' || raw === 'compact') ? raw : null,
  );
  const [activeTab, setActiveTab] = usePersistedState<FridgeTab>(
    'nemoa-fridge-tab', 'fridge',
    (raw) => (isFridgeTab(raw) ? raw : null),
  );
  useEffect(() => { setActiveTab('fridge'); }, []);
  const [compactDetailId, setCompactDetailId] = useState<string | null>(null);
  const compactDetailItem = compactDetailId ? allItems.filter(isFoodItem).find(i => i.id === compactDetailId) ?? null : null;
  const compactDetailDDay = compactDetailItem ? calcRemainingDays(compactDetailItem.purchaseDate, compactDetailItem.baseShelfLifeDays) : 0;
  const {
    instances: fridgeInstances,
    activeId: activeFridgeId,
    activeInstance: activeFridgeInstance,
    setActiveId: setActiveFridgeId,
    addInstance: addFridgeInstance,
    removeInstance: removeFridgeInstance,
    updateModelId: updateFridgeModelId,
    renameInstance: renameFridgeInstance,
    updateEmoji:    updateFridgeEmoji,
  } = useFridgeInstances();
  const fridgeModelId = activeFridgeInstance?.modelId ?? DEFAULT_FRIDGE_INSTANCE.modelId;
  const [showFridgePicker, setShowFridgePicker] = useState(false);
  const [activeSection, setActiveSection] = useState<FridgeSection | null>(null);
  const [expandedFoodId, setExpandedFoodId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchInputRef, () => setSearch(''));
  const season = currentSeasonByMonth();

  const allFood = allItems.filter(isFoodItem)
    .filter((i) => (i.fridgeInstanceId ?? fridgeInstances[0]?.id ?? DEFAULT_FRIDGE_INSTANCE.id) === activeFridgeId)
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
      fridgeInstanceId: activeFridgeId,
    }]);
    if (added > 0) showToast(`"${preset.name}" 추가됐어요!`);
    else showToast(`"${preset.name}" 이미 있어요.`);
  }

  function cycleFridgeSort() {
    const keys: SortKey[] = ['dDay', 'name', 'seasonal'];
    setSortBy(keys[(keys.indexOf(sortBy) + 1) % keys.length]);
  }

  function scrollToFridgeItems() {
    setTimeout(() => {
      document.getElementById('fridge-items-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function scrollToStorage(filter: StorageFilter) {
    setActiveTab('food');
    if (viewMode === 'visual') setViewMode('list');
    setStorageFilter(filter);
    scrollToFridgeItems();
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
      fridgeInstanceId: activeFridgeId,
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
      fridgeInstanceId: activeFridgeId,
    }]);
    if (added > 0) showToast(`"${p.name}" 담았어요! 제철이라 가장 맛있을 때예요.`);
    else showToast(`"${p.name}" 이미 있어요.`);
  }

  const vm = viewMode;

  return (
    <div>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 냉장고</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {fridgeInstances.length > 1 ? `${activeFridgeInstance?.name ?? '냉장고'} · ` : ''}{FRIDGE_MODELS[fridgeModelId].label} · 식품 {allFood.length}개
            </p>
          </div>
          <PaletteButton />
        </div>
        <div className="overflow-x-auto scrollbar-hide border-b border-gray-100">
          <div role="tablist" aria-label="냉장고 탭" className="flex px-4">
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
                    'shrink-0 flex items-center gap-1 px-4 py-2.5 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px',
                    isActive
                      ? 'font-semibold text-brand-primary border-brand-primary'
                      : 'font-medium text-gray-500 border-transparent hover:text-gray-700',
                  ].join(' ')}
                >
                  {t.emoji} {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">

        {/* ─── 냉장고 탭 ────────────────────────────── */}
        {activeTab === 'fridge' && (
          <>
            {/* 냉장고 인스턴스 탭 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
                {fridgeInstances.map((inst) => (
                  <div key={inst.id} className="flex items-center shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveFridgeId(inst.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                        inst.id === activeFridgeId ? 'bg-brand-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-sm leading-none">{inst.emoji ?? '🧊'}</span>
                      {inst.name}
                    </button>
                    {fridgeInstances.length > 1 && inst.id !== fridgeInstances[0].id && (
                      <button
                        type="button"
                        onClick={() => removeFridgeInstance(inst.id)}
                        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[11px] leading-none hover:bg-red-100 hover:text-red-500 transition-colors"
                        aria-label={`${inst.name} 삭제`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFridgeInstance}
                  className="shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-base font-bold hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                  aria-label="냉장고 추가"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowFridgePicker(v => !v)}
                className="shrink-0 text-[11px] font-semibold text-brand-primary bg-brand-primary/8 hover:bg-brand-primary/15 px-2.5 py-1 rounded-full transition-all whitespace-nowrap"
              >
                {activeFridgeInstance?.name ?? '냉장고'} 유형 변경
              </button>
            </div>
            {showFridgePicker && (
              <div className="flex flex-col gap-2.5">
                <InstanceMetaEditor
                  name={activeFridgeInstance?.name ?? ''}
                  emoji={activeFridgeInstance?.emoji ?? '🧊'}
                  emojis={['🧊','❄️','🍱','🥩','🥦','🫙','🍺','🥡','🏠','🌿','⭐','❤️']}
                  onNameChange={(n) => renameFridgeInstance(activeFridgeId, n)}
                  onEmojiChange={(e) => updateFridgeEmoji(activeFridgeId, e)}
                />
                <FridgeModelPicker
                  selected={fridgeModelId}
                  onSelect={(id) => { updateFridgeModelId(activeFridgeId, id); setShowFridgePicker(false); }}
                  compact
                />
              </div>
            )}

            {/* 요약 4수치 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className={CARD}
              style={CARD_SHADOW}
            >
              <div className="flex justify-between text-center">
                <button className="flex-1 active:opacity-70 transition-opacity" onClick={() => { setStorageFilter('전체'); setGroupFilter('전체'); setActiveTab('food'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <p className="text-base font-bold text-gray-900 tabular-nums">{allFood.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">전체</p>
                </button>
                <button className="flex-1 active:opacity-70 transition-opacity" onClick={() => scrollToStorage('냉장')}>
                  <p className="text-base font-bold text-sky-600 tabular-nums">{coldCount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">냉장</p>
                </button>
                <button className="flex-1 active:opacity-70 transition-opacity" onClick={() => scrollToStorage('냉동')}>
                  <p className="text-base font-bold text-indigo-600 tabular-nums">{frozenCount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">냉동</p>
                </button>
                <button className="flex-1 active:opacity-70 transition-opacity" onClick={() => { setActiveTab('food'); setStorageFilter('전체'); setSortBy('dDay'); scrollToFridgeItems(); }}>
                  <p className={`text-base font-bold tabular-nums ${urgentCount > 0 ? 'text-brand-warning' : 'text-gray-900'}`}>
                    {urgentCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">임박</p>
                </button>
              </div>
              {foodGroupCounts.length > 0 && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-50">
                  {foodGroupCounts.map(({ group, count }) => (
                    <span key={group} className="text-xs text-gray-400">
                      {group} <strong className="font-semibold text-gray-600 tabular-nums">{count}</strong>
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 시각화 */}
            {allFood.length > 0 && (
              <FridgeView
                modelId={fridgeModelId}
                items={items}
                onSectionClick={setActiveSection}
              />
            )}


            {allFood.length === 0 && (
              <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-2">
                <EmojiIcon emoji="🧊" size={32} className="text-gray-400" />
                <p className="text-sm font-medium">냉장고가 비어있어요</p>
                <p className="text-xs">+ 버튼을 눌러 식품을 추가하거나 샘플로 체험해보세요</p>
                <button
                  onClick={() => {
                    const n = loadSampleData();
                    showToast(`샘플 ${n}개 불러왔어요. 설정에서 언제든 초기화할 수 있어요.`);
                  }}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90 active:scale-95 transition-all"
                >
                  🎯 샘플 데이터로 채우기
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── 음식 탭 ────────────────────────────── */}
        {activeTab === 'food' && (
          <>
            {/* 요약 4수치 */}
            <div className={CARD} style={CARD_SHADOW}>
              <div className="flex justify-between text-center">
                <button className="flex-1 active:opacity-70 transition-opacity" onClick={() => { setStorageFilter('전체'); setGroupFilter('전체'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <p className="text-base font-bold text-gray-900 tabular-nums">{allFood.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">전체</p>
                </button>
                <button className="flex-1 active:opacity-70 transition-opacity" onClick={() => { setStorageFilter('냉장'); scrollToFridgeItems(); }}>
                  <p className="text-base font-bold text-sky-600 tabular-nums">{coldCount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">냉장</p>
                </button>
                <button className="flex-1 active:opacity-70 transition-opacity" onClick={() => { setStorageFilter('냉동'); scrollToFridgeItems(); }}>
                  <p className="text-base font-bold text-indigo-600 tabular-nums">{frozenCount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">냉동</p>
                </button>
                <button className="flex-1 active:opacity-70 transition-opacity" onClick={() => { setStorageFilter('전체'); setSortBy('dDay'); scrollToFridgeItems(); }}>
                  <p className={`text-base font-bold tabular-nums ${urgentCount > 0 ? 'text-brand-warning' : 'text-gray-900'}`}>
                    {urgentCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">임박</p>
                </button>
              </div>
            </div>

            {/* 프로필 필터 (2명 이상일 때만) */}
            {profiles.length >= 2 && (
              <div role="tablist" aria-label="구성원 필터" className="flex bg-gray-100 rounded-full p-0.5 overflow-x-auto scrollbar-hide w-fit">
                {([
                  { key: '전체', label: '전체' },
                  ...profiles.map(p => ({ key: p.id, label: p.name })),
                  { key: '공용', label: '공용' },
                ] as { key: string; label: string }[]).map(({ key, label }) => {
                  const isActive = ownerFilter === key;
                  return (
                    <button key={key} type="button" role="tab" aria-selected={isActive}
                      onClick={() => setOwnerFilter(key)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 타이틀 + 개수 + 정렬 + 뷰토글 — 한 줄 */}
            <div id="fridge-items-top" className="flex items-center gap-2 scroll-mt-28">
              {(storageFilter === '냉장' || storageFilter === '냉동') && (
                <span className="text-base font-bold text-gray-900 tracking-tight">
                  {storageFilter === '냉장' ? '❄️ 냉장' : '🧊 냉동'}
                </span>
              )}
              <span className="text-xs text-gray-400 font-medium tabular-nums">{items.length}개</span>
              <div className="flex-1 h-px bg-gray-100" />
              {seasonalCount > 0 && (
                <button onClick={() => setSeasonalOnly(!seasonalOnly)}
                  className={`shrink-0 px-2.5 py-1 rounded-2xl text-xs font-medium transition-colors ${
                    seasonalOnly ? 'bg-brand-primary text-white' : 'bg-white border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5'
                  }`}>
                  {(() => { const Icon = SEASON_ICON[season]; return <span className="inline-flex items-center gap-1"><Icon size={11} strokeWidth={2.4} /><span>제철 {seasonalCount}</span></span>; })()}
                </button>
              )}
              <button onClick={cycleFridgeSort}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 active:scale-95 transition-all">
                <SlidersHorizontal size={12} strokeWidth={2.5} />
                <span className="text-xs font-medium">{SORT_PLAIN[sortBy]}</span>
              </button>
              <div role="tablist" aria-label="보기 방식" className="flex bg-gray-100 rounded-full p-1 shrink-0">
                <button type="button" role="tab" aria-selected={vm !== 'compact'} onClick={() => setViewMode('list')}
                  className={`flex items-center px-2.5 py-1.5 rounded-full transition-colors ${vm !== 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  <List size={16} strokeWidth={2.2} />
                </button>
                <button type="button" role="tab" aria-selected={vm === 'compact'} onClick={() => setViewMode('compact')}
                  className={`flex items-center px-2.5 py-1.5 rounded-full transition-colors ${vm === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  <LayoutGrid size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* ─── 리스트 뷰 ─── */}
            {(vm === 'list' || vm === 'visual') && (
              storageFilter === '전체' && groupFilter === '전체' && !search && !seasonalOnly ? (
                <>
                  {(['신선식품', '가공식품', '음료·간식', '기타'] as FoodGroup[]).map((grp) => {
                    const group = items.filter((i) => (FOOD_GROUP[i.foodCategory] ?? '기타') === grp);
                    if (group.length === 0) return null;
                    return (
                      <div key={grp} id={`fridge-group-${grp}`} className="scroll-mt-28">
                        <div className="flex items-center gap-2 mb-2 mt-1">
                          <span className="text-base font-bold text-gray-900 tracking-tight">{FOOD_GROUP_EMOJI[grp]} {grp}</span>
                          <span className="text-xs text-gray-400 font-medium tabular-nums">{group.length}개</span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <AnimatePresence mode="popLayout">
                          <div className="flex flex-col gap-3">
                            {group.map((item, index) => (
                              <SwipeFoodCard key={item.id} item={item} dDay={item.dDay} index={index}
                                fridgeModelId={fridgeModelId}
                                onDiscard={handleDiscard} onUpdate={updateItem}
                                expanded={expandedFoodId === item.id}
                                onToggle={() => setExpandedFoodId(expandedFoodId === item.id ? null : item.id)} />
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
                    <SwipeFoodCard key={item.id} item={item} dDay={item.dDay} index={index}
                      fridgeModelId={fridgeModelId}
                      onDiscard={handleDiscard} onUpdate={updateItem}
                      expanded={expandedFoodId === item.id}
                      onToggle={() => setExpandedFoodId(expandedFoodId === item.id ? null : item.id)} />
                  ))}
                </AnimatePresence>
              )
            )}

            {/* ─── 간략(그리드) 뷰 ─── */}
            {vm === 'compact' && (
              storageFilter === '전체' && groupFilter === '전체' && !search && !seasonalOnly ? (
                <>
                  {(['신선식품', '가공식품', '음료·간식', '기타'] as FoodGroup[]).map((grp) => {
                    const group = items.filter((i) => (FOOD_GROUP[i.foodCategory] ?? '기타') === grp);
                    if (group.length === 0) return null;
                    return (
                      <div key={grp} id={`fridge-group-${grp}`} className="scroll-mt-28">
                        <div className="flex items-center gap-2 mb-2 mt-1">
                          <span className="text-base font-bold text-gray-900 tracking-tight">{FOOD_GROUP_EMOJI[grp]} {grp}</span>
                          <span className="text-xs text-gray-400 font-medium tabular-nums">{group.length}개</span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {group.map((item) => {
                            const tone = getFoodCategoryTone(item.foodCategory);
                            return (
                              <button key={item.id} onClick={() => setCompactDetailId(item.id)}
                                className="rounded-2xl overflow-hidden bg-white border border-gray-100 text-left active:scale-95 transition-transform">
                                <div className={`aspect-square relative flex items-center justify-center ${tone.bg}`}>
                                  <span className="text-3xl" aria-hidden>{tone.emoji}</span>
                                  {item.dDay <= 3 && (
                                    <span className={`absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.dDay <= 0 ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'}`}>
                                      {item.dDay <= 0 ? 'D-day' : `D-${item.dDay}`}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-gray-800 px-2 pt-1.5 pb-2 truncate">{item.name}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {items.map((item) => {
                    const tone = getFoodCategoryTone(item.foodCategory);
                    return (
                      <button key={item.id} onClick={() => setCompactDetailId(item.id)}
                        className="rounded-2xl overflow-hidden bg-white border border-gray-100 text-left active:scale-95 transition-transform">
                        <div className={`aspect-square relative flex items-center justify-center ${tone.bg}`}>
                          <span className="text-3xl" aria-hidden>{tone.emoji}</span>
                          {item.dDay <= 3 && (
                            <span className={`absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.dDay <= 0 ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'}`}>
                              {item.dDay <= 0 ? 'D-day' : `D-${item.dDay}`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-800 px-2 pt-1.5 pb-2 truncate">{item.name}</p>
                      </button>
                    );
                  })}
                </div>
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
              <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-2">
                <EmojiIcon emoji="🧊" size={32} className="text-gray-400" />
                <p className="text-sm font-medium">냉장고가 비어있어요</p>
                <p className="text-xs">+ 버튼을 눌러 식품을 추가하거나 샘플로 체험해보세요</p>
                <button
                  onClick={() => {
                    const n = loadSampleData();
                    showToast(`샘플 ${n}개 불러왔어요. 설정에서 언제든 초기화할 수 있어요.`);
                  }}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90 active:scale-95 transition-all"
                >
                  🎯 샘플 데이터로 채우기
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── 추천 탭 (정보성 — 무엇을 보여주거나 분석) ─── */}
        {activeTab === 'suggest' && (
          <>
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
            <ShoppingMallCard
              domain="groceries"
              title="식품 쇼핑몰"
              subtitle="장보기 — 탭하면 새 창으로 이동"
              emoji="🥬"
            />

            <div className="flex items-center gap-2">
              <EmojiIcon emoji="⚡" size={16} className="text-gray-600" />
              <span className="text-base font-bold text-gray-900 tracking-tight">빠른 추가</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className={CARD}
              style={CARD_SHADOW}
            >
              {profiles.length >= 2 && (
                <div className="flex bg-gray-100 rounded-full p-0.5 mb-2 w-fit">
                  <button
                    onClick={() => setQuickAddOwner(undefined)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      !quickAddOwner ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    공용
                  </button>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setQuickAddOwner(p.id)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        quickAddOwner === p.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
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

            <SectionErrorBoundary label="제철 재료">
              <SeasonalProduceSection
                currentNames={allFood.map((f) => f.name)}
                onQuickAdd={handleSeasonalAdd}
              />
            </SectionErrorBoundary>
          </>
        )}
      </div>

      {/* ─── 간략 뷰 상세 바텀시트 ─── */}
      <AnimatePresence>
        {compactDetailItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40" onClick={() => setCompactDetailId(null)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-y-auto max-h-[88vh] pb-10"
            >
              <div className="sticky top-0 bg-white pt-3 pb-2 flex flex-col items-center">
                <div className="w-8 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-4 pb-1">
                <span className="text-sm font-bold text-gray-900 truncate">{compactDetailItem.name}</span>
                <button onClick={() => setCompactDetailId(null)}
                  className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors" aria-label="닫기">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div className="px-4 pt-1">
                <SwipeFoodCard item={compactDetailItem} dDay={compactDetailDDay} index={0}
                  fridgeModelId={fridgeModelId}
                  onDiscard={(id) => { handleDiscard(id); setCompactDetailId(null); }}
                  onUpdate={updateItem}
                  expanded={true}
                  onToggle={() => setCompactDetailId(null)}
                  hideToggle={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 칸 상세 바텀 시트 — 시각화에서 칸 탭 시 */}
      <SectionDetailSheet
        section={activeSection}
        fridgeModelId={fridgeModelId}
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
