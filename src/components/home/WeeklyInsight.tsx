'use client';

import { isFoodItem, isClothingItem, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { useCookLog } from '@/lib/recipeCookLog';
import { useWearLog } from '@/lib/wearLog';
import EmojiIcon from '@/components/EmojiIcon';
import { Widget } from './shared';

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

function ymd(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * 주간 인사이트 위젯 — 최근 7일 조리·착용 미니 차트 + 1~2줄 인사이트.
 *
 * 시각화
 *  - 7개 막대 × (조리 + 착용 스택): 일자별 활동 한눈에
 *  - 오늘은 막대 라벨 굵게 강조
 *
 * 텍스트
 *  - 가장 임팩트 있는 인사이트 1-2개만 (기존 6+ 메시지 → 압축)
 */
export default function WeeklyInsight({ items }: { items: CartItem[] }) {
  const food    = items.filter(isFoodItem);
  const clothes = items.filter(isClothingItem);
  const urgent  = food.filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length;

  const { log: cookLog } = useCookLog();
  const { log: wearLog } = useWearLog();

  // 최근 7일 일자별 집계
  const now = new Date();
  const todayStr = ymd(now);
  const days: { label: string; ymd: string; cookCount: number; wearCount: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const str = ymd(d);
    days.push({
      label: DAY_LABEL[d.getDay()],
      ymd:   str,
      cookCount: 0,
      wearCount: 0,
      isToday:   str === todayStr,
    });
  }

  for (const dates of Object.values(cookLog)) {
    for (const d of dates) {
      const day = days.find((x) => x.ymd === d);
      if (day) day.cookCount += 1;
    }
  }
  for (const dates of Object.values(wearLog)) {
    for (const d of dates) {
      const day = days.find((x) => x.ymd === d);
      if (day) day.wearCount += 1;
    }
  }

  const cookWeek = days.reduce((s, d) => s + d.cookCount, 0);
  const wearWeek = days.reduce((s, d) => s + d.wearCount, 0);
  const maxDay   = Math.max(...days.map((d) => d.cookCount + d.wearCount), 1);
  const activeDays = days.filter((d) => d.cookCount + d.wearCount > 0).length;

  // 가장 임팩트 있는 인사이트 1-2개만
  const insights: string[] = [];
  if (urgent > 0) {
    insights.push(`⚠️ 식품 ${urgent}개 만료 임박 — 빨리 소비해주세요`);
  }
  if (cookWeek === 0 && wearWeek === 0) {
    insights.push('📌 한 주가 비었어요. 오늘 만든 요리·입은 옷을 기록해볼까요?');
  } else if (cookWeek >= 5) {
    insights.push(`🍳 이번 주 ${cookWeek}번 요리 — 꾸준히 잘하고 있어요!`);
  } else if (activeDays >= 5) {
    insights.push(`🔥 ${activeDays}일 활동 기록 — 페이스 좋아요`);
  } else if (cookWeek > 0 || wearWeek > 0) {
    insights.push(`🍳 요리 ${cookWeek}번 · 👕 착용 ${wearWeek}회 — 한 주 정리해봤어요`);
  }
  if (food.length === 0 && insights.length < 2) {
    insights.push('🛒 냉장고가 비어있어요 — 장을 봐야 할 때예요');
  } else if (clothes.length > 30 && insights.length < 2) {
    insights.push(`👔 옷장에 ${clothes.length}벌 — 정리 추천해요`);
  }
  if (insights.length === 0) {
    insights.push('이번 주도 잘 관리하고 있어요!');
  }

  return (
    <Widget index={5} variant="ghost">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="💡" size={16} className="text-amber-500" />
          <span className="text-xs text-gray-400 font-medium">네모아의 주간 인사이트</span>
        </div>
        <span className="text-[10px] text-gray-400 tabular-nums">
          최근 7일
        </span>
      </div>

      {/* 7일 미니 차트 (cook + wear 스택) */}
      <div className="rounded-2xl bg-gray-50/70 px-2.5 py-2 mb-2.5">
        <div className="flex items-end justify-between gap-1 h-14">
          {days.map((d) => {
            const total = d.cookCount + d.wearCount;
            const heightPct = (total / maxDay) * 100;
            return (
              <div key={d.ymd} className="flex-1 flex flex-col items-center justify-end gap-0.5 h-full">
                <div
                  className="w-full flex flex-col-reverse rounded overflow-hidden"
                  style={{ height: `${heightPct}%`, minHeight: total > 0 ? '3px' : '1px' }}
                  title={`${d.label} 조리 ${d.cookCount} · 착용 ${d.wearCount}`}
                >
                  {d.cookCount > 0 && (
                    <div
                      className="bg-amber-500"
                      style={{ height: `${(d.cookCount / total) * 100}%`, minHeight: '1px' }}
                    />
                  )}
                  {d.wearCount > 0 && (
                    <div
                      className="bg-brand-primary"
                      style={{ height: `${(d.wearCount / total) * 100}%`, minHeight: '1px' }}
                    />
                  )}
                  {total === 0 && <div className="bg-gray-200 w-full h-px self-end" />}
                </div>
                <span
                  className={`text-[10px] tabular-nums ${
                    d.isToday ? 'text-brand-primary font-bold' : 'text-gray-400'
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-3 mt-1.5 pt-1.5 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-sm bg-amber-500" />
            <span className="text-[10px] text-gray-500 tabular-nums">조리 {cookWeek}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-sm bg-brand-primary" />
            <span className="text-[10px] text-gray-500 tabular-nums">착용 {wearWeek}</span>
          </div>
        </div>
      </div>

      {/* 인사이트 텍스트 (최대 2개) */}
      <div className="flex flex-col gap-1">
        {insights.slice(0, 2).map((text, i) => (
          <p key={i} className="text-sm text-gray-600 leading-relaxed">
            {text}
          </p>
        ))}
      </div>
    </Widget>
  );
}
