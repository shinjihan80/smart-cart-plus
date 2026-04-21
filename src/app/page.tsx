'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { isFoodItem, FOOD_EMOJI, FASHION_EMOJI, type FoodItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { ChevronRight, Sparkles, Search } from 'lucide-react';
import NemoaLogo from '@/components/layout/NemoaLogo';
import RecipeBrowserModal from '@/components/RecipeBrowserModal';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { countRecipesByIngredient, type Recipe } from '@/lib/recipes';
import { isSeasonalProduce } from '@/lib/seasonalProduce';
import { currentSeasonByMonth } from '@/lib/season';
import { usePersistedState } from '@/lib/usePersistedState';

import { HomeSkeleton } from '@/components/home/shared';
import DailyMessage    from '@/components/home/DailyMessage';
import TodayActivity   from '@/components/home/TodayActivity';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import UrgentAlert     from '@/components/home/UrgentAlert';
import QuickStats      from '@/components/home/QuickStats';
import DailyBriefing   from '@/components/home/DailyBriefing';
import TodayDishCard   from '@/components/home/TodayDishCard';
import ClosetSummary   from '@/components/home/ClosetSummary';
import MonthlySpending from '@/components/home/MonthlySpending';
import FridgeCarousel  from '@/components/home/FridgeCarousel';
import MonthlyHistory  from '@/components/home/MonthlyHistory';
import WeeklyInsight   from '@/components/home/WeeklyInsight';
import RecentlyAdded   from '@/components/home/RecentlyAdded';
import TipOfTheDay     from '@/components/home/TipOfTheDay';
import SeasonalChipRow from '@/components/home/SeasonalChipRow';
import SeasonalHintWidget from '@/components/home/SeasonalHintWidget';
import SeasonalChecklistWidget from '@/components/home/SeasonalChecklistWidget';
import QuickLinks from '@/components/home/QuickLinks';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return '새벽이에요, 푹 쉬세요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '오후도 힘내세요';
  return '오늘 하루 수고했어요';
}

