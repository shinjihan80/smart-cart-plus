'use client';

/**
 * 요일별 빈도 막대 차트 — 최근 4주 집계 패턴을 시각화.
 * CookStats·WearStats 공용.
 */

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  /** date(ISO) → 빈도 Record — 내부에서 요일 매핑 */
  datesByKey: Record<string, string[]>;
  label:      string;
  /** 몇 주치 집계 (기본 4주) */
  weeks?:     number;
}

export default function WeekdayPatternChart({ datesByKey, label, weeks = 4 }: Props) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const cutoffMs = Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
  for (const dates of Object.values(datesByKey)) {
    for (const d of dates) {
      const t = new Date(d).getTime();
      if (t < cutoffMs || isNaN(t)) continue;
      counts[new Date(d).getDay()] += 1;
    }
  }
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const max = Math.max(...counts, 1);
  const peakIdx = counts.indexOf(max);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] text-brand-primary font-semibold">🗓️ {label} (최근 {weeks}주)</p>
        <span className="text-[10px] text-gray-400 tabular-nums">
          {total}회 · 피크 {DOW_LABELS[peakIdx]}요일
        </span>
      </div>
      <div className="flex items-end justify-between gap-1 h-14">
        {counts.map((c, i) => {
          const pct  = Math.round((c / max) * 100);
          const isPk = c === max && c > 0;
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
}
