'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Search } from 'lucide-react';
import { useSearchShortcut } from '@/lib/useSearchShortcut';
import PaletteButton from '@/components/PaletteButton';
import { SEASONAL_PRODUCE, type SeasonalProduce } from '@/lib/seasonalProduce';
import { currentSeasonByMonth, type Season } from '@/lib/season';
import { countRecipesByIngredient, type Recipe } from '@/lib/recipes';
import { SEASON_ICON, SEASON_COLOR } from '@/lib/iconMap';
import { useShoppingList } from '@/lib/shoppingList';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { useToast } from '@/context/ToastContext';
import RecipeBrowserModal from '@/components/RecipeBrowserModal';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { useCart } from '@/context/CartContext';

const SEASONS: Season[] = ['봄', '여름', '가을', '겨울'];

// 계절 → 해당 월 (대략 Korean 농수산물 기준)
const SEASON_MONTHS: Record<Season, number[]> = {
  봄:  [3, 4, 5],
  여름: [6, 7, 8],
  가을: [9, 10, 11],
  겨울: [12, 1, 2],
};

function byPeakFirst(season: Season) {
  return (a: SeasonalProduce, b: SeasonalProduce) => {
    const aPeak = a.peak === season ? 0 : 1;
    const bPeak = b.peak === season ? 0 : 1;
    if (aPeak !== bPeak) return aPeak - bPeak;
    return a.name.localeCompare(b.name);
  };
}

/** 해당 월에 제철인 식재료 (seasons 필드의 계절 → 월 매핑). */
function produceForMonth(month: number): SeasonalProduce[] {
  return SEASONAL_PRODUCE.filter((p) =>
    p.seasons.some((s) => SEASON_MONTHS[s].includes(month)),
  );
}

type ViewMode = 'season' | 'month';

function isSeason(v: unknown): v is Season {
  return v === '봄' || v === '여름' || v === '가을' || v === '겨울';
}

function SeasonalPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSeason = currentSeasonByMonth();
  const currentMonth  = new Date().getMonth() + 1;

  const initialView: ViewMode = searchParams.get('view') === 'month' ? 'month' : 'season';
  const qSeason = searchParams.get('season');
  const initialSelected: Season = isSeason(qSeason) ? qSeason : currentSeason;

  const [view, setView] = useState<ViewMode>(initialView);
  const [selected, setSelected] = useState<Season>(initialSelected);
  const [query, setQuery] = useState('');
  const { has, add } = useShoppingList();
  const { items: cartItems, discardHistory } = useCart();
  const { showToast } = useToast();

  // 이번 계절에 드셔본(보유+소진) 재료 이름 세트
  const triedNames = (() => {
    const set = new Set<string>();
    const monthList = SEASON_MONTHS[selected];
    // 현재 보유 중 아이템
    for (const it of cartItems) {
      if (it.category !== '식품') continue;
      for (const p of SEASONAL_PRODUCE) {
        if (p.seasons.includes(selected) && (it.name === p.name || it.name.includes(p.name))) {
          set.add(p.name);
        }
      }
    }
    // 올해 해당 계절 월에 소진한 기록
    for (const h of discardHistory) {
      if (h.category !== '식품' || !h.date) continue;
      const m = new Date(h.date).getMonth() + 1;
      if (!monthList.includes(m)) continue;
      for (const p of SEASONAL_PRODUCE) {
        if (p.seasons.includes(selected) && (h.name === p.name || h.name.includes(p.name))) {
          set.add(p.name);
        }
      }
    }
    return set;
  })();
  const { isFavorite, toggle } = useRecipeFavorites();
  const [browserIngredient, setBrowserIngredient] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchRef, () => setQuery(''));

  // URL 쿼리 동기화
  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== 'season') params.set('view', view);
    if (selected !== currentSeason) params.set('season', selected);
    const qs = params.toString();
    router.replace(qs ? `/seasonal?${qs}` : '/seasonal', { scroll: false });
  }, [view, selected, currentSeason, router]);

  const q = query.trim().toLowerCase();
  const items = SEASONAL_PRODUCE
    .filter((p) => p.seasons.includes(selected))
    .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.blurb?.toLowerCase().includes(q) ?? false))
    .sort(byPeakFirst(selected));

  const peakCount = items.filter((p) => p.peak === selected).length;

  function handleAdd(name: string) {
    if (has(name)) {
      showToast(`"${name}" 이미 쇼핑 리스트에 있어요.`);
      return;
    }
    add(name, `${selected}철 달력`);
    showToast(`"${name}" 쇼핑 리스트에 담았어요.`);
  }

  function handleAddAllPeak() {
    const peaks = items.filter((p) => p.peak === selected && !has(p.name));
    if (peaks.length === 0) {
      showToast('피크 재료 모두 이미 담겨있거나 없어요.');
      return;
    }
    if (!confirm(`${selected}철 피크 재료 ${peaks.length}종을 쇼핑 리스트에 담을까요?`)) return;
    for (const p of peaks) add(p.name, `${selected}철 달력`);
    showToast(`${peaks.length}종 담았어요.`);
  }

  return (
    <>
      <div>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
          <div className="px-4 py-3.5 flex items-center gap-2">
            <Link
              href="/"
              aria-label="홈으로"
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 tracking-tight">제철 달력</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {SEASONAL_PRODUCE.length}종 · 4계절 전체 보기
              </p>
            </div>
            <PaletteButton />
          </div>
          {view === 'season' && (
            <div className="px-4 pb-2 relative">
              <Search size={12} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="재료 이름·설명 검색"
                aria-label="제철 재료 검색 (⌘K)"
                className="w-full pl-8 pr-10 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
              <kbd className="hidden sm:inline-flex absolute right-6 top-1/2 -translate-y-1/2 items-center text-[8px] text-gray-400 bg-white border border-gray-200 rounded px-1 py-0 font-mono pointer-events-none">⌘K</kbd>
            </div>
          )}
          <div className="px-4 pb-2 flex gap-1.5">
            <button
              onClick={() => setView('season')}
              className={`flex-1 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-colors ${
                view === 'season'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              계절별
            </button>
            <button
              onClick={() => setView('month')}
              className={`flex-1 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-colors ${
                view === 'month'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              월별
            </button>
          </div>
          {view === 'season' && (
            <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelected(s)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selected === s
                      ? 'bg-brand-primary text-white'
                      : s === currentSeason
                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                        : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {(() => {
                    const Icon = SEASON_ICON[s];
                    return (
                      <span className="inline-flex items-center gap-1">
                        <Icon size={11} strokeWidth={2.4} />
                        <span>{s}</span>
                      </span>
                    );
                  })()}
                  {s === currentSeason && <span className="ml-1 text-xs opacity-70">· 지금</span>}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="px-4 py-5 flex flex-col gap-4">
          {view === 'month' ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const monthProduce = produceForMonth(m);
                const isNow = m === currentMonth;
                return (
                  <motion.div
                    key={m}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: m * 0.02 }}
                    className={`rounded-2xl border p-3 ${
                      isNow
                        ? 'bg-brand-primary/5 border-brand-primary/20'
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold tabular-nums ${
                          isNow ? 'text-brand-primary' : 'text-gray-700'
                        }`}>
                          {m}월
                        </span>
                        {isNow && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-primary text-white font-semibold">
                            지금
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-400 tabular-nums">
                        {monthProduce.length}종
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {monthProduce.slice(0, 12).map((p) => (
                        <button
                          key={p.name}
                          onClick={() => setBrowserIngredient(p.name)}
                          title={`${p.name}(으)로 만드는 요리 보기`}
                          className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <span>{p.emoji}</span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                      {monthProduce.length > 12 && (
                        <span className="text-sm text-gray-400 self-center">외 {monthProduce.length - 12}종</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
          <>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="rounded-[28px] bg-gradient-to-br from-brand-primary/5 to-brand-success/5 border border-brand-primary/10 p-4"
          >
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = SEASON_ICON[selected];
                const color = SEASON_COLOR[selected];
                return (
                  <span className={`w-14 h-14 rounded-2xl ${color.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={28} strokeWidth={2} className={color.text} />
                  </span>
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">
                  {selected === currentSeason ? '지금 계절' : `${selected}철`}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {items.length}종 제철 재료
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  피크 {peakCount}종
                  {triedNames.size > 0 && (
                    <span className="text-brand-success font-semibold ml-1">· ✓ {triedNames.size}종 드셔봤어요</span>
                  )}
                </p>
              </div>
              {peakCount > 0 && (
                <button
                  onClick={handleAddAllPeak}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90 active:scale-95 transition-all"
                >
                  피크 {peakCount} 담기
                </button>
              )}
            </div>
            {/* 올해 이 계절 진행도 — 드셔본 비율 */}
            {(() => {
              const total = SEASONAL_PRODUCE.filter((p) => p.seasons.includes(selected)).length;
              if (total === 0 || triedNames.size === 0) return null;
              const pct = Math.round((triedNames.size / total) * 100);
              return (
                <div className="mt-3 pt-3 border-t border-brand-primary/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500">올해 {selected} 진행도</span>
                    <span className="text-sm font-bold text-brand-success tabular-nums">
                      {triedNames.size} / {total} · {pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-brand-success"
                    />
                  </div>
                </div>
              );
            })()}
          </motion.div>

          <div className="grid grid-cols-2 gap-2.5">
            {items.map((p) => {
              const recipeCount = countRecipesByIngredient(p.name);
              const added = has(p.name);
              const tried = triedNames.has(p.name);
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className={`rounded-2xl border p-3 ${
                    p.peak === selected
                      ? 'bg-brand-primary/5 border-brand-primary/15'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex gap-1 items-center">
                      {tried && (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-brand-success/15 text-brand-success"
                          title="이번 계절에 드셔봤어요"
                        >
                          ✓
                        </span>
                      )}
                      {p.peak === selected && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary">
                          피크
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                  {p.blurb && (
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {p.blurb}
                    </p>
                  )}
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => handleAdd(p.name)}
                      disabled={added}
                      className={`flex-1 text-sm font-semibold py-1.5 rounded-full transition-colors ${
                        added
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'
                      }`}
                    >
                      {added ? '담김' : '+ 담기'}
                    </button>
                    {recipeCount > 0 && (
                      <button
                        onClick={() => setBrowserIngredient(p.name)}
                        title={`${p.name} 레시피 보기`}
                        className="text-sm font-semibold px-2 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        📖 {recipeCount}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          </>
          )}
        </div>
      </div>

      {browserIngredient && (
        <RecipeBrowserModal
          initialSearch={browserIngredient}
          onSelect={(recipe) => {
            setBrowserIngredient(null);
            setSelectedRecipe(recipe);
          }}
          onClose={() => setBrowserIngredient(null)}
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
    </>
  );
}

export default function SeasonalPage() {
  return (
    <Suspense fallback={null}>
      <SeasonalPageInner />
    </Suspense>
  );
}
