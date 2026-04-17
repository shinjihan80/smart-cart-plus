'use client';

import { CartItem, isFoodItem, isClothingItem } from '@/types';

interface StatsWidgetProps {
  items: CartItem[];
}

function calcRemainingDays(purchaseDate: string, baseShelfLifeDays: number): number {
  const expiry = new Date(purchaseDate);
  expiry.setDate(expiry.getDate() + baseShelfLifeDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface StatCardProps {
  value: number;
  label: string;
  urgent?: boolean;
}

function StatCard({ value, label, urgent }: StatCardProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-3xl font-bold leading-none tracking-tight ${urgent ? 'text-rose-500' : 'text-gray-900'}`}>
        {value}
      </span>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  );
}

/**
 * StatsWidget — 대시보드 상단 요약 통계 위젯
 * 전체 / 식품 / 임박(D-2 이하) / 의류 4가지 수치를 한눈에 표시
 */
export default function StatsWidget({ items }: StatsWidgetProps) {
  const foodItems     = items.filter(isFoodItem);
  const clothingItems = items.filter(isClothingItem);
  const urgentCount   = foodItems.filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 2,
  ).length;

  return (
    <div className="col-span-2 sm:col-span-4 bg-white rounded-3xl border border-gray-100 px-5 py-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard value={items.length}        label="전체 상품" />
        <StatCard value={foodItems.length}    label="식품" />
        <StatCard value={urgentCount}         label="임박 소비" urgent={urgentCount > 0} />
        <StatCard value={clothingItems.length} label="의류·액세서리" />
      </div>
    </div>
  );
}
