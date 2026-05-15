'use client';

import { motion } from 'framer-motion';
import { useWearLog } from '@/lib/wearLog';
import { useCookLog } from '@/lib/recipeCookLog';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from './shared';

/**
 * 올해 누적 조리·착용·소진 요약 + 월별 히스토그램 + 연말 페이스 프로젝션.
 * discardHistory를 prop으로 받아 식재료 소진 횟수 표시.
 */
interface Props {
  discardHistory: { name: string; category: string; date: string }[];
}

const MONTH_LABEL = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function countByMonth(dates: string[], year: number): number[] {
  const counts = new Array(12).fill(0) as number[];
  for (const d of dates) {
    const t = new Date(d);
    if (!isNaN(t.getTime()) && t.getFullYear() === year) {
      counts[t.getMonth()] += 1;
    }
  }
  return counts;
}

export default function AnnualSummarySection({ discardHistory }: Props) {
  const { log: wearLog } = useWearLog();
  const { log: cookLog } = useCookLog();

  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const inYear = (d: string): boolean => d >= yearStart;

  const cookDates    = Object.values(cookLog).flat().filter(inYear);
  const wearDates    = Object.values(wearLog).flat().filter(inYear);
  const discardDates = discardHistory
    .filter((h) => h.category === '식품' && h.date && inYear(h.date))
    .map((h) => h.date);

  const cookTotal    = cookDates.length;
  const wearTotal    = wearDates.length;
  const discardTotal = discardDates.length;

  // 아무것도 기록되지 않았으면 숨김
  if (cookTotal === 0 && wearTotal === 0 && discardTotal === 0) return null;

  const now = new Date();
  const dayOfYear   = Math.floor((now.getTime() - new Date(yearStart).getTime()) / 86_400_000) + 1;
  const yearTotal   = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  const remaining   = yearTotal - dayOfYear;
  const paceMultiplier = dayOfYear > 0 ? yearTotal / dayOfYear : 1;

  const stats = [
    { emoji: '🍳', label: '조리',      value: cookTotal,    months: countByMonth(cookDates, year),    tone: 'bg-amber-500'     },
    { emoji: '👕', label: '착용',      value: wearTotal,    months: countByMonth(wearDates, year),    tone: 'bg-brand-primary' },
    { emoji: '♻️', label: '소진 식품', value: discardTotal, months: countByMonth(discardDates, year), tone: 'bg-emerald-500'   },
  ];

  // 모든 카테고리 합산해 가장 활동이 많은 달
  const monthlySum = new Array(12).fill(0) as number[];
  for (const s of stats) {
    for (let i = 0; i < 12; i += 1) monthlySum[i] += s.months[i];
  }
  const maxMonthly = Math.max(...monthlySum, 1);
  const topMonthIdx = monthlySum.indexOf(Math.max(...monthlySum));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.16 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="📅" size={16} className="text-gray-600" />
          <span className="text-xs text-gray-400 font-medium">올해 활동 요약</span>
        </div>
        <span className="text-sm text-gray-400 tabular-nums shrink-0">
          {year}년 · {dayOfYear}일째
        </span>
      </div>

      {/* 누적 + 연말 페이스 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {stats.map((s) => {
          const pace = Math.round(s.value * paceMultiplier);
          return (
            <div key={s.label} className="flex flex-col items-center gap-0.5 py-1.5 px-1.5 rounded-2xl bg-gray-50">
              <EmojiIcon emoji={s.emoji} size={18} className="text-gray-700" />
              <span className="text-base font-extrabold text-brand-primary tabular-nums">{s.value}</span>
              <span className="text-xs text-gray-400 font-medium">{s.label}</span>
              {s.value > 0 && remaining > 30 && (
                <span className="text-[10px] text-gray-400 tabular-nums">→ {pace}회 페이스</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 월별 히스토그램 — 스택 막대 */}
      <div className="rounded-2xl bg-gray-50 px-2.5 py-2.5">
        <div className="flex items-end justify-between gap-1 h-14">
          {MONTH_LABEL.map((m, i) => {
            const total = monthlySum[i];
            const isCurrent = i === now.getMonth();
            const isTop = i === topMonthIdx && total > 0;
            return (
              <div key={m} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <div
                  className="w-full flex flex-col-reverse rounded overflow-hidden"
                  style={{ height: `${(total / maxMonthly) * 100}%`, minHeight: total > 0 ? '2px' : '1px' }}
                  title={`${m}월 총 ${total}회`}
                >
                  {/* 스택 — 조리·착용·소진 합산 */}
                  {stats.map((s) => {
                    const v = s.months[i];
                    if (v === 0) return null;
                    const segPct = total > 0 ? (v / total) * 100 : 0;
                    return (
                      <div
                        key={s.label}
                        className={s.tone}
                        style={{ height: `${segPct}%`, minHeight: '1px' }}
                      />
                    );
                  })}
                </div>
                <span
                  className={`text-[10px] tabular-nums ${
                    isCurrent
                      ? 'text-brand-primary font-bold'
                      : isTop
                        ? 'text-gray-700 font-semibold'
                        : 'text-gray-400'
                  }`}
                >
                  {m}
                </span>
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-gray-100">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-sm ${s.tone}`} />
              <span className="text-[10px] text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 최다 활동 달 인사이트 */}
      {monthlySum[topMonthIdx] > 0 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          올해 가장 활발했던 달: <span className="font-semibold text-gray-700">{topMonthIdx + 1}월</span>
          {' '}({monthlySum[topMonthIdx]}회)
        </p>
      )}
    </motion.div>
  );
}
