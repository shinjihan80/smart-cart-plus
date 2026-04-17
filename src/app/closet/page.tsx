'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { isEnrichedClothingItem, isClothingItem, type ClothingItem, type FashionGroup, FASHION_GROUP, FASHION_EMOJI } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Wind, Thermometer, Droplets, Search } from 'lucide-react';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

const THICKNESS_STYLE = {
  얇음:   { bg: 'bg-sky-50',    text: 'text-sky-600',    icon: Wind },
  보통:   { bg: 'bg-slate-100', text: 'text-slate-600',  icon: Thermometer },
  두꺼움: { bg: 'bg-purple-50', text: 'text-purple-600', icon: Droplets },
} as const;

const SEASON_TAG_STYLE: Record<string, string> = {
  봄: 'bg-pink-50 text-pink-500',
  여름: 'bg-amber-50 text-amber-500',
  가을: 'bg-orange-50 text-orange-500',
  겨울: 'bg-blue-50 text-blue-500',
};

// ── 코디 추천 ────────────────────────────────────────────────────────────────
function OutfitSection({ items }: { items: ClothingItem[] }) {
  const month = new Date().getMonth() + 1;
  const season = month <= 2 || month === 12 ? '겨울' : month <= 5 ? '봄' : month <= 8 ? '여름' : '가을';
  const seasonItems = items.filter((c) => c.weatherTags?.includes(season));
  const otherItems  = items.filter((c) => !c.weatherTags?.includes(season) && FASHION_GROUP[c.category] === '의류');

  if (seasonItems.length === 0 && otherItems.length === 0) return null;

  // 간단한 코디 조합: 계절 아이템 + 보완 아이템
  const outfits: { name: string; items: string[]; tip: string }[] = [];
  if (seasonItems.length >= 1) {
    outfits.push({
      name: '오늘의 추천',
      items: seasonItems.slice(0, 2).map((i) => i.name),
      tip: `${season} 날씨에 딱 맞는 조합이에요`,
    });
  }
  if (seasonItems.length >= 1 && otherItems.length >= 1) {
    outfits.push({
      name: '레이어드 코디',
      items: [seasonItems[0].name, otherItems[0].name],
      tip: '얇은 옷 위에 겹쳐 입기 좋아요',
    });
  }

  if (outfits.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.12 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">👗</span>
        <span className="text-xs text-gray-400 font-medium">AI 코디 추천</span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {outfits.map((outfit) => (
          <div key={outfit.name} className="shrink-0 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 px-3.5 py-2.5 min-w-[150px]">
            <p className="text-xs font-semibold text-gray-800">{outfit.name}</p>
            <div className="flex flex-col gap-0.5 mt-1.5">
              {outfit.items.map((name) => (
                <span key={name} className="text-[10px] text-brand-primary truncate">
                  • {name}
                </span>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5">{outfit.tip}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── 스와이프 의류 카드 ────────────────────────────────────────────────────────
function SwipeClothingCard({
  item, index, onRemove, onUpdate,
}: {
  item: ClothingItem; index: number; onRemove: (id: string) => void; onUpdate: (id: string, updates: Partial<ClothingItem>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const x = useMotionValue(0);
  const bgColor = useTransform(
    x, [-120, -30, 0],
    ['rgb(255,241,242)', 'rgb(255,254,253)', 'rgb(255,255,255)'],
  );
  const removeOpacity = useTransform(x, [-120, -40], [1, 0]);

  const thick = THICKNESS_STYLE[item.thickness];
  const ThickIcon = thick.icon;

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -80) onRemove(item.id);
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
        <motion.div style={{ opacity: removeOpacity }} className="flex flex-col items-center gap-0.5">
          <span className="text-xl">🗑️</span>
          <span className="text-[9px] font-semibold text-brand-warning">삭제</span>
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
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-14 text-center">
            <p className="text-2xl font-extrabold tracking-tight text-gray-900">{item.size}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">사이즈</p>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{FASHION_EMOJI[item.category] ?? '📦'}</span>
              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${thick.bg} ${thick.text}`}>
                <ThickIcon size={10} />
                {item.thickness}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium">
                {item.material}
              </span>
              {item.weatherTags?.map((tag) => (
                <span
                  key={tag}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SEASON_TAG_STYLE[tag] ?? 'bg-gray-50 text-gray-400'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
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
                  <div className="rounded-2xl overflow-hidden bg-gray-100 h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
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
                  <span className="text-gray-400">카테고리</span>
                  <p className="text-gray-700 font-medium mt-0.5">{item.category}</p>
                </div>
                <div>
                  <span className="text-gray-400">소재</span>
                  <p className="text-gray-700 font-medium mt-0.5">{item.material}</p>
                </div>
                <div>
                  <span className="text-gray-400">두께</span>
                  <p className="text-gray-700 font-medium mt-0.5">{item.thickness}</p>
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

type GroupFilter = '전체' | FashionGroup;
type ClosetSort = 'name' | 'thickness';

const THICKNESS_ORDER = { 얇음: 0, 보통: 1, 두꺼움: 2 } as const;
const GROUP_EMOJI: Record<FashionGroup, string> = { 의류: '👕', 신발: '👟', 가방: '👜', 액세서리: '✨' };

export default function ClosetPage() {
  const { items: allItems, addItems, updateItem, removeItem, undoRemove } = useCart();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GroupFilter>('전체');
  const [sortBy, setSortBy] = useState<ClosetSort>('name');

  const allClothing = allItems.filter(isClothingItem);
  const items = allClothing
    .filter((i) => filter === '전체' || FASHION_GROUP[i.category] === filter)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'name'
      ? a.name.localeCompare(b.name)
      : THICKNESS_ORDER[a.thickness] - THICKNESS_ORDER[b.thickness]
    );

  const groupCounts = (['의류', '신발', '가방', '액세서리'] as FashionGroup[]).map((g) => ({
    group: g,
    count: allClothing.filter((c) => FASHION_GROUP[c.category] === g).length,
  })).filter((g) => g.count > 0);

  function handleRemove(id: string) {
    const name = allClothing.find((i) => i.id === id)?.name ?? '';
    removeItem(id);
    showToast(`"${name}" 삭제됐어요.`, undoRemove);
  }

  const QUICK_ADD_FASHION: { name: string; category: import('@/types').FashionCategory; size: string; material: string }[] = [
    { name: '반팔 티셔츠', category: '상의',   size: 'M',    material: '면' },
    { name: '청바지',      category: '하의',   size: '32',   material: '데님' },
    { name: '운동화',      category: '신발',   size: '260',  material: '메쉬' },
    { name: '에코백',      category: '가방',   size: 'Free', material: '캔버스' },
    { name: '양말 세트',   category: '기타 액세서리', size: 'Free', material: '면' },
  ];

  function handleQuickAdd(preset: typeof QUICK_ADD_FASHION[number]) {
    const { added } = addItems([{
      id: `qa-${Date.now()}`,
      name: preset.name,
      category: preset.category,
      size: preset.size,
      thickness: '보통' as const,
      material: preset.material,
    }]);
    if (added > 0) showToast(`"${preset.name}" 추가됐어요!`);
    else showToast(`"${preset.name}" 이미 있어요.`);
  }

  const FILTERS: { key: GroupFilter; label: string }[] = [
    { key: '전체',     label: '전체' },
    { key: '의류',     label: '👕 의류' },
    { key: '신발',     label: '👟 신발' },
    { key: '가방',     label: '👜 가방' },
    { key: '액세서리', label: '✨ 액세서리' },
  ];

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 옷장</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">의류·액세서리 {allClothing.length}개 · ← 밀어서 삭제</p>
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
          <div className="flex justify-between text-center">
            <div className="flex-1">
              <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{allClothing.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">전체</p>
            </div>
            {groupCounts.map(({ group, count }) => (
              <div key={group} className="flex-1">
                <p className="text-2xl font-extrabold text-brand-primary tabular-nums">{count}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{group}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 계절 추천 */}
        {(() => {
          const month = new Date().getMonth() + 1;
          const season = month <= 2 || month === 12 ? '겨울' : month <= 5 ? '봄' : month <= 8 ? '여름' : '가을';
          const seasonItems = allClothing.filter((c) => c.weatherTags?.includes(season));
          if (seasonItems.length === 0) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.08 }}
              className={`${CARD} !py-3 !px-4`}
              style={CARD_SHADOW}
            >
              <p className="text-xs text-gray-400 font-medium mb-2">
                {season === '봄' ? '🌸' : season === '여름' ? '☀️' : season === '가을' ? '🍂' : '❄️'} 지금 입기 좋은 옷
              </p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {seasonItems.map((item) => (
                  <div key={item.id} className="shrink-0 flex items-center gap-2 bg-brand-primary/5 rounded-2xl px-3 py-1.5">
                    <span className="text-sm">{FASHION_EMOJI[item.category] ?? '📦'}</span>
                    <span className="text-xs font-medium text-brand-primary whitespace-nowrap">{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}

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
            {QUICK_ADD_FASHION.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleQuickAdd(preset)}
                className="text-[11px] px-2.5 py-1.5 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-brand-primary/5 hover:border-brand-primary/20 hover:text-brand-primary active:scale-95 transition-all"
              >
                {FASHION_EMOJI[preset.category]} {preset.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 코디 추천 */}
        <OutfitSection items={allClothing} />

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
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-brand-primary text-white'
                    : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortBy(sortBy === 'name' ? 'thickness' : 'name')}
            className="text-[10px] text-gray-400 px-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {sortBy === 'name' ? '🔤 이름순' : '🧥 두께순'}
          </button>
        </div>

        {/* 아이템 리스트 (카테고리별 그룹 or 필터 결과) */}
        {filter === '전체' && !search ? (
          <>
            {(['의류', '신발', '가방', '액세서리'] as FashionGroup[]).map((grp) => {
              const group = items.filter((i) => FASHION_GROUP[i.category] === grp);
              if (group.length === 0) return null;
              return (
                <div key={grp}>
                  <div className="flex items-center gap-2 mb-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-brand-primary/10 text-brand-primary">
                      {GROUP_EMOJI[grp]} {grp} {group.length}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <AnimatePresence mode="popLayout">
                    <div className="flex flex-col gap-3">
                      {group.map((item, index) => (
                        <SwipeClothingCard key={item.id} item={item} index={index} onRemove={handleRemove} onUpdate={updateItem} />
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
              <SwipeClothingCard key={item.id} item={item} index={index} onRemove={handleRemove} onUpdate={updateItem} />
            ))}
          </AnimatePresence>
        )}

        {items.length === 0 && allClothing.length > 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium">검색 결과가 없어요</p>
            <button onClick={() => { setSearch(''); setFilter('전체'); }} className="text-xs text-brand-primary mt-1">
              필터 초기화
            </button>
          </div>
        )}

        {allClothing.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👔</p>
            <p className="text-sm font-medium">옷장이 비어있어요</p>
            <p className="text-xs mt-1">+ 버튼을 눌러 의류를 추가해보세요.</p>
          </div>
        )}
      </div>

    </div>
  );
}
