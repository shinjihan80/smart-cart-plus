'use client';

import Link from 'next/link';
import { isFoodItem, FOOD_EMOJI, FASHION_EMOJI, type CartItem, type FoodItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { Widget } from './shared';

export default function RecentlyAdded({ items }: { items: CartItem[] }) {
  const recent = items.slice(-5).reverse();
  if (recent.length === 0) return null;

  return (
    <div className="col-span-2">
      <Widget index={6}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🆕</span>
            <span className="text-xs text-gray-400 font-medium">최근 등록</span>
          </div>
          <span className="text-[11px] text-gray-300 tabular-nums">{recent.length}개</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {recent.map((item) => {
            const emoji = isFoodItem(item)
              ? (FOOD_EMOJI[(item as FoodItem).foodCategory] ?? '📦')
              : (FASHION_EMOJI[item.category as keyof typeof FASHION_EMOJI] ?? '👕');
            const dDay = isFoodItem(item)
              ? calcRemainingDays((item as FoodItem).purchaseDate, (item as FoodItem).baseShelfLifeDays)
              : null;
            return (
              <Link
                key={item.id}
                href={isFoodItem(item) ? '/fridge' : '/closet'}
                className="shrink-0 w-24 flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-primary/20 transition-colors relative"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white flex items-center justify-center">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{emoji}</span>
                  )}
                </div>
                <span className="text-[11px] text-gray-600 font-medium truncate w-full text-center">{item.name}</span>
                {dDay !== null && (
                  <span className={`text-[10px] tabular-nums ${
                    dDay <= 2 ? 'text-brand-warning font-semibold' : 'text-gray-400'
                  }`}>
                    {dDay <= 0 ? '만료' : `D-${dDay}`}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </Widget>
    </div>
  );
}
