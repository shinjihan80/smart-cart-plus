'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { isFoodItem, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { useShoppingList } from '@/lib/shoppingList';
import { currentSeasonByMonth } from '@/lib/season';
import { currentSeasonalProduce } from '@/lib/seasonalProduce';
import { getFoodEmoji } from '@/lib/ingredientInference';
import { SEASON_EMOJI } from '@/lib/recipes';
import { estimateCycles } from '@/lib/purchaseCycle';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface ShoppingSuggestionsSectionProps {
  items:          CartItem[];
  discardHistory: { name: string; category: string; date: string }[];
  showToast:      (msg: string) => void;
}

interface Suggestion {
  name:   string;
  reason: string;
  badge:  string;
  emoji:  string;
  source: string;
}

export default function ShoppingSuggestionsSection({
  items, discardHistory, showToast,
}: ShoppingSuggestionsSectionProps) {
  const { has, add } = useShoppingList();
  const season = currentSeasonByMonth();

  const suggestions = useMemo<Suggestion[]>(() => {
    const foods = items.filter(isFoodItem);
    const haveNames = new Set(foods.map((f) => f.name));
    const out: Suggestion[] = [];

    // 1) 임박(D-Day ≤ 2) 식품 — 이미 있지만 곧 떨어질 것
    for (const f of foods) {
      const d = calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays);
      if (d <= 2 && d >= 0) {
        out.push({
          name: f.name,
          reason: d === 0 ? '오늘이 마지막' : `${d}일 뒤 만료`,
          badge: '⚠️ 임박',
          emoji: getFoodEmoji(f.name, f.foodCategory),
          source: '임박 재구매',
        });
      }
    }

    // 2) 구매 주기 기반 — 다음 소진이 예상되는 식품 (cycleDays - sinceLast ≤ 2일)
    const cycles = estimateCycles(discardHistory, 2);
    const seenCycle = new Set<string>();
    for (const c of cycles) {
      if (c.dueInDays > 2) break;  // 정렬돼 있으므로 dueInDays 작은 것부터
      if (haveNames.has(c.name)) continue;
      if (seenCycle.has(c.name)) continue;
      if (out.some((s) => s.name === c.name)) continue;
      seenCycle.add(c.name);
      const overdue = c.dueInDays < 0;
      out.push({
        name: c.name,
        reason: overdue ? `주기보다 ${-c.dueInDays}일 늦었어요` : `${c.cycleDays}일 주기 · 곧 떨어질 때`,
        badge: '🔁 주기',
        emoji: getFoodEmoji(c.name),
        source: '구매 주기',
      });
      if (seenCycle.size >= 3) break;
    }

    // 3) 최근 소진한 것 (discardHistory) — 현재 없는 식품만
    const seenRebuy = new Set<string>();
    for (const h of discardHistory) {
      if (h.category !== '식품') continue;
      if (haveNames.has(h.name)) continue;
      if (seenRebuy.has(h.name)) continue;
      seenRebuy.add(h.name);
      if (out.some((s) => s.name === h.name)) continue;
      out.push({
        name: h.name,
        reason: '최근에 다 썼어요',
        badge: '🔄 재구매',
        emoji: getFoodEmoji(h.name),
        source: '소진 이력',
      });
      if (seenRebuy.size >= 4) break;
    }

    // 3) 제철 재료 — 현재 없는 것
    const seasonal = currentSeasonalProduce(season, 8)
      .filter((p) => !haveNames.has(p.name))
      .slice(0, 3);
    for (const p of seasonal) {
      if (out.some((s) => s.name === p.name)) continue;
      out.push({
        name: p.name,
        reason: p.peak === season ? `${season}철 피크` : `${season} 제철`,
        badge: SEASON_EMOJI[season],
        emoji: getFoodEmoji(p.name, p.foodCategory),
        source: '제철 재료',
      });
    }

    return out.slice(0, 8);
  }, [items, discardHistory, season]);

  if (suggestions.length === 0) return null;

  function handleAdd(s: Suggestion) {
    if (has(s.name)) {
      showToast(`"${s.name}" 이미 쇼핑 리스트에 있어요.`);
      return;
    }
    add(s.name, s.source);
    showToast(`"${s.name}" 쇼핑 리스트에 담았어요.`);
  }

  function handleAddAll() {
    let added = 0;
    for (const s of suggestions) {
      if (!has(s.name)) {
        add(s.name, s.source);
        added += 1;
      }
    }
    showToast(added > 0 ? `${added}개 쇼핑 리스트에 담았어요.` : '이미 모두 담겨있어요.');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.26 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🪄</span>
          <span className="text-xs text-gray-400 font-medium">장볼 거 추천</span>
          <span className="text-[9px] text-gray-300">· 임박·소진·제철</span>
        </div>
        {suggestions.length >= 2 && (
          <button
            onClick={handleAddAll}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 transition-colors shrink-0"
          >
            모두 담기
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {suggestions.map((s) => {
          const already = has(s.name);
          return (
            <div key={`${s.source}-${s.name}`} className="flex items-center gap-2 py-1.5">
              <span className="text-sm shrink-0">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{s.name}</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                    {s.badge}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">{s.reason}</p>
              </div>
              <button
                onClick={() => handleAdd(s)}
                disabled={already}
                className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full transition-colors ${
                  already
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'
                }`}
              >
                {already ? '담김' : '+ 담기'}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
