'use client';

import { MONTHLY_DATA } from '@/data/monthlySpending';
import { Widget } from './shared';

interface MonthlyHistoryProps {
  selectedMonth: number;
  onChangeMonth: (m: number) => void;
}

export default function MonthlyHistory({ selectedMonth, onChangeMonth }: MonthlyHistoryProps) {
  const data = MONTHLY_DATA.find((m) => m.month === selectedMonth) ?? MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const maxTotal = Math.max(...MONTHLY_DATA.map((m) => m.total));

  return (
    <div className="col-span-2">
      <Widget index={4} className="!p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <span className="text-xs text-gray-400 font-medium">월별 소비 내역</span>
          </div>
          <span className="text-xs font-bold text-gray-700 tabular-nums">
            ₩{data.total.toLocaleString()}
          </span>
        </div>

        <div className="flex gap-1 px-5 pb-4">
          {MONTHLY_DATA.map((m) => {
            const isActive = m.month === selectedMonth;
            const barH = Math.max(8, (m.total / maxTotal) * 48);
            return (
              <button
                key={m.month}
                onClick={() => onChangeMonth(m.month)}
                className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-2xl transition-colors ${
                  isActive ? 'bg-brand-primary/5' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-full flex justify-center items-end h-12">
                  <div
                    className={`w-5 rounded-full transition-all duration-300 ${
                      isActive ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                    style={{ height: `${barH}px` }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-brand-primary' : 'text-gray-400'}`}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-5 pb-5 flex flex-col gap-2.5">
          {data.orders.map((order) => (
            <div key={order.id} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full ${order.mallBg} flex items-center justify-center shrink-0`}>
                <span className="text-white text-[9px] font-bold">{order.store.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{order.name}</p>
                <p className="text-[10px] text-gray-400">{order.store} · {order.date}</p>
              </div>
              <span className="text-sm font-bold text-gray-900 shrink-0 tabular-nums">
                ₩{order.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Widget>
    </div>
  );
}
