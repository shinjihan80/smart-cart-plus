'use client';

import { isFoodItem, isClothingItem, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { useCookLog } from '@/lib/recipeCookLog';
import { useWearLog } from '@/lib/wearLog';
import { Widget } from './shared';

export default function WeeklyInsight({ items }: { items: CartItem[] }) {
  const food    = items.filter(isFoodItem);
  const clothes = items.filter(isClothingItem);
  const urgent  = food.filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length;

  // 최근 7일 조리·착용 기록 집계
  const { log: cookLog } = useCookLog();
  const { log: wearLog } = useWearLog();
  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cookWeek = Object.values(cookLog).flat().filter((d) => {
    const t = new Date(d).getTime();
    return !isNaN(t) && t >= weekAgoMs;
  }).length;
  const wearWeek = Object.values(wearLog).flat().filter((d) => {
    const t = new Date(d).getTime();
    return !isNaN(t) && t >= weekAgoMs;
  }).length;

  const insights: string[] = [];
  if (urgent > 0) insights.push(`⚠️ 식품 ${urgent}개가 곧 만료돼요. 빨리 소비해주세요.`);
  if (cookWeek >= 5) insights.push(`🍳 이번 주 ${cookWeek}번 요리하셨어요. 꾸준히 잘 하고 계세요!`);
  else if (cookWeek > 0) insights.push(`🍳 이번 주 ${cookWeek}번 요리하셨어요. 이번 주 한 번 더 도전해볼까요?`);
  if (wearWeek >= 7) insights.push(`👕 이번 주 ${wearWeek}회 착용 기록을 남기셨어요.`);
  if (food.length > clothes.length * 2) insights.push('📊 식품 비율이 높아요. 의류도 관리해보세요.');
  if (clothes.length > 5) insights.push(`👔 옷장에 ${clothes.length}벌이에요. 안 입는 옷 정리를 추천해요.`);
  if (food.length === 0) insights.push('🛒 냉장고가 비어있어요. 장을 봐야 할 때예요.');
  if (insights.length === 0) insights.push('이번 주도 잘 관리하고 있어요!');

  return (
    <div className="col-span-2">
      <Widget index={5} variant="ghost">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">💡</span>
          <span className="text-xs text-gray-400 font-medium">네모아의 주간 인사이트</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {insights.map((text, i) => (
            <p key={i} className="text-sm text-gray-600 leading-relaxed">
              {text}
            </p>
          ))}
        </div>
      </Widget>
    </div>
  );
}
