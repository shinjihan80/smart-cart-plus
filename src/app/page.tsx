'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import NemoaLogo from '@/components/layout/NemoaLogo';
import PaletteButton from '@/components/PaletteButton';
import { useSessionPing } from '@/lib/analytics';

import { HomeSkeleton } from '@/components/home/shared';
import HeroMessage     from '@/components/home/HeroMessage';
import SectionHeader   from '@/components/home/SectionHeader';
import TodayActivity   from '@/components/home/TodayActivity';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import UrgentAlert     from '@/components/home/UrgentAlert';
import DailyBriefing   from '@/components/home/DailyBriefing';
import TodayDishCard   from '@/components/home/TodayDishCard';
import WeeklyInsight   from '@/components/home/WeeklyInsight';
import SeasonalChipRow from '@/components/home/SeasonalChipRow';
import SeasonalHintWidget from '@/components/home/SeasonalHintWidget';
import QuickLinks from '@/components/home/QuickLinks';
import SavedOutfitSuggestion from '@/components/home/SavedOutfitSuggestion';

export default function HomePage() {
  useSessionPing();  // 하루 1회 익명 세션 핑 (opt-in + 엔드포인트 설정 시만 전송)

  const { items, discardHistory } = useCart();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      {/* 헤더 — 로고 + 관리 개수 + 날짜 */}
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-sm border-b border-gray-50">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
          <NemoaLogo size="md" withTagline />
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full tabular-nums">
              {items.length}개 관리 중
            </span>
            <span className="text-xs text-gray-400 tabular-nums">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
        </div>

        {/* 검색 바 — 탭하면 풀스크린 CommandPalette (검색 기능 분리) */}
        <div className="px-5 pb-3">
          <PaletteButton variant="bar" />
        </div>

        <div className="px-5 pb-3">
          <TodayActivity />
        </div>
      </header>

      {/* Hero — 네모아의 오늘 한 마디 */}
      <div className="px-5 pt-5">
        <SectionErrorBoundary label="오늘 한 마디">
          <HeroMessage items={items} />
        </SectionErrorBoundary>
      </div>

      {/* 카테고리 아이콘 그리드 */}
      <div className="px-5 pt-6">
        <SectionErrorBoundary label="카테고리">
          <QuickLinks items={items} history={discardHistory} />
        </SectionErrorBoundary>
      </div>

      {/* 섹션 그룹 */}
      {!ready ? (
        <HomeSkeleton />
      ) : (
        <div className="px-5 pb-10">
          {/* 지금 바로 — 임박·제철 */}
          <SectionHeader title="지금 바로" actionHref="/fridge" actionLabel="냉장고">
            <SectionErrorBoundary label="임박 식품">
              <UrgentAlert items={items} />
            </SectionErrorBoundary>
            <SectionErrorBoundary label="제철 힌트">
              <SeasonalHintWidget items={items} />
            </SectionErrorBoundary>
            <SectionErrorBoundary label="제철 재료">
              <SeasonalChipRow items={items} />
            </SectionErrorBoundary>
          </SectionHeader>

          {/* 오늘 추천 — 식사·옷차림 */}
          <SectionHeader title="오늘 추천" actionHref="/fridge" actionLabel="전체 레시피">
            <SectionErrorBoundary label="오늘 한 그릇">
              <TodayDishCard items={items} />
            </SectionErrorBoundary>
            <SectionErrorBoundary label="데일리 브리핑">
              <DailyBriefing items={items} />
            </SectionErrorBoundary>
            <SectionErrorBoundary label="저장된 코디">
              <SavedOutfitSuggestion items={items} />
            </SectionErrorBoundary>
          </SectionHeader>

          {/* 이번 주 — 한 줄 요약 */}
          <SectionHeader title="이번 주" actionHref="/mypage" actionLabel="마이페이지">
            <SectionErrorBoundary label="주간 인사이트">
              <WeeklyInsight items={items} />
            </SectionErrorBoundary>
          </SectionHeader>
        </div>
      )}
    </div>
  );
}
