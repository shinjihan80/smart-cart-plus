'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Recipe } from '@/lib/recipes';

interface RecipeDetailModalProps {
  recipe:           Recipe;
  matchedItems?:    string[];
  isFavorite:       boolean;
  onToggleFavorite: () => void;
  onClose:          () => void;
}

export default function RecipeDetailModal({
  recipe, matchedItems = [], isFavorite, onToggleFavorite, onClose,
}: RecipeDetailModalProps) {
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
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] px-6 py-7 max-h-[85vh] overflow-y-auto"
          style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={onToggleFavorite}
              aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-brand-warning/10 text-brand-warning'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
              }`}
            >
              {isFavorite ? '♥' : '♡'}
            </button>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex items-start gap-3 mb-4 pr-16">
            <span className="text-5xl shrink-0">{recipe.emoji}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{recipe.name}</h2>
              {recipe.blurb && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{recipe.blurb}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  ⏱ {recipe.time}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium">
                  {recipe.difficulty}
                </span>
                {recipe.tags?.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {matchedItems.length > 0 && (
            <div className="bg-brand-success/5 border border-brand-success/15 rounded-2xl px-3 py-2.5 mb-4">
              <p className="text-[10px] text-gray-500 mb-1">보유 중인 재료</p>
              <div className="flex gap-1 flex-wrap">
                {matchedItems.map((name) => (
                  <span key={name} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-brand-success/20 text-brand-success font-medium">
                    ✓ {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] text-gray-400 font-medium mb-2">조리 순서</p>
            <ol className="flex flex-col gap-2.5">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 rounded-2xl bg-brand-primary text-white text-sm font-semibold py-3 hover:opacity-90 active:scale-95 transition-all"
          >
            좋아요, 만들어볼게요
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
