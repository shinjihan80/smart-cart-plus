'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { SEASONAL_PRODUCE, type SeasonalProduce } from '@/lib/seasonalProduce';
import { currentSeasonByMonth, type Season } from '@/lib/season';
import { SEASON_EMOJI, countRecipesByIngredient, type Recipe } from '@/lib/recipes';
import { useShoppingList } from '@/lib/shoppingList';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { useToast } from '@/context/ToastContext';
import RecipeBrowserModal from '@/components/RecipeBrowserModal';
import RecipeDetailModal from '@/components/RecipeDetailModal';

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

export default function SeasonalPage() {
  const currentSeason = currentSeasonByMonth();
  const currentMonth  = new Date().getMonth() + 1;
  const [view, setView] = useState<ViewMode>('season');
  const [selected, setSelected] = useState<Season>(currentSeason);
  const { has, add } = useShoppingList();
  const { showToast } = useToast();
  const { isFavorite, toggle } = useRecipeFavorites();
  const [browserIngredient, setBrowserIngredient] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const items = SEASONAL_PRODUCE
    .filter((p) => p.seasons.includes(selected))
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

  return (
    <>
      <div>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
          <div className="px-4 py-3.5 flex items-center gap-2">
            <Link
              href="/settings"
              aria-label="뒤로"
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 tracking-tight">제철 달력</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {SEASONAL_PRODUCE.length}종 · 4계절 전체 보기
              </p>
            </div>
          </div>
          <div className="px-4 pb-2 flex gap-1.5">
            <button
              onClick={() => setView('season')}
              className={`flex-1 px-3 py-1.5 rounded-2xl text-[11px] font-semibold transition-colors ${
                view === 'season'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              계절별
            </button>
            <button
              onClick={() => setView('month')}
              className={`flex-1 px-3 py-1.5 rounded-2xl text-[11px] font-semibold transition-colors ${
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
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    selected === s
                      ? 'bg-brand-primary text-white'
                      : s === currentSeason
                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                        : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {SEASON_EMOJI[s]} {s}
                  {s === currentSeason && <span className="ml-1 text-[9px] opacity-70">· 지금</span>}
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
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-primary text-white font-semibold">
                            지금
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 tabular-nums">
                        {monthProduce.length}종
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {monthProduce.slice(0, 12).map((p) => (
                        <button
                          key={p.name}
                          onClick={() => setBrowserIngredient(p.name)}
                          title={`${p.name}(으)로 만드는 요리 보기`}
                          className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <span>{p.emoji}</span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                      {monthProduce.length > 12 && (
                        <span className="text-[10px] text-gray-400 self-center">외 {monthProduce.length - 12}종</span>
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
              <span className="text-4xl shrink-0">{SEASON_EMOJI[selected]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">
                  {selected === currentSeason ? '지금 계절' : `${selected}철`}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {items.length}종 제철 재료
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  피크 {peakCount}종 · 탭해서 쇼핑 리스트에 담기
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-2.5">
            {items.map((p) => {
              const recipeCount = countRecipesByIngredient(p.name);
              const added = has(p.name);
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
                    {p.peak === selected && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary">
                        피크
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                  {p.blurb && (
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {p.blurb}
                    </p>
                  )}
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => handleAdd(p.name)}
                      disabled={added}
                      className={`flex-1 text-[10px] font-semibold py-1.5 rounded-full transition-colors ${
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
                        className="text-[10px] font-semibold px-2 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
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
