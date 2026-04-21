'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFoodItem, type StorageType, type FoodGroup, FOOD_GROUP } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { calcRemainingDays } from '@/components/FoodTags';
import { Search } from 'lucide-react';

import { springTransition, CARD, CARD_SHADOW } from '@/components/fridge/shared';
import SwipeFoodCard           from '@/components/fridge/SwipeFoodCard';
import NutritionBalanceSection from '@/components/fridge/NutritionBalanceSection';
import FeelingLuckySection     from '@/components/fridge/FeelingLuckySection';
import RecipeSection           from '@/components/fridge/RecipeSection';
import RebuySection            from '@/components/fridge/RebuySection';
import SeasonalProduceSection  from '@/components/fridge/SeasonalProduceSection';
import SectionErrorBoundary    from '@/components/SectionErrorBoundary';
import { isSeasonalProduce, SEASONAL_PRODUCE, type SeasonalProduce } from '@/lib/seasonalProduce';
import { currentSeasonByMonth } from '@/lib/season';
import { SEASON_EMOJI }         from '@/lib/recipes';
import { useProfiles }         from '@/lib/profile';
import { usePersistedState }   from '@/lib/usePersistedState';

type StorageFilter = '전체' | StorageType;
type GroupFilter   = '전체' | FoodGroup;
type SortKey       = 'dDay' | 'name' | 'seasonal';

const SORT_CYCLE: Record<SortKey, { next: SortKey; label: string }> = {
  dDay:     { next: 'name',     label: '📅 임박순' },
  name:     { next: 'seasonal', label: '🔤 이름순' },
  seasonal: { next: 'dDay',     label: '🌸 제철 먼저' },
};

