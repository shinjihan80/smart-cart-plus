'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import NemoaLogo from '@/components/layout/NemoaLogo';
import EmojiIcon from '@/components/EmojiIcon';
import { useSessionPing } from '@/lib/analytics';

import { HomeSkeleton } from '@/components/home/shared';
import HeroMessage     from '@/components/home/HeroMessage';
import SectionHeader   from '@/components/home/SectionHeader';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import UrgentAlert     from '@/components/home/UrgentAlert';
import RebuyAlert      from '@/components/home/RebuyAlert';
import SeasonChangeAlert from '@/components/home/SeasonChangeAlert';
import DailyBriefing   from '@/components/home/DailyBriefing';
import TodayDishCard   from '@/components/home/TodayDishCard';
import WeeklyInsight   from '@/components/home/WeeklyInsight';
import SeasonalHintWidget from '@/components/home/SeasonalHintWidget';
import QuickLinks from '@/components/home/QuickLinks';
import SavedOutfitSuggestion from '@/components/home/SavedOutfitSuggestion';

export default function HomePage() {
  useSessionPing();  // 하루 1회 익명 세션 핑 (opt-in + 엔드포인트 설정 시만 전송)

  const { items, discardHistory, loadSampleData } = useCart();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      {/* 헤더 — 로고 + 알림·프로필 (검색은 마이페이지에서) */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-50">
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <NemoaLogo size="md" />
          <div className="flex items-center -mr-1">
            <button
              type="button"
              aria-label="알림"
              className="w-10 h-10 flex items-center justify-center text-brand-ink hover:text-brand-primary transition-colors"
            >
              <Bell size={22} strokeWidth={2} />
            </button>
            <Link
              href="/mypage"
              aria-label="마이페이지"
              className="w-10 h-10 flex items-center justify-center text-brand-ink hover:text-brand-primary transition-colors"
            >
              <User size={22} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      {/* 빈 상태 CTA — 식품·옷 모두 0일 때만 노출 */}
      {items.length === 0 && (
        <div className="px-5 pt-5">
          <div className="rounded-[24px] bg-gradient-to-br from-brand-primary/5 to-amber-50 border border-brand-primary/15 p-5 text-center flex flex-col items-center gap-2">
            <EmojiIcon emoji="👋" size={28} className="text-brand-primary" />
            <p className="text-sm font-bold text-gray-900">처음이신가요?</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              샘플 데이터로 둘러보고, 마음에 들면 직접 등록해보세요.
            </p>
            <button
              onClick={() => {
                const n = loadSampleData();
                showToast(`샘플 ${n}개 불러왔어요. 설정에서 언제든 초기화할 수 있어요.`);
              }}
              className="mt-1 text-sm font-semibold px-4 py-2 rounded-full bg-brand-primary text-white hover:opacity-90 active:scale-95 transition-all"
            >
              🎯 샘플 데이터로 시작
            </button>
          </div>
        </div>
      )}

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
            <SectionErrorBoundary label="재구매 알림">
              <RebuyAlert items={items} />
            </SectionErrorBoundary>
            <SectionErrorBoundary label="시즌 옷장 정리">
              <SeasonChangeAlert items={items} />
            </SectionErrorBoundary>
            <SectionErrorBoundary label="제철 힌트">
              <SeasonalHintWidget items={items} />
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
          <SectionHeader title="이번 주" actionHref="/mypage?tab=overview#weekly-stats" actionLabel="더보기">
            <SectionErrorBoundary label="주간 인사이트">
              <WeeklyInsight items={items} />
            </SectionErrorBoundary>
          </SectionHeader>
        </div>
      )}
    </div>
  );
}
