'use client';

import { motion } from 'framer-motion';
import { isClothingItem, FASHION_EMOJI, type CartItem } from '@/types';
import { useWearLog, daysSince } from '@/lib/wearLog';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface WearStatsSectionProps {
  items: CartItem[];
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function WearStatsSection({ items }: WearStatsSectionProps) {
  const { log, getEntry } = useWearLog();
  const clothes = items.filter(isClothingItem);

  const annotated = clothes.map((c) => ({ item: c, ...getEntry(c.id) }));

  // 최근 4주 요일별 착용 빈도
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

  if (topWorn.length === 0 && neverWorn.length === 0 && longIdle.length === 0 && dowTotal === 0) return null;

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

      {dowTotal > 0 && (() => {
        const peakIdx = dowCounts.indexOf(Math.max(...dowCounts));
        return (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-brand-primary font-semibold">🗓️ 요일별 착용 패턴 (최근 4주)</p>
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

      {topWorn.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-brand-primary font-semibold mb-1.5">♥ 자주 입는 옷 TOP 3</p>
          <div className="flex flex-col gap-1">
            {topWorn.map((x) => (
              <div key={x.item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{FASHION_EMOJI[x.item.category] ?? '👕'}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.item.name}</span>
                <span className="text-[10px] text-brand-primary font-bold tabular-nums">{x.count}회</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {longIdle.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-amber-600 font-semibold mb-1.5">🌙 오래 안 입은 옷</p>
          <div className="flex flex-col gap-1">
            {longIdle.map((x) => (
              <div key={x.item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{FASHION_EMOJI[x.item.category] ?? '👕'}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.item.name}</span>
                <span className="text-[10px] text-amber-600 font-medium tabular-nums">{daysSince(x.lastWorn!)}일</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {neverWorn.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 font-semibold mb-1.5">👀 아직 안 입은 옷</p>
          <div className="flex flex-col gap-1">
            {neverWorn.map((x) => (
              <div key={x.item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{FASHION_EMOJI[x.item.category] ?? '👕'}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{x.item.name}</span>
                <span className="text-[10px] text-gray-400">—</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
        옷장 카드를 펼쳐 &ldquo;👕 오늘 입었어요&rdquo;를 누르면 착용 기록이 쌓여요.
      </p>
    </motion.div>
  );
}