const QUICK_ADD_FOODS: { name: string; foodCategory: import('@/types').FoodCategory; storageType: StorageType; days: number; img: string }[] = [
  { name: '우유 1L',    foodCategory: '유제품',      storageType: '냉장', days: 10, img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop' },
  { name: '달걀 10구',  foodCategory: '정육·계란',   storageType: '냉장', days: 21, img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop' },
  { name: '식빵',       foodCategory: '빵·베이커리', storageType: '실온', days: 4,  img: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=300&h=300&fit=crop' },
  { name: '바나나',     foodCategory: '채소·과일',   storageType: '실온', days: 5,  img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop' },
  { name: '닭가슴살',   foodCategory: '정육·계란',   storageType: '냉동', days: 60, img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=300&h=300&fit=crop' },
  { name: '요거트',     foodCategory: '유제품',      storageType: '냉장', days: 14, img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop' },
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

  function handleQuickAdd(preset: typeof QUICK_ADD_FOODS[number]) {
    const { added } = addItems([{
      id: `qa-${Date.now()}`,
      name: preset.name,
      category: '식품',
      foodCategory: preset.foodCategory,
      storageType: preset.storageType,
      baseShelfLifeDays: preset.days,
      purchaseDate: new Date().toISOString().split('T')[0],
      imageUrl: preset.img,
      ownerId: quickAddOwner,
    }]);
    if (added > 0) showToast(`"${preset.name}" 추가됐어요!`);
    else showToast(`"${preset.name}" 이미 있어요.`);
  }

  function handleRebuy(name: string) {
    const { added } = addItems([{
      id: `rb-${Date.now()}`,
      name,
      category: '식품',
      foodCategory: '기타 식품',
      storageType: '냉장',
      baseShelfLifeDays: 7,
      purchaseDate: new Date().toISOString().split('T')[0],
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
    }]);
    if (added > 0) showToast(`"${p.name}" 담았어요! 제철이라 가장 맛있을 때예요.`);
    else showToast(`"${p.name}" 이미 있어요.`);
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 냉장고</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">식품 {allFood.length}개 관리 중 · ← 밀어서 소진</p>
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">
        {/* 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className={CARD}
          style={CARD_SHADOW}
        >
          <div className="flex justify-between text-center mb-3">
            <div className="flex-1">
              <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{allFood.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">전체</p>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-extrabold text-sky-600 tabular-nums">{coldCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">냉장</p>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-extrabold text-indigo-600 tabular-nums">{frozenCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">냉동</p>
            </div>
            <div className="flex-1">
              <p className={`text-2xl font-extrabold tabular-nums ${urgentCount > 0 ? 'text-brand-warning' : 'text-gray-900'}`}>
                {urgentCount}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">임박</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {foodGroupCounts.map(({ group, count }) => (
              <span key={group} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium tabular-nums">
                {group} {count}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 빠른 추가 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-base">⚡</span>
            <span className="text-xs text-gray-400 font-medium">빠른 추가</span>
          </div>
          {/* 소유자 선택 — 프로필 2명 이상일 때만 */}
          {profiles.length >= 2 && (
            <div className="flex gap-1 mb-2 flex-wrap items-center">
              <span className="text-[10px] text-gray-400">누구 것:</span>
              <button
                onClick={() => setQuickAddOwner(undefined)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
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
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
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
            {QUICK_ADD_FOODS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleQuickAdd(preset)}
                className="flex items-center gap-1.5 text-[11px] pl-1 pr-2.5 py-1 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-brand-primary/5 hover:border-brand-primary/20 hover:text-brand-primary active:scale-95 transition-all"
              >
                <div className="w-6 h-6 rounded-lg overflow-hidden bg-white shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset.img} alt="" className="w-full h-full object-cover" />
                </div>
                {preset.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 제철 재료 추천 */}
        <SectionErrorBoundary label="제철 재료">
          <SeasonalProduceSection
            currentNames={allFood.map((f) => f.name)}
            onQuickAdd={handleSeasonalAdd}
          />
        </SectionErrorBoundary>

        {/* 재구매 추천 */}
        <RebuySection
          history={discardHistory}
          currentNames={allFood.map((f) => f.name)}
          onQuickAdd={handleRebuy}
        />

        {/* 영양 밸런스 */}
        <SectionErrorBoundary label="영양 밸런스">
          <NutritionBalanceSection foods={allFood} />
        </SectionErrorBoundary>

        {/* 오늘 뭐 먹지? */}
        <SectionErrorBoundary label="오늘 뭐 먹지">
          <FeelingLuckySection foods={allFood} />
        </SectionErrorBoundary>

        {/* 레시피 추천 */}
        <SectionErrorBoundary label="레시피 추천">
          <RecipeSection foods={allFood} />
        </SectionErrorBoundary>

        {/* 검색 + 필터 */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="상품 검색"
                aria-label="냉장고 상품 검색"
                className="w-full pl-8 pr-3 py-2 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>
          {/* 제철 자동완성 — 검색어에 매칭되는 제철 재료 + 현재 미보유 */}
          {(() => {
            const q = search.trim().toLowerCase();
            if (q.length === 0) return null;
            const haveNames = new Set(allFood.map((f) => f.name));
            const hits = SEASONAL_PRODUCE
              .filter((p) =>
                p.name.toLowerCase().includes(q)
                && !haveNames.has(p.name)
                && p.seasons.includes(season),
              )
              .slice(0, 4);
            if (hits.length === 0) return null;
            return (
              <div className="flex items-center gap-1.5 flex-wrap -mt-1">
                <span className="text-[9px] text-gray-400 font-medium">
                  {SEASON_EMOJI[season]} 지금 제철 · 바로 담기
                </span>
                {hits.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleSeasonalAdd(p)}
                    title={p.blurb}
                    className="flex items-center gap-0.5 text-[11px] pl-1.5 pr-2 py-0.5 rounded-full bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 active:scale-95 transition-all"
                  >
                    <span className="text-sm">{p.emoji}</span>
                    <span className="font-medium">{p.name}</span>
                    {p.peak === season && <span className="text-[9px] opacity-70">· 피크</span>}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
        {/* 프로필 필터 */}
        {profiles.length >= 2 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setOwnerFilter('전체')}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
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
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
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
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
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
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STORAGE_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStorageFilter(key)}
                  className={`px-2.5 py-1 rounded-2xl text-[11px] font-medium transition-colors ${
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
              className="text-[10px] text-gray-400 px-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {SORT_CYCLE[sortBy].label}
            </button>
          </div>
          <div className="flex gap-1.5 items-center flex-wrap">
            {GROUP_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setGroupFilter(key)}
                className={`px-2.5 py-1 rounded-2xl text-[11px] font-medium transition-colors ${
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
                className={`px-2.5 py-1 rounded-2xl text-[11px] font-medium transition-colors ${
                  seasonalOnly
                    ? 'bg-brand-primary text-white'
                    : 'bg-white border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5'
                }`}
              >
                {SEASON_EMOJI[season]} 제철 {seasonalCount}
              </button>
            )}
          </div>
        </div>

        {/* 아이템 리스트 */}
        {storageFilter === '전체' && groupFilter === '전체' && !search && !seasonalOnly ? (
          <>
            {(['신선식품', '가공식품', '음료·간식', '기타'] as FoodGroup[]).map((grp) => {
              const group = items.filter((i) => (FOOD_GROUP[i.foodCategory] ?? '기타') === grp);
              if (group.length === 0) return null;
              const grpEmoji = grp === '신선식품' ? '🥬' : grp === '가공식품' ? '🍜' : grp === '음료·간식' ? '🧃' : '📦';
              return (
                <div key={grp}>
                  <div className="flex items-center gap-2 mb-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-brand-primary/10 text-brand-primary">
                      {grpEmoji} {grp} {group.length}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <AnimatePresence mode="popLayout">
                    <div className="flex flex-col gap-3">
                      {group.map((item, index) => (
                        <SwipeFoodCard key={item.id} item={item} dDay={item.dDay} index={index} onDiscard={handleDiscard} onUpdate={updateItem} />
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
              <SwipeFoodCard key={item.id} item={item} dDay={item.dDay} index={index} onDiscard={handleDiscard} onUpdate={updateItem} />
            ))}
          </AnimatePresence>
        )}

        {items.length === 0 && allFood.length > 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium">검색 결과가 없어요</p>
            <button onClick={() => { setSearch(''); setStorageFilter('전체'); setGroupFilter('전체'); }} className="text-xs text-brand-primary mt-1">
              필터 초기화
            </button>
          </div>
        )}

        {allFood.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🧊</p>
            <p className="text-sm font-medium">냉장고가 비어있어요</p>
            <p className="text-xs mt-1">+ 버튼을 눌러 식품을 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
