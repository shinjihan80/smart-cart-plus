'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { isFoodItem, type FoodItem, type StorageType, type FoodGroup, FOOD_GROUP, FOOD_EMOJI } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { calcRemainingDays } from '@/components/FoodTags';
import { Snowflake, Thermometer, Package, Search } from 'lucide-react';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';

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
    if (info.offset.x < -80) {
      navigator.vibrate?.(30);
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
        <div className="flex items-center gap-3">
        {/* 썸네일 */}
        <div className="shrink-0 w-11 h-11 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{FOOD_EMOJI[item.foodCategory] ?? '📦'}</span>
          )}
        </div>
        {/* D-Day */}
        <div className="shrink-0 w-14 text-center">
          <p className={`text-xl font-extrabold tracking-tight tabular-nums ${
            isUrgent ? 'text-brand-warning' : 'text-gray-900'
          }`}>
            {dDay <= 0 ? '만료' : `D-${dDay}`}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
          {item.memo && <p className="text-[9px] text-gray-400 truncate mt-0.5">📝 {item.memo}</p>}
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
              <Icon size={10} />
              {style.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium">
              {FOOD_EMOJI[item.foodCategory] ?? '📦'} {item.foodCategory ?? '기타'}
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
                {/* 이미지 */}
                {item.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
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
                  </div>
                ) : (
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
                    <span className="text-[10px] font-medium">사진 추가</span>
                  </button>
                )}
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
                    <input
                      type="date"
                      defaultValue={item.purchaseDate}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (v && v !== item.purchaseDate) onUpdate(item.id, { purchaseDate: v });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full mt-0.5 text-xs text-gray-700 font-medium bg-gray-50 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums"
                    />
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
                {/* 보관일 수정 */}
                <div>
                  <span className="text-gray-400">보관 가능 일수</span>
                  <input
                    type="number"
                    defaultValue={item.baseShelfLifeDays}
                    min={1}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (v > 0 && v !== item.baseShelfLifeDays) onUpdate(item.id, { baseShelfLifeDays: v });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 mt-0.5 text-xs text-gray-700 font-medium bg-gray-50 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums"
                  />
                </div>
                {/* 메모 */}
                <div>
                  <span className="text-gray-400">메모</span>
                  <input
                    type="text"
                    defaultValue={item.memo ?? ''}
                    placeholder="메모를 입력하세요"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (item.memo ?? '')) onUpdate(item.id, { memo: v || undefined });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-0.5 text-xs text-gray-800 bg-gray-50 rounded-xl px-2.5 py-1.5 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                  />
                </div>
                {/* 공유 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const text = `🧊 ${item.name}\n📅 D-${dDay} (${item.storageType})\n${item.memo ? `📝 ${item.memo}` : ''}`.trim();
                    navigator.clipboard.writeText(text);
                    navigator.vibrate?.(15);
                  }}
                  className="w-full py-1.5 rounded-xl bg-gray-50 text-[10px] text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  📋 정보 복사하기
                </button>
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
  { id: 'r1', name: '두부 샐러드 볼',       emoji: '🥗', ingredients: ['두부', '샐러드'], time: '10분' },
  { id: 'r2', name: '불고기 덮밥',          emoji: '🍚', ingredients: ['불고기'],        time: '15분' },
  { id: 'r3', name: '감귤 스무디',          emoji: '🧃', ingredients: ['감귤'],          time: '5분' },
  { id: 'r4', name: '토스트 & 스크램블',     emoji: '🍞', ingredients: ['식빵', '달걀'],  time: '10분' },
  { id: 'r5', name: '연어 포케 볼',         emoji: '🐟', ingredients: ['연어', '샐러드'], time: '15분' },
  { id: 'r6', name: '김치찌개',             emoji: '🍲', ingredients: ['김치', '두부'],   time: '20분' },
  { id: 'r7', name: '우유 시리얼',          emoji: '🥛', ingredients: ['우유'],          time: '3분' },
  { id: 'r8', name: '라면 + 달걀',          emoji: '🍜', ingredients: ['라면', '달걀'],   time: '5분' },
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

// ── 재구매 추천 ──────────────────────────────────────────────────────────────
function RebuySection({
  history, currentNames, onQuickAdd,
}: {
  history: { name: string; category: string }[];
  currentNames: string[];
  onQuickAdd: (name: string) => void;
}) {
  // 소진된 식품 중 현재 보유하지 않은 것만 추천
  const suggestions = history
    .filter((h) => h.category === '식품')
    .filter((h) => !currentNames.includes(h.name))
    .filter((h, i, arr) => arr.findIndex((a) => a.name === h.name) === i) // 중복 제거
    .slice(0, 5);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.18 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-base">🔄</span>
        <span className="text-xs text-gray-400 font-medium">재구매 추천</span>
        <span className="text-[9px] text-gray-300">소진한 식품 기반</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {suggestions.map((s) => (
          <button
            key={s.name}
            onClick={() => onQuickAdd(s.name)}
            className="text-[11px] px-2.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100 active:scale-95 transition-all"
          >
            🔄 {s.name}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

type StorageFilter = '전체' | StorageType;
type GroupFilter   = '전체' | FoodGroup;
type SortKey = 'dDay' | 'name';

const QUICK_ADD_FOODS: { name: string; foodCategory: import('@/types').FoodCategory; storageType: StorageType; days: number; img: string }[] = [
  { name: '우유 1L',     foodCategory: '유제품',      storageType: '냉장', days: 10, img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop' },
  { name: '달걀 10구',   foodCategory: '정육·계란',   storageType: '냉장', days: 21, img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop' },
  { name: '식빵',        foodCategory: '빵·베이커리', storageType: '실온', days: 4,  img: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=300&h=300&fit=crop' },
  { name: '바나나',      foodCategory: '채소·과일',   storageType: '실온', days: 5,  img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop' },
  { name: '닭가슴살',    foodCategory: '정육·계란',   storageType: '냉동', days: 60, img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=300&h=300&fit=crop' },
  { name: '요거트',      foodCategory: '유제품',      storageType: '냉장', days: 14, img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop' },
];

export default function FridgePage() {
  const { items: allItems, addItems, updateItem, removeItem, undoRemove, discardHistory } = useCart();
  const { showToast } = useToast();
  const [search, setSearch]         = useState('');
  const [storageFilter, setStorageFilter] = useState<StorageFilter>('전체');
  const [groupFilter, setGroupFilter]     = useState<GroupFilter>('전체');
  const [sortBy, setSortBy]         = useState<SortKey>('dDay');

  const allFood = allItems.filter(isFoodItem)
    .map((f) => ({ ...f, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }));

  const items = allFood
    .filter((i) => storageFilter === '전체' || i.storageType === storageFilter)
    .filter((i) => groupFilter === '전체' || (FOOD_GROUP[i.foodCategory] ?? '기타') === groupFilter)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'dDay' ? a.dDay - b.dDay : a.name.localeCompare(b.name));

  const urgentCount = allFood.filter((i) => i.dDay <= 3).length;
  const coldCount   = allFood.filter((i) => i.storageType === '냉장').length;
  const frozenCount = allFood.filter((i) => i.storageType === '냉동').length;
  const roomCount   = allFood.filter((i) => i.storageType === '실온').length;

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

        {/* 재구매 추천 */}
        <RebuySection
          history={discardHistory}
          currentNames={allFood.map((f) => f.name)}
          onQuickAdd={handleRebuy}
        />

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
