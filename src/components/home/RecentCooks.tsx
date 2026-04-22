'use client';

import { motion } from 'framer-motion';
import { RECIPES } from '@/lib/recipes';
import { useCookLog } from '@/lib/recipeCookLog';
import { CARD, CARD_SHADOW, springTransition } from './shared';

/**
 * 최근 조리 기록 5건 — 시간순 카루셀.
 * 탭하면 GlobalRecipeModal 오픈.
 */
export default function RecentCooks() {
  const { log } = useCookLog();

  // (recipeId, date) 튜플 모아 시간순
  const entries: Array<{ id: string; date: string }> = [];
  for (const [id, dates] of Object.entries(log)) {
    for (const d of (Array.isArray(dates) ? dates : [])) {
      entries.push({ id, date: d });
    }
  }
  entries.sort((a, b) => b.date.localeCompare(a.date));
  const recent = entries.slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.18 }}
      className={`col-span-2 ${CARD}`}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🍳</span>
        <span className="text-xs text-gray-400 font-medium">최근 조리</span>
        <span className="text-sm text-gray-300 tabular-nums">{recent.length}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {recent.map(({ id, date }, i) => {
          const r = RECIPES.find((x) => x.id === id);
          if (!r) return null;
          return (
            <button
              key={`${id}-${date}-${i}`}
              onClick={() => window.dispatchEvent(new CustomEvent('nemoa:open-recipe', { detail: { recipeId: id } }))}
              className="shrink-0 w-28 flex flex-col items-center gap-1 p-2 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-primary/20 transition-colors"
            >
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-xs font-semibold text-gray-800 truncate w-full text-center">{r.name}</span>
              <span className="text-xs text-gray-400 tabular-nums">{date.slice(5)}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
