'use client';

import { useEffect, useRef, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  isClothingItem,
  FASHION_GROUP,
  type FashionGroup,
} from '@/types';
import { FASHION_ICON } from '@/lib/iconMap';
import { getFashionCategoryTone } from '@/lib/categoryImages';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
// (Search import 제거됨 — 미사용)
import {
  fetchWeather, clothingMatch,
  type WeatherSnapshot,
} from '@/lib/weather';
import { useProfiles } from '@/lib/profile';
import { useWearLog, daysSince } from '@/lib/wearLog';
import { usePersistedState } from '@/lib/usePersistedState';
import { useSearchShortcut } from '@/lib/useSearchShortcut';
import PaletteButton from '@/components/PaletteButton';
import EmojiIcon from '@/components/EmojiIcon';
import ShoppingMallCard from '@/components/ShoppingMallCard';
import WeekdayPatternChart from '@/components/mypage/WeekdayPatternChart';

import { springTransition, CARD, CARD_SHADOW } from '@/components/closet/shared';
import OutfitPreview      from '@/components/closet/OutfitPreview';
import OutfitGrid         from '@/components/closet/OutfitGrid';
import SwipeClothingCard  from '@/components/closet/SwipeClothingCard';
import SeasonalUnstowBanner from '@/components/closet/SeasonalUnstowBanner';
import SavedOutfitsSection from '@/components/closet/SavedOutfitsSection';
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

const QUICK_ADD_FASHION: { name: string; category: import('@/types').FashionCategory; size: string; material: string }[] = [
  { name: '반팔 티셔츠', category: '상의',          size: 'M',    material: '면'     },
  { name: '청바지',      category: '하의',          size: '32',   material: '데님'   },
  { name: '운동화',      category: '신발',          size: '260',  material: '메쉬'   },
  { name: '에코백',      category: '가방',          size: 'Free', material: '캔버스' },
  { name: '양말 세트',   category: '기타 액세서리', size: 'Free', material: '면'     },
];

const FILTERS: { key: GroupFilter; label: string }[] = [
  { key: '전체',     label: '전체' },
  { key: '의류',     label: '👕 의류' },
  { key: '신발',     label: '👟 신발' },
  { key: '가방',     label: '👜 가방' },
  { key: '액세서리', label: '✨ 액세서리' },
];

type ClosetTab = 'closet' | 'outfit' | 'shopping';

const CLOSET_TABS: { id: ClosetTab; emoji: string; label: string }[] = [
  { id: 'closet',   emoji: '👔', label: '옷장' },
  { id: 'outfit',   emoji: '👗', label: '코디' },
  { id: 'shopping', emoji: '🛍️', label: '쇼핑' },
];

const isClosetTab = (v: unknown): v is ClosetTab =>
  v === 'closet' || v === 'outfit' || v === 'shopping';

