'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { currentSeasonByMonth, seasonStart } from '@/lib/season';
import {
  SEASONAL_PRODUCE,
  isSeasonalProduce,
  lookupSeasonalEmoji,
} from '@/lib/seasonalProduce';
import { SEASON_EMOJI, countRecipesByIngredient } from '@/lib/recipes';
import { getFoodEmoji } from '@/lib/ingredientInference';
import { useShoppingList } from '@/lib/shoppingList';
import { useToast } from '@/context/ToastContext';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface DiscardRecord {
  name:     string;
  category: string;
  date:     string;
}

export default function SeasonalHistorySection({ history }: { history: DiscardRecord[] }) {
  const season = currentSeasonByMonth();
  const { has, add } = useShoppingList();
  const { showToast } = useToast();
  const [missedOpen, setMissedOpen] = useState(false);

  const { ranked, total, distinct, missed, totalInSeason } = useMemo(() => {
    const winStart = seasonStart(season);
    // 계절 시작 이후, 식품, 제철 이름 매칭
    const counts = new Map<string, number>();
    for (const h of history) {
      if (h.category !== '식품') continue;
      if (!h.date || h.date < winStart) continue;
      if (!isSeasonalProduce(h.name, season)) continue;
      counts.set(h.name, (counts.get(h.name) ?? 0) + 1);
    }
    const entries = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const total = entries.reduce((s, e) => s + e.count, 0);

    // 이번 계절 제철인데 아직 드셔보지 않은 것
    const tried = new Set<string>();
    for (const e of entries) {
      const base = SEASONAL_PRODUCE.find(
        (p) => p.name === e.name || e.name.includes(p.name),
      );
      if (base) tried.add(base.name);
    }
    const allInSeason = SEASONAL_PRODUCE.filter((p) => p.seasons.includes(season));
    const missed = allInSeason
      .filter((p) => !tried.has(p.name))
      .sort((a, b) => (a.peak === season ? 0 : 1) - (b.peak === season ? 0 : 1));

    return {
      ranked: entries.slice(0, 8),
      total,
      distinct: entries.length,
      missed,
      totalInSeason: allInSeason.length,
    };
  }, [history, season]);

  if (ranked.length === 0 && missed.length === 0) return null;

  function handleShopAdd(name: string) {
    if (has(name)) {
      showToast(`"${name}" 이미 쇼핑 리스트에 있어요.`);
      return;
    }
    add(name, '제철 놓친 것');
    showToast(`"${name}" 쇼핑 리스트에 담았어요.`);
  }

  function handleShopAddAll() {
    const targets = missed.filter((p) => !has(p.name));
    if (targets.length === 0) {
      showToast('모두 이미 쇼핑 리스트에 담겨있어요.');
      return;
    }
    if (!confirm(`${season}철 놓친 ${targets.length}종을 쇼핑 리스트에 담을까요?`)) return;
    for (const p of targets) add(p.name, '제철 놓친 것');
    showToast(`${targets.length}종 쇼핑 리스트에 담았어요.`);
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.285 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{SEASON_EMOJI[season]}</span>
          <span className="text-xs text-gray-400 font-medium">
            올{season} 드신 제철 재료
          </span>
        </div>
        <span className="text-[10px] text-gray-500 tabular-nums shrink-0">
          {distinct}종 · {total}회
        </span>
      </div>
      {ranked.length === 0 && (
        <p className="text-[11px] text-gray-400 leading-relaxed">
          아직 드신 제철 재료가 없어요. 아래에서 놓친 재료를 확인해보세요.
        </p>
      )}
      <div className="flex flex-col gap-1">
        {ranked.map((r, i) => {
          const emoji = lookupSeasonalEmoji(r.name) ?? getFoodEmoji(r.name);
          return (
            <div key={r.name} className="flex items-center gap-2 py-0.5">
              <span className="text-[10px] text-gray-300 tabular-nums w-4 text-right shrink-0">
                {i + 1}
              </span>
              <span className="text-sm shrink-0">{emoji}</span>
              <span className="flex-1 text-sm text-gray-800 truncate">{r.name}</span>
              <span className="text-[11px] font-semibold text-brand-primary tabular-nums shrink-0">
                {r.count}회
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-2.5 leading-relaxed">
        냉장고에서 소진한 기록을 기반으로 집계해요. {season}이 지나면 다음 계절로 자동 교체돼요.
      </p>

      {missed.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => setMissedOpen(!missedOpen)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🫥</span>
              <span className="text-[11px] font-semibold text-gray-600">
                아직 못 드신 {season}철 재료
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold tabular-nums">
                {missed.length}/{totalInSeason}
              </span>
            </div>
            <span className={`text-[10px] text-gray-400 transition-transform ${missedOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>
          <AnimatePresence>
            {missedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {missed.length >= 2 && (
                  <div className="pt-2">
                    <button
                      onClick={handleShopAddAll}
                      className="w-full text-[11px] font-semibold py-1.5 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                    >
                      🛒 {missed.length}종 모두 쇼핑 리스트에 담기
                    </button>
                  </div>
                )}
                <div className="pt-2 flex gap-1.5 flex-wrap">
                  {missed.slice(0, 12).map((p) => {
                    const recipeCount = countRecipesByIngredient(p.name);
                    return (
                      <div
                        key={p.name}
                        className="flex items-center rounded-2xl bg-amber-50 border border-amber-100 overflow-hidden"
                      >
                        <button
                          onClick={() => handleShopAdd(p.name)}
                          title={p.blurb ?? `${season}철 제철`}
                          className="flex items-center gap-1 text-[11px] pl-1.5 pr-2 py-1 text-amber-700 hover:bg-amber-100 active:scale-95 transition-all"
                        >
                          <span className="text-sm">{p.emoji}</span>
                          <span className="font-medium">{p.name}</span>
                          {p.peak === season && (
                            <span className="text-[9px] px-1 py-0 rounded-full bg-amber-200 text-amber-800">피크</span>
                          )}
                        </button>
                        {recipeCount > 0 && (
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('nemoa:open-palette', { detail: { query: `?${p.name}` } }))}
                            title={`${p.name}(으)로 만드는 요리 보기`}
                            className="text-[10px] px-2 py-1 border-l border-amber-100 text-amber-700/80 hover:bg-amber-100 transition-colors"
                          >
                            📖 {recipeCount}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {missed.length > 12 && (
                    <span className="text-[10px] text-gray-400 self-center">외 {missed.length - 12}종</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                  칩을 탭하면 쇼핑 리스트에 담겨요. {season}이 지나기 전에 한 번씩 드셔보세요.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
    </>
  );
}
