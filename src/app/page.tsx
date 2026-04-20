'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isFoodItem, FOOD_EMOJI, FASHION_EMOJI, type FoodItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { ChevronRight, Sparkles, Search } from 'lucide-react';
import NemoaLogo from '@/components/layout/NemoaLogo';

import { HomeSkeleton } from '@/components/home/shared';
import DailyMessage    from '@/components/home/DailyMessage';
import TodayActivity   from '@/components/home/TodayActivity';
import UrgentAlert     from '@/components/home/UrgentAlert';
import QuickStats      from '@/components/home/QuickStats';
import DailyBriefing   from '@/components/home/DailyBriefing';
import TodayDishCard   from '@/components/home/TodayDishCard';
import ClosetSummary   from '@/components/home/ClosetSummary';
import MonthlySpending from '@/components/home/MonthlySpending';
import FridgeCarousel  from '@/components/home/FridgeCarousel';
import MonthlyHistory  from '@/components/home/MonthlyHistory';
import WeeklyInsight   from '@/components/home/WeeklyInsight';
import RecentlyAdded   from '@/components/home/RecentlyAdded';
import TipOfTheDay     from '@/components/home/TipOfTheDay';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return '새벽이에요, 푹 쉬세요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '오후도 힘내세요';
  return '오늘 하루 수고했어요';
}

export default function HomePage() {
  const { items, removeItem, undoRemove } = useCart();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [search, setSearch] = useState('');

  const searchResults = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      {/* 브랜드 헤더 */}
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 pt-3.5 pb-3 flex items-center justify-between gap-3">
          <NemoaLogo size="md" withTagline />
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full tabular-nums">
              {items.length}개 관리 중
            </span>
            <span className="text-[9px] text-gray-300 tabular-nums">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
        </div>
        <div className="px-4 pb-3 flex flex-col gap-1">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Sparkles size={11} className="text-brand-primary" />
            <span>네모아가 전하는 인사 — {getGreeting()}</span>
          </p>
          <TodayActivity />
        </div>
      </header>

      {/* 검색 바 */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="전체 상품 검색"
            className="w-full pl-8 pr-3 py-2 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        {search.trim() && (
          <div className="mt-2 flex flex-col gap-1.5">
            {searchResults.length > 0 ? searchResults.slice(0, 5).map((item) => {
              const emoji = isFoodItem(item)
                ? (FOOD_EMOJI[(item as FoodItem).foodCategory] ?? '📦')
                : (FASHION_EMOJI[item.category as keyof typeof FASHION_EMOJI] ?? '👕');
              return (
                <Link
                  key={item.id}
                  href={isFoodItem(item) ? '/fridge' : '/closet'}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white border border-gray-100 hover:border-brand-primary/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">{emoji}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-800 flex-1 truncate">{item.name}</span>
                  <span className="text-[10px] text-gray-400">{isFoodItem(item) ? '냉장고' : '옷장'}</span>
                  <ChevronRight size={12} className="text-gray-300" />
                </Link>
              );
            }) : (
              <p className="text-xs text-gray-400 text-center py-2">검색 결과가 없어요</p>
            )}
          </div>
        )}
      </div>

      {/* 네모아의 오늘 한 마디 */}
      <div className="px-4 pt-3">
        <DailyMessage items={items} />
      </div>

      {/* 벤토 그리드 */}
      {!ready ? (
        <HomeSkeleton />
      ) : (
        <div className="px-4 py-5 grid grid-cols-2 gap-4">
          <UrgentAlert     items={items} />
          <QuickStats      items={items} />
          <DailyBriefing   items={items} />
          <TodayDishCard   items={items} />
          <ClosetSummary   items={items} />
          <MonthlySpending />
          <FridgeCarousel
            items={items}
            onDiscard={(id) => {
              const name = items.find((i) => i.id === id)?.name ?? '';
              removeItem(id);
              showToast(`"${name}" 소진 처리됐어요.`, undoRemove);
            }}
          />
          <MonthlyHistory selectedMonth={selectedMonth} onChangeMonth={setSelectedMonth} />
          <WeeklyInsight  items={items} />
          <RecentlyAdded  items={items} />
          <TipOfTheDay />
        </div>
      )}
    </div>
  );
}
