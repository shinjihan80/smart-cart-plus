'use client';

import { motion } from 'framer-motion';
import { isClothingItem, FASHION_EMOJI, type CartItem } from '@/types';
import { useWearLog, daysSince } from '@/lib/wearLog';
import { FASHION_GROUP, type FashionGroup } from '@/types';
import WeekdayPatternChart from './WeekdayPatternChart';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface WearStatsSectionProps {
  items: CartItem[];
}

export default function WearStatsSection({ items }: WearStatsSectionProps) {
  const { log, getEntry } = useWearLog();
  const clothes = items.filter(isClothingItem);

  const annotated = clothes.map((c) => ({ item: c, ...getEntry(c.id) }));
  const dowTotal = Object.values(log).flat().filter((d) => {
    const t = new Date(d).getTime();
    return !isNaN(t) && t >= Date.now() - 28 * 24 * 60 * 60 * 1000;
  }).length;

  /**
   * 로테이션 밸런스 스코어 — 0~100.
   * 착용 기록 있는 옷들의 count 표준편차를 평균으로 나눈 변동계수(CV) 기반.
   * CV 낮을수록 골고루 입음 → 높은 점수.
   * 기록 2개 미만이면 스코어 계산 안 함.
   */
  const rotationScore = (() => {
    const worn = annotated.filter((x) => x.count > 0);
    if (worn.length < 2) return null;
    const mean = worn.reduce((s, x) => s + x.count, 0) / worn.length;
    const variance = worn.reduce((s, x) => s + (x.count - mean) ** 2, 0) / worn.length;
    const std = Math.sqrt(variance);
    const cv  = mean > 0 ? std / mean : 0;
    // cv 0 → 100점, cv 1.5+ → 0점
    const score = Math.round(Math.max(0, Math.min(100, (1 - cv / 1.5) * 100)));
    return { score, worn: worn.length };
  })();

  const topWorn = annotated
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const neverWorn = annotated
    .filter((x) => x.count === 0)
    .slice(0, 3);

  const longIdle = annotated
    .filter((x) => x.count > 0 && x.lastWorn && daysSince(x.lastWorn) >= 30)
    .sort((a, b) => daysSince(b.lastWorn!) - daysSince(a.lastWorn!))
    .slice(0, 3);

  if (topWorn.length === 0 && neverWorn.length === 0 && longIdle.length === 0 && dowTotal === 0 && !rotationScore) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.26 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">👕</span>
        <span className="text-xs text-gray-400 font-medium">착용 로그 분석</span>
      </div>

      {rotationScore && (
        <div className="mb-3 rounded-2xl bg-gray-50 px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🔄</span>
              <p className="text-sm font-semibold text-gray-600">로테이션 밸런스</p>
            </div>
            <span className={`text-xs font-bold tabular-nums ${
              rotationScore.score >= 70
                ? 'text-brand-success'
                : rotationScore.score >= 40
                  ? 'text-brand-primary'
                  : 'text-brand-warning'
            }`}>
              {rotationScore.score}점
            </span>
          </div>
          <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                rotationScore.score >= 70
                  ? 'bg-brand-success'
                  : rotationScore.score >= 40
                    ? 'bg-brand-primary'
                    : 'bg-brand-warning'
              }`}
              style={{ width: `${rotationScore.score}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {rotationScore.score >= 70
              ? `${rotationScore.worn}벌을 고루 잘 입고 계세요 👏`
              : rotationScore.score >= 40
                ? `${rotationScore.worn}벌 중 일부에 쏠려 있어요. 안 입은 옷도 한번 꺼내보세요.`
                : `소수의 옷에 집중돼 있어요. 🌙 배지 옷을 오늘 입어볼까요?`}
          </p>
        </div>
      )}

      <WeekdayPatternChart datesByKey={log} label="요일별 착용 패턴" />

      {(() => {
        // 카테고리별 착용 횟수 — 의류/신발/가방/액세서리
        const catCounts: Record<FashionGroup, number> = {
          '의류': 0, '신발': 0, '가방': 0, '액세서리': 0,
        };
        for (const c of clothes) {
          const count = log[c.id]?.length ?? 0;
          catCounts[FASHION_GROUP[c.category] ?? '의류'] += count;
        }
        const total = Object.values(catCounts).reduce((a, b) => a + b, 0);
        if (total === 0) return null;
        const bars: Array<{ key: FashionGroup; emoji: string; color: string }> = [
          { key: '의류',     emoji: '👕', color: 'bg-brand-primary' },
          { key: '신발',     emoji: '👟', color: 'bg-brand-success' },
          { key: '가방',     emoji: '👜', color: 'bg-amber-400' },
          { key: '액세서리', emoji: '✨', color: 'bg-rose-400' },
        ];
        return (
          <div className="mb-3">
            <p className="text-sm text-brand-primary font-semibold mb-1.5">👗 카테고리 분포</p>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
              {bars.map((b) => {
                const pct = Math.round((catCounts[b.key] / total) * 100);
                if (pct === 0) return null;
                return (
                  <div
                    key={b.key}
                    className={b.color}
                    style={{ width: `${pct}%` }}
                    title={`${b.emoji} ${b.key} ${catCounts[b.key]}회`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400 tabular-nums flex-wrap gap-1">
              {bars.filter((b) => catCounts[b.key] > 0).map((b) => (
                <span key={b.key}>{b.emoji} {catCounts[b.key]}</span>
              ))}
            </div>
          </div>
        );
      })()}

      {topWorn.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-brand-primary font-semibold mb-1.5">♥ 자주 입는 옷 TOP 3</p>
          <div className="flex flex-col gap-1">
            {topWorn.map((x) => (
              <div key={x.item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{FASHION_EMOJI[x.item.category] ?? '👕'}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.item.name}</span>
                <span className="text-sm text-brand-primary font-bold tabular-nums">{x.count}회</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {longIdle.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-amber-600 font-semibold mb-1.5">🌙 오래 안 입은 옷</p>
          <div className="flex flex-col gap-1">
            {longIdle.map((x) => (
              <div key={x.item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{FASHION_EMOJI[x.item.category] ?? '👕'}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.item.name}</span>
                <span className="text-sm text-amber-600 font-medium tabular-nums">{daysSince(x.lastWorn!)}일</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {neverWorn.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1.5">👀 아직 안 입은 옷</p>
          <div className="flex flex-col gap-1">
            {neverWorn.map((x) => (
              <div key={x.item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{FASHION_EMOJI[x.item.category] ?? '👕'}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.item.name}</span>
                <span className="text-sm text-gray-400">—</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 leading-relaxed">
        옷장 카드를 펼쳐 &ldquo;👕 오늘 입었어요&rdquo;를 누르면 착용 기록이 쌓여요.
      </p>
    </motion.div>
  );
}
