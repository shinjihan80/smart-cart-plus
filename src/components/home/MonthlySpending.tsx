'use client';

import { MONTHLY_DATA } from '@/data/monthlySpending';
import { Widget } from './shared';

export default function MonthlySpending() {
  const now = new Date();
  const thisMonth = MONTHLY_DATA.find((m) => m.month === now.getMonth() + 1) ?? MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const prevMonth = MONTHLY_DATA.find((m) => m.month === now.getMonth()) ?? MONTHLY_DATA[MONTHLY_DATA.length - 2];
  const diff = prevMonth.total > 0
    ? Math.round(((thisMonth.total - prevMonth.total) / prevMonth.total) * 100)
    : 0;

  return (
    <Widget index={2}>
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">💰</span>
          <span className="text-xs text-gray-400 font-medium">이번 달 지출</span>
        </div>
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-gray-900 tabular-nums">
            ₩{thisMonth.total.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            지난달 대비{' '}
            <span className={`font-semibold ${diff <= 0 ? 'text-brand-success' : 'text-brand-warning'}`}>
              {diff <= 0 ? '' : '+'}{diff}%
            </span>
          </p>
        </div>
      </div>
    </Widget>
  );
}
