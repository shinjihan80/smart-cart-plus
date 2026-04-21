'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  isClothingItem,
  FASHION_GROUP, FASHION_EMOJI,
  type FashionGroup,
} from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Search } from 'lucide-react';
import {
  fetchWeather, clothingMatch,
  type WeatherSnapshot,
} from '@/lib/weather';
import { useProfiles } from '@/lib/profile';
import { useWearLog, daysSince } from '@/lib/wearLog';

import { springTransition, CARD, CARD_SHADOW } from '@/components/closet/shared';
import OutfitPreview      from '@/components/closet/OutfitPreview';
import OutfitSection      from '@/components/closet/OutfitSection';
import SwipeClothingCard  from '@/components/closet/SwipeClothingCard';
import SeasonalUnstowBanner from '@/components/closet/SeasonalUnstowBanner';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

type GroupFilter = '전체' | FashionGroup;
type ClosetSort  = 'name' | 'thickness' | 'match' | 'wornMost' | 'wornLeast';

const SORT_LABEL: Record<ClosetSort, string> = {
  name:      '🔤 이름순',
  thickness: '🧥 두께순',
  match:     '✨ 오늘 어울림순',
  wornMost:  '🔥 자주 입는 순',
  wornLeast: '🌙 오래 안 입은 순',
};

const MATCH_RANK      = { perfect: 0, good: 1, mismatch: 2 } as const;
const THICKNESS_ORDER = { 얇음: 0, 보통: 1, 두꺼움: 2 } as const;
const GROUP_EMOJI: Record<FashionGroup, string> = { 의류: '👕', 신발: '👟', 가방: '👜', 액세서리: '✨' };

