'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { foodItems, clothingItems, mockCartItems } from '@/data/mockData';
import { isFoodItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { Refrigerator, Shirt, TrendingUp, ChevronRight } from 'lucide-react';

// ── 위젯 공통 래퍼 ───────────────────────────────────────────────────────────
function Widget({
  children,
  href,
  className = '',
  index = 0,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
    >
      <Link
        href={href}
        className={`block bg-white rounded-3xl border border-gray-100 shadow-sm p-5 transition-all hover:shadow-md active:scale-[0.98] ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}

// ── 데일리 브리핑 ─────────────────────────────────────────────────────────────
function DailyBriefing() {
  const springItems = clothingItems.filter(
    (c) => c.weatherTags?.includes('봄') || c.weatherTags?.includes('여름'),
  );
  const recommend = springItems[0];

  return (
    <Widget href="/closet" className="col-span-2" index={0}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">오늘의 브리핑</p>
          <h2 className="text-base font-bold text-gray-900 leading-snug">
            오늘은 선선한 봄 날씨예요 🌸
          </h2>
          {recommend && (
            <p className="text-sm text-gray-500 mt-1.5">
              추천 코디: <span className="font-semibold text-indigo-600">{recommend.name}</span>
              {recommend.material && ` · ${recommend.material} 소재`}
            </p>
          )}
        </div>
        <ChevronRight size={18} className="text-gray-300 mt-1 shrink-0" />
      </div>
    </Widget>
  );
}

// ── 냉장고 알림 ───────────────────────────────────────────────────────────────
function FridgeAlert() {
  const withDays = foodItems.map((f) => ({
    ...f,
    dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays),
  }));
  const urgent = withDays.sort((a, b) => a.dDay - b.dDay)[0];

  if (!urgent) return null;

  const isExpired = urgent.dDay <= 0;
  const isUrgent  = urgent.dDay <= 2;

  return (
    <Widget href="/fridge" index={1}>
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center gap-2 mb-3">
          <Refrigerator size={16} className="text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">냉장고 알림</span>
        </div>
        <div>
          <p className={`text-3xl font-bold tracking-tight ${
            isExpired ? 'text-rose-500' : isUrgent ? 'text-rose-500' : 'text-gray-900'
          }`}>
            {isExpired ? '만료' : `D-${urgent.dDay}`}
          </p>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{urgent.name}</p>
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 mt-1.5">
            {urgent.storageType === '냉장' ? '❄️ 냉장' : urgent.storageType === '냉동' ? '🧊 냉동' : '📦 실온'}
          </span>
        </div>
      </div>
    </Widget>
  );
}

// ── 이번 달 지출 ──────────────────────────────────────────────────────────────
function MonthlySpending() {
  return (
    <Widget href="/mypage" index={2}>
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">이번 달 지출</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            ₩142,500
          </p>
          <p className="text-xs text-gray-400 mt-1">
            지난달 대비 <span className="text-emerald-500 font-semibold">-12%</span>
          </p>
        </div>
      </div>
    </Widget>
  );
}

// ── 최근 쇼핑 내역 ────────────────────────────────────────────────────────────
function RecentItems() {
  const recent = mockCartItems.slice(0, 2);

  return (
    <Widget href="/fridge" className="col-span-2" index={3}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium">최근 쇼핑 내역</span>
        <ChevronRight size={16} className="text-gray-300" />
      </div>
      <div className="flex gap-3">
        {recent.map((item) => (
          <div
            key={item.id}
            className="flex-1 rounded-2xl bg-gray-50 border border-gray-100 px-3 py-2.5 flex items-center gap-2.5"
          >
            <span className="text-xl shrink-0">
              {isFoodItem(item) ? '🥦' : item.category === '액세서리' ? '💍' : '👗'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
              <p className="text-[10px] text-gray-400">{item.category}</p>
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
}

// ── 홈 대시보드 ───────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div>
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Smart Cart Plus</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">라이프스타일 AI 매니저</p>
        </div>
      </header>

      {/* 벤토 그리드 */}
      <div className="px-4 py-5 grid grid-cols-2 gap-4">
        <DailyBriefing />
        <FridgeAlert />
        <MonthlySpending />
        <RecentItems />
      </div>
    </div>
  );
}
