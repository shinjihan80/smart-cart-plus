'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { currentSeasonByMonth, seasonStart } from '@/lib/season';
import { isSeasonalProduce, lookupSeasonalEmoji } from '@/lib/seasonalProduce';
import { SEASON_EMOJI } from '@/lib/recipes';
import { getFoodEmoji } from '@/lib/ingredientInference';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface DiscardRecord {
  name:     string;
  category: string;
  date:     string;
}

export default function SeasonalHistorySection({ history }: { history: DiscardRecord[] }) {
  const season = currentSeasonByMonth();

  const { ranked, total, distinct } = useMemo(() => {
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
    const total    = entries.reduce((s, e) => s + e.count, 0);
    return { ranked: entries.slice(0, 8), total, distinct: entries.length };
  }, [history, season]);

  if (ranked.length === 0) return null;

  return (
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
    </motion.div>
  );
}