const QUICK_ADD_FASHION: { name: string; category: import('@/types').FashionCategory; size: string; material: string; img: string }[] = [
  { name: '반팔 티셔츠', category: '상의',       size: 'M',    material: '면',     img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop' },
  { name: '청바지',      category: '하의',       size: '32',   material: '데님',   img: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=300&h=300&fit=crop' },
  { name: '운동화',      category: '신발',       size: '260',  material: '메쉬',   img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop' },
  { name: '에코백',      category: '가방',       size: 'Free', material: '캔버스', img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=300&fit=crop' },
  { name: '양말 세트',   category: '기타 액세서리', size: 'Free', material: '면',   img: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=300&h=300&fit=crop' },
];

const FILTERS: { key: GroupFilter; label: string }[] = [
  { key: '전체',     label: '전체' },
  { key: '의류',     label: '👕 의류' },
  { key: '신발',     label: '👟 신발' },
  { key: '가방',     label: '👜 가방' },
  { key: '액세서리', label: '✨ 액세서리' },
];

export default function ClosetPage() {
  const { items: allItems, addItems, updateItem, removeItem, undoRemove } = useCart();
  const { showToast } = useToast();
  const { profiles } = useProfiles();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GroupFilter>('전체');
  const [sortBy, setSortBy] = useState<ClosetSort>('name');
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string>('전체');  // 'id' | '전체' | '공용'
  const [quickAddOwner, setQuickAddOwner] = useState<string | undefined>(undefined);
  const [showHibernating, setShowHibernating] = useState(false);
  const { log: wearLog } = useWearLog();

  useEffect(() => {
    let cancelled = false;
    fetchWeather()
      .then((w) => { if (!cancelled && w) setWeather(w); })
      .catch(() => { /* 뱃지 없이 표시 */ });
    return () => { cancelled = true; };
  }, []);

  const allClothing = allItems.filter(isClothingItem);
  const hibernatingCount = allClothing.filter((i) => i.hibernating).length;
  const activeClothing = allClothing.filter((i) => !i.hibernating);  // 추천·미리보기 등에 사용
  const items = allClothing
    .filter((i) => showHibernating || !i.hibernating)
    .filter((i) => filter === '전체' || (FASHION_GROUP[i.category] ?? '의류') === filter)
    .filter((i) => {
      if (ownerFilter === '전체') return true;
      if (ownerFilter === '공용') return !i.ownerId;
      return i.ownerId === ownerFilter;
    })
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'thickness') return THICKNESS_ORDER[a.thickness] - THICKNESS_ORDER[b.thickness];
      if (sortBy === 'match' && weather) {
        const aRank = FASHION_GROUP[a.category] === '의류' ? MATCH_RANK[clothingMatch(a.thickness, a.weatherTags, weather.tempC).level] : 3;
        const bRank = FASHION_GROUP[b.category] === '의류' ? MATCH_RANK[clothingMatch(b.thickness, b.weatherTags, weather.tempC).level] : 3;
        if (aRank !== bRank) return aRank - bRank;
      }
      if (sortBy === 'wornMost') {
        const aCount = wearLog[a.id]?.length ?? 0;
        const bCount = wearLog[b.id]?.length ?? 0;
        if (aCount !== bCount) return bCount - aCount;
      }
      if (sortBy === 'wornLeast') {
        // 미착용은 맨 위 (Infinity 기준)
        const aDates = wearLog[a.id] ?? [];
        const bDates = wearLog[b.id] ?? [];
        const aIdle = aDates.length === 0 ? Infinity : daysSince(aDates[0]);
        const bIdle = bDates.length === 0 ? Infinity : daysSince(bDates[0]);
        if (aIdle !== bIdle) return bIdle - aIdle;
      }
      return a.name.localeCompare(b.name);
    });

  const groupCounts = (['의류', '신발', '가방', '액세서리'] as FashionGroup[]).map((g) => ({
    group: g,
    count: allClothing.filter((c) => (FASHION_GROUP[c.category] ?? '의류') === g).length,
  })).filter((g) => g.count > 0);

  function handleRemove(id: string) {
    const name = allClothing.find((i) => i.id === id)?.name ?? '';
    removeItem(id);
    showToast(`"${name}" 삭제됐어요.`, undoRemove);
  }

  function handleQuickAdd(preset: typeof QUICK_ADD_FASHION[number]) {
    const { added } = addItems([{
      id: `qa-${Date.now()}`,
      name: preset.name,
      category: preset.category,
      size: preset.size,
      thickness: '보통' as const,
      material: preset.material,
      imageUrl: preset.img,
      ownerId: quickAddOwner,
    }]);
    if (added > 0) showToast(`"${preset.name}" 추가됐어요!`);
    else showToast(`"${preset.name}" 이미 있어요.`);
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 옷장</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              패션 {activeClothing.length}개 관리 중{hibernatingCount > 0 ? ` · 보관 ${hibernatingCount}` : ''} · ← 밀어서 삭제
            </p>
          </div>
          {hibernatingCount > 0 && (
            <button
              onClick={() => setShowHibernating(!showHibernating)}
              className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                showHibernating
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {showHibernating ? '보관 숨기기' : '🗃️ 보관 포함'}
            </button>
          )}
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

        {/* 계절 꺼내기 CTA — 보관 중 + 현재 계절 맞는 옷 있을 때만 */}
        <SectionErrorBoundary label="계절 꺼내기">
          <SeasonalUnstowBanner items={allItems} />
        </SectionErrorBoundary>

        {/* 계절 추천 */}
        {(() => {
          const month = new Date().getMonth() + 1;
          const season = month <= 2 || month === 12 ? '겨울' : month <= 5 ? '봄' : month <= 8 ? '여름' : '가을';
          const allSeasonItems = activeClothing.filter((c) => c.weatherTags?.includes(season));
          if (allSeasonItems.length === 0) return null;
          const seasonItems = allSeasonItems.filter((c) => {
            if (ownerFilter === '전체') return true;
            if (ownerFilter === '공용') return !c.ownerId;
            return c.ownerId === ownerFilter;
          });
          const filteredOut = allSeasonItems.length - seasonItems.length;
          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.08 }}
              className={`${CARD} !py-3 !px-4`}
              style={CARD_SHADOW}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400 font-medium">
                  {season === '봄' ? '🌸' : season === '여름' ? '☀️' : season === '가을' ? '🍂' : '❄️'} 지금 입기 좋은 옷
                </p>
                {filteredOut > 0 && (
                  <span className="text-[9px] text-gray-400 shrink-0">필터로 {filteredOut}벌 숨김</span>
                )}
              </div>
              {seasonItems.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {seasonItems.map((item) => (
                    <div key={item.id} className="shrink-0 flex items-center gap-2 bg-brand-primary/5 rounded-2xl px-3 py-1.5">
                      <span className="text-sm">{FASHION_EMOJI[item.category] ?? '📦'}</span>
                      <span className="text-xs font-medium text-brand-primary whitespace-nowrap">{item.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 py-2">
                  현재 필터에 {season}철 옷이 없어요. &ldquo;전체 보기&rdquo;로 바꿔보세요.
                </p>
              )}
            </motion.div>
          );
        })()}

        {/* 코디 미리보기 */}
        <SectionErrorBoundary label="코디 미리보기">
          <OutfitPreview items={activeClothing} />
        </SectionErrorBoundary>

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
            {QUICK_ADD_FASHION.map((preset) => (
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

        {/* 코디 추천 */}
        <SectionErrorBoundary label="오늘의 코디">
          <OutfitSection items={activeClothing} />
        </SectionErrorBoundary>

        {/* 검색 + 필터 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품 검색"
              aria-label="옷장 상품 검색"
              className="w-full pl-8 pr-3 py-2 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>
        {/* 프로필 필터 (프로필 2명 이상일 때만) */}
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
            onClick={() => {
              // 날씨 없을 땐 match 건너뛰기
              const cycle: ClosetSort[] = weather
                ? ['name', 'thickness', 'match', 'wornMost', 'wornLeast']
                : ['name', 'thickness', 'wornMost', 'wornLeast'];
              const idx = cycle.indexOf(sortBy);
              setSortBy(cycle[(idx + 1) % cycle.length]);
            }}
            className="text-[10px] text-gray-400 px-2 py-1 rounded-xl hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            {SORT_LABEL[sortBy]}
          </button>
        </div>

        {/* 아이템 리스트 */}
        {filter === '전체' && !search ? (
          <>
            {(['의류', '신발', '가방', '액세서리'] as FashionGroup[]).map((grp) => {
              const group = items.filter((i) => (FASHION_GROUP[i.category] ?? '의류') === grp);
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
                        <SwipeClothingCard
                          key={item.id}
                          item={item}
                          index={index}
                          onRemove={handleRemove}
                          onUpdate={updateItem}
                          matchBadge={weather && FASHION_GROUP[item.category] === '의류' ? clothingMatch(item.thickness, item.weatherTags, weather.tempC) : undefined}
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
              <SwipeClothingCard
                key={item.id}
                item={item}
                index={index}
                onRemove={handleRemove}
                onUpdate={updateItem}
                matchBadge={weather && FASHION_GROUP[item.category] === '의류' ? clothingMatch(item.thickness, item.weatherTags, weather.tempC) : undefined}
              />
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
