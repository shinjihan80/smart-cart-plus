'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { RECIPES, recipeGradient, type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { useModalA11y } from '@/lib/useModalA11y';

type FilterKey = '전체' | '즐겨찾기' | '간단' | '아침' | '점심' | '간식';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: '전체',     label: '전체' },
  { key: '즐겨찾기', label: '♥ 즐겨찾기' },
  { key: '간단',     label: '간단' },
  { key: '아침',     label: '아침' },
  { key: '점심',     label: '점심' },
  { key: '간식',     label: '간식' },
];

interface RecipeBrowserModalProps {
  onSelect: (recipe: Recipe) => void;
  onClose:  () => void;
}

export default function RecipeBrowserModal({ onSelect, onClose }: RecipeBrowserModalProps) {
  useModalA11y(onClose);
  const { isFavorite } = useRecipeFavorites();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('전체');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RECIPES
      .filter((r) => {
        if (filter === '즐겨찾기') return isFavorite(r.id);
        if (filter === '간단')     return r.difficulty === '간단';
        if (filter === '아침' || filter === '점심' || filter === '간식')
          return r.tags?.includes(filter) ?? false;
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        if (r.name.toLowerCase().includes(q)) return true;
        return r.keywords.some((kw) => kw.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const aFav = isFavorite(a.id) ? 0 : 1;
        const bFav = isFavorite(b.id) ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;
        return a.name.localeCompare(b.name);
      });
  }, [search, filter, isFavorite]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="레시피 전체 보기"
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] flex flex-col max-h-[85vh]"
          style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 pt-6 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">레시피 전체 보기</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">네모아가 제안하는 {RECIPES.length}가지 메뉴</p>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 검색 바 */}
          <div className="px-6 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="메뉴 이름·재료로 검색"
                aria-label="레시피 메뉴 이름 또는 재료로 검색"
                className="w-full pl-8 pr-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          {/* 필터 칩 */}
          <div className="px-6 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  filter === key
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 결과 리스트 */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {results.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">조건에 맞는 레시피가 없어요.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {results.map((recipe) => {
                  const fav = isFavorite(recipe.id);
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => onSelect(recipe)}
                      className="flex items-center gap-3 py-2 px-2 rounded-2xl hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${recipeGradient(recipe)} flex items-center justify-center shrink-0`}>
                        <span className="text-xl">{recipe.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{recipe.name}</p>
                          {fav && <span className="text-[11px] text-brand-warning shrink-0">♥</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          ⏱ {recipe.time} · {recipe.difficulty}{recipe.tags && recipe.tags.length > 0 ? ` · ${recipe.tags.join(', ')}` : ''}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
