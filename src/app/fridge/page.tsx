'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { isFoodItem, type FoodItem, type StorageType, type FoodGroup, FOOD_GROUP, FOOD_EMOJI } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { calcRemainingDays } from '@/components/FoodTags';
import { Snowflake, Thermometer, Package, Search } from 'lucide-react';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

const STORAGE_ICON = { 냉장: Snowflake, 냉동: Thermometer, 실온: Package } as const;
const STORAGE_STYLE = {
  냉장: { bg: 'bg-sky-50',    text: 'text-sky-600',    label: '냉장' },
  냉동: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: '냉동' },
  실온: { bg: 'bg-amber-50',  text: 'text-amber-600',  label: '실온' },
} as const;

// ── 스와이프 아이템 카드 ──────────────────────────────────────────────────────
function SwipeFoodCard({
  item,
  dDay,
  index,
  onDiscard,
  onUpdate,
}: {
  item: FoodItem;
  dDay: number;
  index: number;
  onDiscard: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FoodItem>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const x = useMotionValue(0);
  const bgColor = useTransform(
    x, [-120, -30, 0],
    ['rgb(255,241,242)', 'rgb(255,254,253)', 'rgb(255,255,255)'],
  );
  const discardOpacity = useTransform(x, [-120, -40], [1, 0]);
  const isUrgent = dDay <= 3;

  const style = STORAGE_STYLE[item.storageType];
  const Icon  = STORAGE_ICON[item.storageType];

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -80) onDiscard(item.id);
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
      {/* 뒤 레이어 */}
      <div className="absolute inset-0 flex items-center justify-end px-6 pointer-events-none">
        <motion.div style={{ opacity: discardOpacity }} className="flex flex-col items-center gap-0.5">
          <span className="text-xl">🗑️</span>
          <span className="text-[9px] font-semibold text-brand-warning">소진</span>
        </motion.div>
      </div>

      {/* 앞 레이어 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -130, right: 0 }}
        dragElastic={0.12}
        style={{ x, backgroundColor: bgColor, ...CARD_SHADOW }}
        onDragEnd={handleDragEnd}
        onClick={() => setExpanded(!expanded)}
        className="rounded-[32px] border border-gray-50 p-5 flex flex-col relative z-10 cursor-grab"
      >
        <div className="flex items-center gap-4">
        <div className="shrink-0 w-16 text-center">
          <p className={`text-2xl font-extrabold tracking-tight tabular-nums ${
            isUrgent ? 'text-brand-warning' : 'text-gray-900'
          }`}>
            {dDay <= 0 ? '만료' : `D-${dDay}`}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
              <Icon size={10} />
              {style.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium">
              {FOOD_EMOJI[item.foodCategory]} {item.foodCategory}
            </span>
          </div>
          {/* D-Day 프로그레스 바 */}
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
              <span className="text-[9px] text-gray-400 tabular-nums">{item.nutritionFacts.calories}kcal</span>
              <span className="text-[9px] text-gray-300">|</span>
              <span className="text-[9px] text-gray-400 tabular-nums">단 {item.nutritionFacts.protein}g</span>
              <span className="text-[9px] text-gray-300">|</span>
              <span className="text-[9px] text-gray-400 tabular-nums">지 {item.nutritionFacts.fat}g</span>
              <span className="text-[9px] text-gray-300">|</span>
              <span className="text-[9px] text-gray-400 tabular-nums">탄 {item.nutritionFacts.carbs}g</span>
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

        {/* 펼침 상세 */}
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
                {/* 이름 수정 */}
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
                    <span className="text-gray-400">구매일</span>
                    <p className="text-gray-700 font-medium tabular-nums mt-0.5">{item.purchaseDate}</p>
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── 레시피 추천 데이터 ────────────────────────────────────────────────────────
const RECIPES = [
  { id: 'r1', name: '두부 샐러드 볼',     emoji: '🥗', ingredients: ['두부', '샐러드'], time: '10분' },
  { id: 'r2', name: '불고기 덮밥',        emoji: '🍚', ingredients: ['불고기'],        time: '15분' },
  { id: 'r3', name: '감귤 스무디',        emoji: '🧃', ingredients: ['감귤'],          time: '5분' },
  { id: 'r4', name: '토스트 & 두부 스크램블', emoji: '🍞', ingredients: ['식빵', '두부'],  time: '10분' },
];

function RecipeSection({ foodNames }: { foodNames: string[] }) {
  const matched = RECIPES.filter((r) =>
    r.ingredients.some((ing) => foodNames.some((name) => name.includes(ing))),
  );
  if (matched.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.15 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">👨‍🍳</span>
        <span className="text-xs text-gray-400 font-medium">보유 식재료 레시피 추천</span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {matched.map((r) => (
          <div key={r.id} className="shrink-0 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 px-3.5 py-2.5 min-w-[120px]">
            <span className="text-2xl">{r.emoji}</span>
            <p className="text-xs font-semibold text-gray-800 mt-1.5">{r.name}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">⏱ {r.time}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

type StorageFilter = '전체' | StorageType;
type GroupFilter   = '전체' | FoodGroup;
type SortKey = 'dDay' | 'name';

export default function FridgePage() {
  const { items: allItems, updateItem, removeItem, undoRemove } = useCart();
  const { showToast } = useToast();
  const [search, setSearch]         = useState('');
  const [storageFilter, setStorageFilter] = useState<StorageFilter>('전체');
  const [groupFilter, setGroupFilter]     = useState<GroupFilter>('전체');
  const [sortBy, setSortBy]         = useState<SortKey>('dDay');

  const allFood = allItems.filter(isFoodItem)
    .map((f) => ({ ...f, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }));

  const items = allFood
    .filter((i) => storageFilter === '전체' || i.storageType === storageFilter)
    .filter((i) => groupFilter === '전체' || FOOD_GROUP[i.foodCategory] === groupFilter)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'dDay' ? a.dDay - b.dDay : a.name.localeCompare(b.name));

  const urgentCount = allFood.filter((i) => i.dDay <= 3).length;
  const coldCount   = allFood.filter((i) => i.storageType === '냉장').length;
  const frozenCount = allFood.filter((i) => i.storageType === '냉동').length;
  const roomCount   = allFood.filter((i) => i.storageType === '실온').length;

  const foodGroupCounts = (['신선식품', '가공식품', '음료·간식'] as FoodGroup[]).map((g) => ({
    group: g,
    count: allFood.filter((f) => FOOD_GROUP[f.foodCategory] === g).length,
  })).filter((g) => g.count > 0);

  function handleDiscard(id: string) {
    const name = allFood.find((i) => i.id === id)?.name ?? '';
    removeItem(id);
    showToast(`"${name}" 소진 처리됐어요.`, undoRemove);
  }

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

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 냉장고</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">식품 {allFood.length}개 · ← 밀어서 소진 처리</p>
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

        {/* 레시피 추천 */}
        <RecipeSection foodNames={allFood.map((f) => f.name)} />

        {/* 검색 + 필터 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품 검색"
              className="w-full pl-8 pr-3 py-2 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {/* 보관 타입 필터 */}
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
              onClick={() => setSortBy(sortBy === 'dDay' ? 'name' : 'dDay')}
              className="text-[10px] text-gray-400 px-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {sortBy === 'dDay' ? '📅 임박순' : '🔤 이름순'}
            </button>
          </div>
          {/* 식품 그룹 필터 */}
          <div className="flex gap-1.5">
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
          </div>
        </div>

        {/* 아이템 리스트 (보관 타입별 그룹 or 필터 결과) */}
        {storageFilter === '전체' && groupFilter === '전체' && !search ? (
          // 식품 그룹별 섹션 그룹핑
          <>
            {(['신선식품', '가공식품', '음료·간식', '기타'] as FoodGroup[]).map((grp) => {
              const group = items.filter((i) => FOOD_GROUP[i.foodCategory] === grp);
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
          // 검색/필터 결과 플랫 리스트
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