export default function HomePage() {
  const { items, removeItem, undoRemove, discardHistory } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggle } = useRecipeFavorites();
  const [ready, setReady] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [search, setSearch] = useState('');
  const [recipeBrowser, setRecipeBrowser] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recentSearches, setRecentSearches] = usePersistedState<string[]>(
    'nemoa-home-recent-search', [],
    (raw) => Array.isArray(raw) && raw.every((x) => typeof x === 'string') ? raw as string[] : null,
  );

  function pushRecent(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((x) => x !== trimmed)];
      return next.slice(0, 5);
    });
  }

  const searchQ = search.trim();
  const searchResults = searchQ
    ? items.filter((i) => i.name.toLowerCase().includes(searchQ.toLowerCase()))
    : [];
  const recipeHits     = searchQ ? countRecipesByIngredient(searchQ) : 0;
  const isSeasonSearch = searchQ ? isSeasonalProduce(searchQ, currentSeasonByMonth()) : false;

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  // 키보드 단축키: ⌘K/Ctrl+K 또는 / → 포커스, Esc → 비우기 + 블러
  useEffect(() => {
    function isEditable(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return el.isContentEditable;
    }
    function onKey(e: KeyboardEvent) {
      // ⌘K / Ctrl+K — 항상 동작
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      // '/' — 입력 중이 아닐 때만
      if (e.key === '/' && !isEditable(e.target)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      // Esc — 검색창에 포커스돼 있을 때만 비우기 + 블러
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        e.preventDefault();
        setSearch('');
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div>
      {/* 브랜드 헤더 */}
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 pt-3.5 pb-3 flex items-center justify-between gap-3">
          <NemoaLogo size="md" withTagline />
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full tabular-nums">
              {items.length}개 관리 중
            </span>
            <span className="text-[9px] text-gray-300 tabular-nums">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
        </div>
        <div className="px-4 pb-3 flex flex-col gap-1">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Sparkles size={11} className="text-brand-primary" />
            <span>네모아가 전하는 인사 — {getGreeting()}</span>
          </p>
          <TodayActivity />
        </div>
      </header>

      {/* 검색 바 */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="전체 상품 검색"
            aria-label="전체 상품 검색 (Ctrl+K)"
            className="w-full pl-8 pr-12 py-2 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 text-[9px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono pointer-events-none">
            ⌘K
          </kbd>
        </div>
        {!searchQ && recentSearches.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 font-medium shrink-0">최근</span>
            {recentSearches.map((q) => (
              <button
                key={q}
                onClick={() => setSearch(q)}
                className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-100 text-gray-600 hover:border-brand-primary/20 hover:text-brand-primary transition-colors"
              >
                {q}
              </button>
            ))}
            <button
              onClick={() => setRecentSearches([])}
              className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors ml-1"
              aria-label="최근 검색어 지우기"
            >
              지우기
            </button>
          </div>
        )}
        {searchQ && (
          <div className="mt-2 flex flex-col gap-1.5">
            {searchResults.slice(0, 5).map((item) => {
              const emoji = isFoodItem(item)
                ? (FOOD_EMOJI[(item as FoodItem).foodCategory] ?? '📦')
                : (FASHION_EMOJI[item.category as keyof typeof FASHION_EMOJI] ?? '👕');
              return (
                <Link
                  key={item.id}
                  href={isFoodItem(item) ? '/fridge' : '/closet'}
                  onClick={() => pushRecent(searchQ)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white border border-gray-100 hover:border-brand-primary/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">{emoji}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-800 flex-1 truncate">{item.name}</span>
                  <span className="text-[10px] text-gray-400">{isFoodItem(item) ? '냉장고' : '옷장'}</span>
                  <ChevronRight size={12} className="text-gray-300" />
                </Link>
              );
            })}
            {recipeHits > 0 && (
              <button
                onClick={() => { pushRecent(searchQ); setRecipeBrowser(searchQ); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-brand-primary/5 border border-brand-primary/15 hover:bg-brand-primary/10 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 text-sm">📖</div>
                <span className="text-sm text-brand-primary font-semibold flex-1 truncate">
                  &ldquo;{searchQ}&rdquo; 레시피 {recipeHits}개 보기
                </span>
                {isSeasonSearch && <span className="text-[10px] text-brand-primary shrink-0">🌸 제철</span>}
                <ChevronRight size={12} className="text-brand-primary/60" />
              </button>
            )}
            {searchResults.length === 0 && recipeHits === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">검색 결과가 없어요</p>
            )}
          </div>
        )}
      </div>

      {/* 네모아의 오늘 한 마디 */}
      <div className="px-4 pt-3">
        <SectionErrorBoundary label="네모아의 오늘 한 마디">
          <DailyMessage items={items} />
        </SectionErrorBoundary>
      </div>

      {/* 퀵 링크 4개 */}
      <div className="px-4 pt-3">
        <SectionErrorBoundary label="퀵 링크">
          <QuickLinks items={items} history={discardHistory} />
        </SectionErrorBoundary>
      </div>

      {/* 제철 재료 퀵 칩 */}
      <div className="px-4 pt-2">
        <SectionErrorBoundary label="제철 재료">
          <SeasonalChipRow items={items} />
        </SectionErrorBoundary>
      </div>

      {/* 벤토 그리드 */}
      {!ready ? (
        <HomeSkeleton />
      ) : (
        <div className="px-4 py-5 grid grid-cols-2 gap-4">
          <UrgentAlert     items={items} />
          <QuickStats      items={items} />
          <SectionErrorBoundary label="제철 힌트" colSpan="full">
            <SeasonalHintWidget items={items} />
          </SectionErrorBoundary>
          <SectionErrorBoundary label="제철 체크리스트" colSpan="full">
            <SeasonalChecklistWidget items={items} history={discardHistory} />
          </SectionErrorBoundary>
          <SectionErrorBoundary label="데일리 브리핑" colSpan="full">
            <DailyBriefing items={items} />
          </SectionErrorBoundary>
          <SectionErrorBoundary label="오늘 한 그릇" colSpan="full">
            <TodayDishCard items={items} />
          </SectionErrorBoundary>
          <ClosetSummary   items={items} />
          <MonthlySpending />
          <FridgeCarousel
            items={items}
            onDiscard={(id) => {
              const name = items.find((i) => i.id === id)?.name ?? '';
              removeItem(id);
              showToast(`"${name}" 소진 처리됐어요.`, undoRemove);
            }}
          />
          <MonthlyHistory selectedMonth={selectedMonth} onChangeMonth={setSelectedMonth} />
          <WeeklyInsight  items={items} />
          <RecentlyAdded  items={items} />
          <TipOfTheDay />
        </div>
      )}

      {recipeBrowser && (
        <RecipeBrowserModal
          initialSearch={recipeBrowser}
          onSelect={(recipe) => {
            setRecipeBrowser(null);
            setSelectedRecipe(recipe);
          }}
          onClose={() => setRecipeBrowser(null)}
        />
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          matchedItems={[]}
          isFavorite={isFavorite(selectedRecipe.id)}
          onToggleFavorite={() => toggle(selectedRecipe.id)}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
