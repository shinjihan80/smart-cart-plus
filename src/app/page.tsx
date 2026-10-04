'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import NemoaLogo from '@/components/layout/NemoaLogo';
import EmojiIcon from '@/components/EmojiIcon';
import { useSessionPing } from '@/lib/analytics';
import { flushPartnerClicksIfDue } from '@/lib/partnerClickLog';
import { selectExpiring } from '@/lib/expirySelectors';
import { useNotificationLog } from '@/lib/notificationLog';
import type { DailyMessage } from '@/lib/dailyMessage';

import { HomeSkeleton } from '@/components/home/shared';
import HeroMessage     from '@/components/home/HeroMessage';
import SectionHeader   from '@/components/home/SectionHeader';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import UrgentAlert     from '@/components/home/UrgentAlert';
import NotificationOffBanner from '@/components/home/NotificationOffBanner';
import TodoEmptyState  from '@/components/home/TodoEmptyState';
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
  // 히어로가 headline으로 짚은 품목 — 바로 아래 "오늘 할 일" 카드들이 같은
  // 품목을 다시 보여주지 않도록 제외 처리한다(P1-51 렌더 단계 품목 중복배제).
  const [heroDriverName, setHeroDriverName] = useState<string | undefined>(undefined);
  const handleHeroMessage = useCallback((msg: DailyMessage) => {
    setHeroDriverName(msg.driverName);
  }, []);
  // 벨의 점 = 안 읽은 알림 개수(/notifications 목록 기준). 예전엔 "알림 권한이
  // 꺼져 있음"을 점으로 표시했는데, 눌러보면 알림함이 아니라 설정으로 가고
  // 읽을 게 없어 "새 소식 있음"으로 오독됐다(검토단 C1/C4·전문단 E1 발견).
  // 권한 꺼짐 안내는 이제 /notifications 안의 배너로 옮겼다.
  const { unreadCount } = useNotificationLog();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  // 일일 익명 파트너 클릭 집계 flush — opt-in (analytics enabled) 사용자만 어제 데이터 전송
  useEffect(() => {
    flushPartnerClicksIfDue();
  }, []);

  // 긴급 알림(UrgentAlert)이 이미 보여준 "오늘까지" 품목 이름 — 바로 아래
  // 제철 식탁(SeasonalHintWidget)에서 같은 품목을 "여유 있게" 다시 보여주는
  // 모순된 중복 노출을 막는다. 히어로의 headline 품목도 함께 제외(P1-51).
  //
  // 예전엔 이 히어로 dedup을 UrgentAlert·RebuyAlert("오늘 할 일" 액션
  // 존)에도 똑같이 적용했는데(heroExcludeNames), 그 결과 히어로가 유일한
  // 진짜 긴급 품목을 headline으로 가져가면 "오늘 할 일" 목록에서 그 품목이
  // 통째로 사라졌다 — 히어로는 배너 블라인드니스가 걸리는 자리라(C1: "광고로
  // 오인해 넘김") 거기 안에만 있으면 사실상 안 보인 것과 같은데, 가장 급한
  // 품목이 액션 존에서도 사라져버렸다(P1-67, C1·C8 독립 지적, E1 코드 지점
  // 확정). dedup은 "오늘까지 vs 여유있게"처럼 실제 모순이 생기는 하위 추천
  // 존(SeasonalHintWidget)에만 남기고, 액션 존에는 적용하지 않는다.
  const urgentTodayNames = new Set(selectExpiring(items).today.map((e) => e.item.name));
  const seasonalExcludeNames = heroDriverName
    ? new Set([...urgentTodayNames, heroDriverName])
    : urgentTodayNames;

  return (
    <div>
      {/* 헤더 — 로고 + 알림·프로필 (검색은 마이페이지에서) */}
      <header className="sticky top-0 w-screen ml-[calc(50%-50vw)] z-20 bg-white/95 backdrop-blur-md border-b border-gray-50">
        <div className="max-w-md min-[700px]:max-w-[680px] min-[1000px]:max-w-[880px] mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <NemoaLogo size="md" />
          <div className="flex items-center -mr-1">
            <Link
              href="/notifications"
              aria-label={unreadCount > 0 ? `알림 — 안 읽은 알림 ${unreadCount}개` : '알림'}
              className="relative w-10 h-10 flex items-center justify-center text-brand-ink hover:text-brand-primary transition-colors"
            >
              <Bell size={22} strokeWidth={2} />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-primary ring-2 ring-white"
                />
              )}
            </Link>
            <Link
              href="/mypage"
              aria-label="내 정보"
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
              냉장고에 있는 것 하나만 등록해보면 감이 와요.
            </p>
            {/* 1순위 CTA는 '첫 등록' — 샘플은 아래 텍스트 링크로 강등 (P1-13) */}
            <button
              onClick={() => window.dispatchEvent(new Event('nemoa:open-register'))}
              className="mt-1 text-sm font-semibold px-4 py-2 rounded-full bg-brand-primary text-white hover:opacity-90 active:scale-95 transition-all"
            >
              첫 항목 등록하기
            </button>
            <button
              onClick={() => {
                const n = loadSampleData();
                showToast(`샘플 ${n}개 불러왔어요. 설정에서 언제든 초기화할 수 있어요.`);
              }}
              className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 mt-0.5"
            >
              샘플 데이터로 먼저 둘러보기
            </button>
          </div>
        </div>
      )}

      {/* Hero — 네모아의 오늘 한 마디. 아래 "오늘 할 일" 카드들의 headline
          역할이라 3존 재편성(P1-52)에서도 항상 맨 위에 고정한다. */}
      <div className="px-5 pt-5">
        <SectionErrorBoundary label="오늘 한 마디">
          <HeroMessage items={items} discardHistory={discardHistory} onMessage={handleHeroMessage} />
        </SectionErrorBoundary>
      </div>

      {/* "오늘 할 일" — 임박·재구매·시즌옷장 (예전 "지금 바로"). localStorage
          기반 dismiss 상태를 읽는 카드들이라 마운트 후에만 그린다(SSR 불일치
          방지, 기존 ready 게이트 유지) — 3존 재편성(P1-52)에서 히어로 바로
          다음, 카테고리 그리드보다 앞으로 옮겨 가장 시급한 정보를 첫 화면에
          들어오게 한다. 예전엔 이 자리에 무행동 카테고리 그리드가 있어
          "오늘 할 일"이 두 번째 스크롤에야 나왔다(C2·C6·E1 발견). */}
      {!ready ? (
        <HomeSkeleton />
      ) : (
        <div className="px-5 pb-2">
          <SectionHeader title="오늘 할 일" actionHref="/fridge" actionLabel="냉장고">
            <TodoEmptyState>
              {/* 알림이 꺼진 채 오늘 임박 식품이 있으면 최상단에 — 알림함
                  안으로만 옮겨졌던 "권한 꺼짐" 신호가 정작 알림함에 들어갈
                  이유가 없는 사용자에게 전혀 닿지 않던 문제(P1-61①, C1·
                  C4·C9 3인 독립 지적 + E1 "리텐션 관점 단일 최대 누수 지점"). */}
              <SectionErrorBoundary label="알림 꺼짐 안내">
                <NotificationOffBanner items={items} />
              </SectionErrorBoundary>
              <SectionErrorBoundary label="임박 식품">
                <UrgentAlert items={items} />
              </SectionErrorBoundary>
              <SectionErrorBoundary label="재구매 알림">
                <RebuyAlert items={items} />
              </SectionErrorBoundary>
              <SectionErrorBoundary label="시즌 옷장 정리">
                <SeasonChangeAlert items={items} />
              </SectionErrorBoundary>
            </TodoEmptyState>
          </SectionHeader>
        </div>
      )}

      {/* 카테고리 아이콘 그리드 — 탐색 진입점. props만으로 그려 ready 게이트가
          필요 없다(원래도 그랬다) — "오늘 할 일" 바로 다음이라 긴급한 게
          없는 날에도 스크롤 한 번 안에 닿는다. */}
      <div className="px-5 pt-6 pb-2">
        <SectionErrorBoundary label="카테고리">
          <QuickLinks items={items} history={discardHistory} />
        </SectionErrorBoundary>
      </div>

      {/* 3존 배치 규칙(P1-57④) — 시급(지금 처리 안 하면 손해) → "오늘 할 일",
          제안(둘러보되 급하진 않음) → "오늘의 추천", 기록·회고(지난 걸
          돌아봄) → "둘러보기". 경고·긴급 문구는 "오늘 할 일"에만 둔다 —
          "둘러보기"(가장 한가로운 이름)에 "⚠️ 만료 임박"이 들어가
          구경거리로 오인됐던 사례(P1-57) 재발 방지. */}
      {ready && (
        <div className="px-5 pb-10">
          {/* 오늘의 추천 — 제철 식탁·식사·옷차림 추천 (예전 "오늘의 나").
              제목·액션("전체 레시피"→/fridge)·내용(제철+레시피+옷차림
              4종)이 서로 다른 걸 가리켜 5초 안에 의미가 안 읽혔다(P1-55,
              C9·E1 "계약 위반"). 섹션 전체를 대표하는 단일 액션을 없애고
              (카드별로 이미 각자 링크가 있음) 제목을 내용에 맞게 수정. */}
          <SectionHeader title="오늘의 추천">
            <SectionErrorBoundary label="제철 힌트">
              <SeasonalHintWidget items={items} excludeNames={seasonalExcludeNames} />
            </SectionErrorBoundary>
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

          {/* 둘러보기 — 한 줄 요약 (예전 "이번 주") */}
          <SectionHeader title="둘러보기" actionHref="/mypage?tab=activity#weekly-stats" actionLabel="더보기">
            <SectionErrorBoundary label="주간 인사이트">
              <WeeklyInsight items={items} />
            </SectionErrorBoundary>
          </SectionHeader>
        </div>
      )}
    </div>
  );
}
