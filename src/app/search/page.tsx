'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, ChevronLeft, BookOpen, Flower2, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { isFoodItem, type FoodItem, type ClothingItem } from '@/types';
import { countRecipesByIngredient } from '@/lib/recipes';
import { isSeasonalProduce, SEASONAL_PRODUCE } from '@/lib/seasonalProduce';
import { currentSeasonByMonth } from '@/lib/season';
import { usePersistedState } from '@/lib/usePersistedState';
import { useSavedOutfits } from '@/lib/savedOutfits';
import { FOOD_ICON, FASHION_ICON, SEASON_ICON, SEASON_COLOR } from '@/lib/iconMap';

/**
 * 통합 검색 페이지 (/search)
 * - 헤더: 뒤로가기 + 검색 input (자동 포커스)
 * - 본문: 보유 아이템 / 레시피 / 제철 재료 / 저장 코디 결과
 * - 빈 상태: 최근 검색어
 */
export default function SearchPage() {
  const router = useRouter();
  const { items, addItems } = useCart();
  const { outfits } = useSavedOutfits();
  const [q, setQ] = useState('');
  const [recent, setRecent] = usePersistedState<string[]>(
    'nemoa-search-recent', [],
    (raw) => Array.isArray(raw) && raw.every((x) => typeof x === 'string') ? raw as string[] : null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function pushRecent(term: string) {
    const t = term.trim();
    if (t.length < 2) return;
    setRecent((prev) => [t, ...prev.filter((x) => x !== t)].slice(0, 8));
  }

  const trimmed = q.trim().toLowerCase();
  const season = currentSeasonByMonth();

  const itemHits = trimmed
    ? items.filter((i) => i.name.toLowerCase().includes(trimmed)).slice(0, 10)
    : [];
  const recipeHits = trimmed ? countRecipesByIngredient(trimmed) : 0;
  const isSeasonSearch = trimmed ? isSeasonalProduce(trimmed, season) : false;
  const seasonalHits = trimmed
    ? SEASONAL_PRODUCE.filter((p) =>
        p.seasons.includes(season) &&
        (p.name.toLowerCase().includes(trimmed) || trimmed.includes(p.name.toLowerCase())),
      ).slice(0, 5)
    : [];
  const outfitHits = trimmed
    ? outfits.filter((o) => o.name.toLowerCase().includes(trimmed)).slice(0, 5)
    : [];

  const hasResults = itemHits.length > 0 || recipeHits > 0 || seasonalHits.length > 0 || outfitHits.length > 0;

  function handleAddSeasonal(p: typeof SEASONAL_PRODUCE[number]) {
    addItems([{
      id: `s-${Date.now()}`,
      name: p.name,
      category: '식품',
      foodCategory: p.foodCategory,
      storageType: p.storageType,
      baseShelfLifeDays: p.baseShelfLifeDays,
      purchaseDate: new Date().toISOString().split('T')[0],
    }]);
    pushRecent(p.name);
    router.push('/fridge');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 — 뒤로 + 검색 input */}
      <header className="sticky top-0 z-10 bg-white px-3 py-3 flex items-center gap-1">
        <button
          onClick={() => router.back()}
          aria-label="뒤로"
          className="w-10 h-10 flex items-center justify-center text-brand-ink"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && trimmed) pushRecent(trimmed); }}
            placeholder="레시피·식품·옷·제철 재료 검색"
            aria-label="통합 검색"
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-gray-100 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          {q && (
            <button
              onClick={() => { setQ(''); inputRef.current?.focus(); }}
              aria-label="지우기"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      <div className="px-5 pt-2 pb-12 flex flex-col gap-7">
        {/* 빈 상태 — 최근 검색어 */}
        {!trimmed && (
          recent.length > 0 ? (
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-base font-bold text-brand-ink">최근 검색어</h2>
                <button onClick={() => setRecent([])} className="text-xs text-gray-400 hover:text-gray-600">
                  전체 삭제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQ(term)}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-brand-ink hover:bg-gray-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-sm text-gray-400 text-center mt-12">검색어를 입력하세요</p>
          )
        )}

        {/* 결과 — 보유 아이템 */}
        {trimmed && itemHits.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-brand-ink mb-3 px-1">
              보유 <span className="text-brand-primary">{itemHits.length}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {itemHits.map((it) => {
                const isFood = isFoodItem(it);
                const Icon = isFood
                  ? (FOOD_ICON[(it as FoodItem).foodCategory] ?? FOOD_ICON['기타 식품'])
                  : (FASHION_ICON[(it as ClothingItem).category] ?? FASHION_ICON['기타 액세서리']);
                return (
                  <Link
                    key={it.id}
                    href={isFood ? '/fridge' : '/closet'}
                    onClick={() => pushRecent(trimmed)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-ink truncate">{it.name}</p>
                      <p className="text-xs text-gray-400">{isFood ? '냉장고' : '옷장'}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 결과 — 레시피 */}
        {trimmed && recipeHits > 0 && (
          <Link
            href="/fridge"
            onClick={() => pushRecent(trimmed)}
            className="flex items-center gap-3 p-4 rounded-2xl bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-ink">
                &ldquo;{q}&rdquo; 레시피 {recipeHits}개
              </p>
              {isSeasonSearch && (
                <p className="text-xs text-brand-primary mt-0.5">{season}철 제철 재료예요</p>
              )}
            </div>
            <ChevronRight size={14} className="text-brand-primary/50" />
          </Link>
        )}

        {/* 결과 — 제철 재료 */}
        {trimmed && seasonalHits.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-brand-ink mb-3 px-1 flex items-center gap-1">
              <Flower2 size={14} className={SEASON_COLOR[season].text} />
              <span>제철 재료</span>
              <span className="text-brand-primary">{seasonalHits.length}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {seasonalHits.map((p) => {
                const Icon = SEASON_ICON[season];
                const color = SEASON_COLOR[season];
                return (
                  <button
                    key={p.name}
                    onClick={() => handleAddSeasonal(p)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={18} className={color.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-ink truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {season}철 {p.peak === season && '· 피크'} · 탭하여 냉장고에 담기
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 결과 — 저장된 코디 */}
        {trimmed && outfitHits.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-brand-ink mb-3 px-1">
              저장된 코디 <span className="text-brand-primary">{outfitHits.length}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {outfitHits.map((o) => (
                <Link
                  key={o.id}
                  href="/closet"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 text-base">💾</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-ink truncate">{o.name}</p>
                    <p className="text-xs text-gray-400">{Object.keys(o.slots).length}벌</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 결과 없음 */}
        {trimmed && !hasResults && (
          <div className="text-center mt-12">
            <p className="text-sm text-gray-400">&ldquo;{q}&rdquo;에 대한 결과가 없어요</p>
            <p className="text-xs text-gray-300 mt-1">다른 검색어를 시도해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