export default function ClosetPage() {
  const { items: allItems, addItems, updateItem, removeItem, undoRemove, loadSampleData } = useCart();
  const { showToast } = useToast();
  const { profiles } = useProfiles();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = usePersistedState<GroupFilter>(
    'nemoa-closet-group', '전체',
    (raw) => (raw === '전체' || raw === '의류' || raw === '신발' || raw === '가방' || raw === '액세서리') ? raw : null,
  );
  const [sortBy, setSortBy] = usePersistedState<ClosetSort>(
    'nemoa-closet-sort', 'name',
    (raw) => (raw === 'name' || raw === 'thickness' || raw === 'match'
      || raw === 'wornMost' || raw === 'wornLeast') ? raw : null,
  );
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [ownerFilter, setOwnerFilter] = usePersistedState<string>(
    'nemoa-closet-owner', '전체',
    (raw) => typeof raw === 'string' ? raw : null,
  );  // 'id' | '전체' | '공용'
  const [quickAddOwner, setQuickAddOwner] = useState<string | undefined>(undefined);
  const [showHibernating, setShowHibernating] = useState(false);
  const [expandedClothingId, setExpandedClothingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = usePersistedState<'list' | 'compact'>(
    'nemoa-closet-view', 'list',
    (raw) => (raw === 'list' || raw === 'compact') ? raw : null,
  );
  const [activeTab, setActiveTab] = usePersistedState<ClosetTab>(
    'nemoa-closet-tab', 'closet',
    (raw) => (isClosetTab(raw) ? raw : null),
  );
  useEffect(() => { setActiveTab('closet'); }, []);
  const { log: wearLog } = useWearLog();
  const searchInputRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchInputRef, () => setSearch(''));

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

  function scrollToGroup(grp: FashionGroup) {
    const isAlreadyGrouped = filter === '전체' && !search;
    setFilter('전체');
    setSearch('');
    const doScroll = () => {
      const el = document.getElementById(`closet-group-${grp}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (isAlreadyGrouped) doScroll();
    else setTimeout(doScroll, 100);
  }

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
      ownerId: quickAddOwner,
    }]);
    if (added > 0) showToast(`"${preset.name}" 추가됐어요!`);
    else showToast(`"${preset.name}" 이미 있어요.`);
  }

  return (
    <div>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">스마트 옷장</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              패션 {activeClothing.length}개{hibernatingCount > 0 ? ` · 보관 ${hibernatingCount}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hibernatingCount > 0 && activeTab === 'closet' && (
              <button
                onClick={() => setShowHibernating(!showHibernating)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  showHibernating
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {showHibernating ? '보관 숨기기' : '🗃️ 보관 포함'}
              </button>
            )}
            <PaletteButton />
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide border-b border-gray-100">
          <div role="tablist" aria-label="옷장 탭" className="flex px-4">
            {CLOSET_TABS.map((t) => {
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

        {/* ─── 옷장 탭 — 본인 옷장 콘텐츠 ─── */}
        {activeTab === 'closet' && (<>
        {/* 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className={CARD}
          style={CARD_SHADOW}
        >
          <div className="flex justify-between text-center">
            <button
              className="flex-1 py-1 rounded-2xl hover:bg-gray-50 transition-colors active:scale-95"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{allClothing.length}</p>
              <p className="text-sm text-gray-400 mt-0.5">전체</p>
            </button>
            {groupCounts.map(({ group, count }) => (
              <button
                key={group}
                className="flex-1 py-1 rounded-2xl hover:bg-gray-50 transition-colors active:scale-95"
                onClick={() => scrollToGroup(group as FashionGroup)}
              >
                <p className="text-2xl font-extrabold text-brand-primary tabular-nums">{count}</p>
                <p className="text-sm text-gray-400 mt-0.5">{group}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* 이번 주 착용 요약 — 최근 7일 기록이 있으면 표시 */}
        {(() => {
          const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const weekCount = Object.values(wearLog)
            .flat()
            .filter((d) => {
              const t = new Date(d).getTime();
              return !isNaN(t) && t >= weekAgoMs;
            }).length;
          if (weekCount === 0) return null;
          const uniqueItems = new Set<string>();
          for (const [id, dates] of Object.entries(wearLog)) {
            if ((dates as string[]).some((d) => new Date(d).getTime() >= weekAgoMs)) {
              uniqueItems.add(id);
            }
          }
          return (
            <>
              <div className="flex items-center gap-2">
                <EmojiIcon emoji="📊" size={16} className="text-gray-600" />
                <span className="text-base font-bold text-gray-900 tracking-tight">이번 주 착용 요약</span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.07 }}
                className={CARD}
                style={CARD_SHADOW}
              >
                <p className="text-xs text-gray-600 leading-relaxed">
                  최근 7일 동안 <span className="font-bold text-brand-primary tabular-nums">{weekCount}회</span> 착용 · 옷 <span className="font-bold text-brand-primary tabular-nums">{uniqueItems.size}벌</span> 썼어요
                </p>
                <div className="mt-2">
                  <WeekdayPatternChart datesByKey={wearLog} label="요일별 착용" />
                </div>
              </motion.div>
            </>
          );
        })()}

        {/* 계절 꺼내기 CTA — 보관 중 + 현재 계절 맞는 옷 있을 때만 */}
        <SectionErrorBoundary label="계절 꺼내기">
          <SeasonalUnstowBanner items={allItems} />
        </SectionErrorBoundary>
        </>)}

        {/* ─── 코디 탭 — 추천성/감상용 ─── */}
        {activeTab === 'outfit' && (<>
        {/* 옷이 너무 적으면 코디 추천이 거의 안 나오니 안내 */}
        {activeClothing.length < 3 && (
          <>
            <div className="flex items-center gap-2">
              <EmojiIcon emoji="👗" size={16} className="text-brand-primary" />
              <span className="text-base font-bold text-gray-900 tracking-tight">코디 추천 시작 전</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className={CARD}
              style={CARD_SHADOW}
            >
              <p className="text-sm text-gray-700 leading-relaxed">
                현재 옷이 {activeClothing.length}벌이에요. 옷을 더 추가하면 날씨·계절에 맞는 코디 추천이 풍부해져요.
              </p>
              <button
                onClick={() => setActiveTab('shopping')}
                className="mt-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-primary text-white hover:opacity-90 transition-colors"
              >
                🛍️ 쇼핑 탭으로 가기
              </button>
            </motion.div>
          </>
        )}

        {/* 자동 생성 코디 그리드 — 메인 (이미지 위주) — 코디 탭 최상단 */}
        <SectionErrorBoundary label="오늘 입을 코디">
          <OutfitGrid
            items={activeClothing}
            count={6}
            season={(() => {
              const month = new Date().getMonth() + 1;
              return month <= 2 || month === 12 ? '겨울' : month <= 5 ? '봄' : month <= 8 ? '여름' : '가을';
            })()}
            thickness={weather ? (weather.tempC >= 23 ? ['얇음'] : weather.tempC >= 15 ? ['얇음', '보통'] : weather.tempC >= 5 ? ['보통', '두꺼움'] : ['두꺼움']) : undefined}
          />
        </SectionErrorBoundary>

        {/* 아직 안 입어본 옷 — 구매 후 한 번도 안 입은 의류 */}
        {(() => {
          const untried = activeClothing
            .filter((c) => FASHION_GROUP[c.category] === '의류')
            .filter((c) => (wearLog[c.id]?.length ?? 0) === 0)
            .slice(0, 5);
          if (untried.length === 0) return null;
          return (
            <>
              <div className="flex items-center gap-2">
                <EmojiIcon emoji="🆕" size={16} className="text-gray-600" />
                <span className="text-base font-bold text-gray-900 tracking-tight">아직 안 입어본 옷 {untried.length}벌</span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.075 }}
                className={CARD}
                style={CARD_SHADOW}
              >
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {untried.map((c) => {
                    const Icon = FASHION_ICON[c.category] ?? FASHION_ICON['기타 액세서리'];
                    return (
                      <div key={c.id} className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-100">
                        <Icon size={13} strokeWidth={2} className="text-amber-700" />
                        <span className="text-xs font-medium text-amber-700 whitespace-nowrap">{c.name}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                  오늘 한 번 꺼내볼까요? 카드에서 &ldquo;👕 오늘 입었어요&rdquo;로 기록할 수 있어요.
                </p>
              </motion.div>
            </>
          );
        })()}

        {/* 자주 입는 옷 TOP 3 */}
        {(() => {
          const worn = allClothing
            .map((c) => ({ item: c, count: wearLog[c.id]?.length ?? 0 }))
            .filter((x) => x.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
          if (worn.length === 0) return null;
          return (
            <>
              <div className="flex items-center gap-2">
                <EmojiIcon emoji="🔥" size={16} className="text-gray-600" />
                <span className="text-base font-bold text-gray-900 tracking-tight">자주 입는 옷 TOP 3</span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.08 }}
                className={CARD}
                style={CARD_SHADOW}
              >
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {worn.map((w) => {
                    const Icon = FASHION_ICON[w.item.category] ?? FASHION_ICON['기타 액세서리'];
                    return (
                      <div key={w.item.id} className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-100 border border-gray-200">
                        <Icon size={13} strokeWidth={2} className="text-gray-700" />
                        <span className="text-xs font-medium text-gray-800 whitespace-nowrap">{w.item.name}</span>
                        <span className="text-sm text-gray-500 tabular-nums">{w.count}회</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          );
        })()}

        {/* 저장된 코디 — 사용자가 직접 저장한 것 */}
        <SectionErrorBoundary label="저장된 코디">
          <SavedOutfitsSection items={allItems} />
        </SectionErrorBoundary>

        {/* 코디 빌더 — 직접 만들고 저장 */}
        <SectionErrorBoundary label="코디 만들기">
          <OutfitPreview items={activeClothing} />
        </SectionErrorBoundary>
        </>)}

        {/* ─── 쇼핑 탭 — 새 옷 추가 + 정리 액션 ─── */}
        {activeTab === 'shopping' && (<>
        <ShoppingMallCard
          domain="fashion"
          title="패션 쇼핑몰"
          subtitle="옷 사러 가기 — 탭하면 새 창으로 이동"
          emoji="👕"
        />

        <ShoppingMallCard
          domain="secondhand"
          title="중고 판매"
          subtitle="안 입는 옷 빠르게 팔기 — 당근·번개장터·KREAM"
          emoji="💰"
        />

        <ShoppingMallCard
          domain="donation"
          title="기부하기"
          subtitle="오래 안 입은 옷 따뜻하게 — 아름다운가게·굿윌·옷캔"
          emoji="❤️"
        />

        <ShoppingMallCard
          domain="storage"
          title="짐 보관 서비스"
          subtitle="계절 옷 잠깐 빼두기 — 세탁특공대·다락"
          emoji="📦"
        />

        {/* 빠른 추가 */}
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="⚡" size={16} className="text-gray-600" />
          <span className="text-base font-bold text-gray-900 tracking-tight">빠른 추가</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
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
            {QUICK_ADD_FASHION.map((preset) => {
              const tone = getFashionCategoryTone(preset.category);
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

        </>)}

        {/* ─── 옷장 탭 (이어서) — 프로필 필터, 정렬, 카드 리스트 ─── */}
        {activeTab === 'closet' && (<>
        {/* 프로필 필터 (프로필 2명 이상일 때만) */}
        {profiles.length >= 2 && (
          <div role="tablist" aria-label="구성원 필터" className="flex bg-gray-100 rounded-full p-0.5 overflow-x-auto scrollbar-hide w-fit">
            {([
              { key: '전체', label: '전체' },
              ...profiles.map((p) => ({ key: p.id, label: p.name })),
              { key: '공용', label: '공용' },
            ] as { key: string; label: string }[]).map(({ key, label }) => {
              const isActive = ownerFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setOwnerFilter(key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* 정렬 버튼만 — 카테고리 FILTERS는 카드 칩에 이미 표시되어 제거 */}
        {/* 정렬 세그먼트 + 보기 방식 */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-full p-0.5 overflow-x-auto scrollbar-hide flex-1">
            {(weather
              ? ['name', 'thickness', 'match', 'wornMost', 'wornLeast']
              : ['name', 'thickness', 'wornMost', 'wornLeast']
            ).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key as ClosetSort)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  sortBy === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {SORT_LABEL[key as ClosetSort]}
              </button>
            ))}
          </div>
          <div role="tablist" aria-label="보기 방식" className="flex bg-gray-100 rounded-full p-0.5 shrink-0">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              title="리스트 보기"
              className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <List size={13} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'compact'}
              onClick={() => setViewMode('compact')}
              title="간략 보기"
              className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                viewMode === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <LayoutGrid size={13} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* ─── 리스트 뷰 ─── */}
        {viewMode === 'list' && (filter === '전체' && !search ? (
          <>
            {(['의류', '신발', '가방', '액세서리'] as FashionGroup[]).map((grp) => {
              const group = items.filter((i) => (FASHION_GROUP[i.category] ?? '의류') === grp);
              if (group.length === 0) return null;
              return (
                <div key={grp} id={`closet-group-${grp}`} className="scroll-mt-28">
                  <div className="flex items-center gap-2 mb-2 mt-1">
                    <span className="text-base font-bold text-gray-900 tracking-tight">{GROUP_EMOJI[grp]} {grp}</span>
                    <span className="text-xs text-gray-400 font-medium tabular-nums">{group.length}개</span>
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
                          expanded={expandedClothingId === item.id}
                          onToggle={() => setExpandedClothingId(expandedClothingId === item.id ? null : item.id)}
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
                expanded={expandedClothingId === item.id}
                onToggle={() => setExpandedClothingId(expandedClothingId === item.id ? null : item.id)}
              />
            ))}
          </AnimatePresence>
        ))}

        {/* ─── 간략 뷰 ─── */}
        {viewMode === 'compact' && (filter === '전체' && !search ? (
          <>
            {(['의류', '신발', '가방', '액세서리'] as FashionGroup[]).map((grp) => {
              const group = items.filter((i) => (FASHION_GROUP[i.category] ?? '의류') === grp);
              if (group.length === 0) return null;
              return (
                <div key={grp} id={`closet-group-${grp}`} className="scroll-mt-28">
                  <div className="flex items-center gap-2 mb-2 mt-1">
                    <span className="text-base font-bold text-gray-900 tracking-tight">{GROUP_EMOJI[grp]} {grp}</span>
                    <span className="text-xs text-gray-400 font-medium tabular-nums">{group.length}개</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {group.map((item) => {
                      const tone = getFashionCategoryTone(item.category);
                      return (
                        <div key={item.id} className="rounded-2xl overflow-hidden bg-white border border-gray-100">
                          <div className={`aspect-square relative flex items-center justify-center ${tone.bg}`}>
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl" aria-hidden>{tone.emoji}</span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-gray-800 px-2 pt-1.5 pb-2 truncate">{item.name}</p>
                        </div>
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
              const tone = getFashionCategoryTone(item.category);
              return (
                <div key={item.id} className="rounded-2xl overflow-hidden bg-white border border-gray-100">
                  <div className={`aspect-square relative flex items-center justify-center ${tone.bg}`}>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl" aria-hidden>{tone.emoji}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 px-2 pt-1.5 pb-2 truncate">{item.name}</p>
                </div>
              );
            })}
          </div>
        ))}

        {items.length === 0 && allClothing.length > 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="flex justify-center mb-2"><EmojiIcon emoji="🔍" size={28} className="text-gray-400" /></div>
            <p className="text-sm font-medium">검색 결과가 없어요</p>
            <button onClick={() => { setSearch(''); setFilter('전체'); }} className="text-xs text-brand-primary mt-1">
              필터 초기화
            </button>
          </div>
        )}

        {allClothing.length === 0 && (
          <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-2">
            <EmojiIcon emoji="👔" size={32} className="text-gray-400" />
            <p className="text-sm font-medium">옷장이 비어있어요</p>
            <p className="text-xs">+ 버튼을 눌러 의류를 추가하거나 샘플로 체험해보세요</p>
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
        </>)}
      </div>
    </div>
  );
}
