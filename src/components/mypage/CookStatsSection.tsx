'use client';

import { motion } from 'framer-motion';
import { RECIPES, type Recipe } from '@/lib/recipes';
import { useCookLog } from '@/lib/recipeCookLog';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { daysSince } from '@/lib/wearLog';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface CookStatsSectionProps {
  onOpenRecipe: (recipe: Recipe) => void;
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CookStatsSection({ onOpenRecipe }: CookStatsSectionProps) {
  const { log, getEntry } = useCookLog();
  const { favorites } = useRecipeFavorites();

  const annotated = RECIPES.map((r) => ({ recipe: r, ...getEntry(r.id) }));

  // 최근 4주 내 요일별 조리 빈도
  const dowCounts = (() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const cutoffMs = Date.now() - 28 * 24 * 60 * 60 * 1000;
    for (const dates of Object.values(log)) {
      for (const d of dates) {
        const t = new Date(d).getTime();
        if (t < cutoffMs || isNaN(t)) continue;
        counts[new Date(d).getDay()] += 1;
      }
    }
    return counts;
  })();
  const dowTotal = dowCounts.reduce((a, b) => a + b, 0);
  const maxDow   = Math.max(...dowCounts, 1);

  const topMade = annotated
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const longIdle = annotated
    .filter((x) => x.count > 0 && x.lastCooked && daysSince(x.lastCooked) >= 30)
    .sort((a, b) => daysSince(b.lastCooked!) - daysSince(a.lastCooked!))
    .slice(0, 3);

  const untriedFavs = annotated
    .filter((x) => favorites.includes(x.recipe.id) && x.count === 0)
    .slice(0, 3);

  if (topMade.length === 0 && longIdle.length === 0 && untriedFavs.length === 0 && dowTotal === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.27 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">👨‍🍳</span>
        <span className="text-xs text-gray-400 font-medium">조리 로그 분석</span>
      </div>

      {dowTotal > 0 && (() => {
        const peakIdx = dowCounts.indexOf(Math.max(...dowCounts));
        return (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-brand-primary font-semibold">🗓️ 요일별 조리 패턴 (최근 4주)</p>
              <span className="text-[10px] text-gray-400 tabular-nums">{dowTotal}회 · 피크 {DOW_LABELS[peakIdx]}요일</span>
            </div>
            <div className="flex items-end justify-between gap-1 h-14">
              {dowCounts.map((c, i) => {
                const pct  = Math.round((c / maxDow) * 100);
                const isPk = c === maxDow && c > 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isPk ? 'bg-brand-primary' : c > 0 ? 'bg-brand-primary/40' : 'bg-gray-100'
                        }`}
                        style={{ height: `${pct}%`, minHeight: c > 0 ? '4px' : '2px' }}
                      />
                    </div>
                    <span className={`text-[9px] tabular-nums ${
                      isPk ? 'text-brand-primary font-bold' : 'text-gray-400'
                    }`}>{DOW_LABELS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {topMade.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-brand-primary font-semibold mb-1.5">🔥 자주 만든 레시피 TOP 3</p>
          <div className="flex flex-col gap-1">
            {topMade.map((x) => (
              <button
                key={x.recipe.id}
                onClick={() => onOpenRecipe(x.recipe)}
                className="flex items-center gap-2 py-1 text-left hover:bg-gray-50 -mx-1 px-1 rounded-xl transition-colors"
              >
                <span className="text-sm shrink-0">{x.recipe.emoji}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.recipe.name}</span>
                <span className="text-[10px] text-brand-primary font-bold tabular-nums">{x.count}회</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {longIdle.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-amber-600 font-semibold mb-1.5">💭 오래된 레시피 다시 만들기</p>
          <div className="flex flex-col gap-1">
            {longIdle.map((x) => (
              <button
                key={x.recipe.id}
                onClick={() => onOpenRecipe(x.recipe)}
                className="flex items-center gap-2 py-1 text-left hover:bg-gray-50 -mx-1 px-1 rounded-xl transition-colors"
              >
                <span className="text-sm shrink-0">{x.recipe.emoji}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.recipe.name}</span>
                <span className="text-[10px] text-amber-600 font-medium tabular-nums">{daysSince(x.lastCooked!)}일</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {untriedFavs.length > 0 && (
        <div>
          <p className="text-[10px] text-brand-warning font-semibold mb-1.5">⭐ 즐겨찾기인데 미도전</p>
          <div className="flex flex-col gap-1">
            {untriedFavs.map((x) => (
              <button
                key={x.recipe.id}
                onClick={() => onOpenRecipe(x.recipe)}
                className="flex items-center gap-2 py-1 text-left hover:bg-gray-50 -mx-1 px-1 rounded-xl transition-colors"
              >
                <span className="text-sm shrink-0">{x.recipe.emoji}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.recipe.name}</span>
                <span className="text-[10px] text-brand-warning">도전 →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
        레시피 상세에서 &ldquo;만들었어요&rdquo;를 누르면 기록이 쌓여요.
      </p>
    </motion.div>
  );
}
