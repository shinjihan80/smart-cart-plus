'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { isFoodItem, isClothingItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { calcRemainingDays } from '@/components/FoodTags';
import { Settings as SettingsIcon } from 'lucide-react';
import { type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import RecipeBrowserModal from '@/components/RecipeBrowserModal';
import EmojiIcon from '@/components/EmojiIcon';
import { useBackupStatus, downloadBackup } from '@/lib/backup';
import { useToast } from '@/context/ToastContext';
import { usePersistedState } from '@/lib/usePersistedState';

import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';
import StatsSection                              from '@/components/mypage/StatsSection';
import SpendingSection                           from '@/components/mypage/SpendingSection';
import MyFridgeSection                            from '@/components/mypage/MyFridgeSection';
import ShoppingListSection                       from '@/components/mypage/ShoppingListSection';
import ShoppingSuggestionsSection                 from '@/components/mypage/ShoppingSuggestionsSection';
import FavoriteRecipesSection                    from '@/components/mypage/FavoriteRecipesSection';
import WearStatsSection                          from '@/components/mypage/WearStatsSection';
import CookStatsSection                          from '@/components/mypage/CookStatsSection';
import ClosetCleanupSection                      from '@/components/mypage/ClosetCleanupSection';
import SeasonalStorageSection                    from '@/components/mypage/SeasonalStorageSection';
import PartnerRoadmapSection                     from '@/components/mypage/PartnerRoadmapSection';
import WaitlistBanner                            from '@/components/mypage/WaitlistBanner';
import ShoppingMallCard                           from '@/components/ShoppingMallCard';
import PaletteButton                              from '@/components/PaletteButton';
import AnnualSummarySection                       from '@/components/mypage/AnnualSummarySection';
import MonthlySummarySection                      from '@/components/mypage/MonthlySummarySection';
import WeeklySummarySection                       from '@/components/mypage/WeeklySummarySection';
import FrequentIngredientsSection                  from '@/components/mypage/FrequentIngredientsSection';
import SeasonalHistorySection                    from '@/components/mypage/SeasonalHistorySection';
import SectionErrorBoundary                      from '@/components/SectionErrorBoundary';
import PlanGate                                  from '@/components/PlanGate';
import { usePlan, PLAN_LABEL }                   from '@/lib/usePlan';

type MyTab = 'overview' | 'shopping' | 'closet' | 'cook';

const TABS: { id: MyTab; emoji: string; label: string }[] = [
  { id: 'overview', emoji: '📊', label: '요약' },
  { id: 'shopping', emoji: '🛒', label: '쇼핑' },
  { id: 'closet',   emoji: '👕', label: '옷장' },
  { id: 'cook',     emoji: '🍳', label: '요리' },
];

const isMyTab = (v: unknown): v is MyTab =>
  v === 'overview' || v === 'shopping' || v === 'closet' || v === 'cook';

export default function MyPage() {
  const { tier } = usePlan();
  const { items, archived, discardCount, discardHistory, addItems, restoreFromArchive } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggle } = useRecipeFavorites();
  const backup = useBackupStatus();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [browserOpen, setBrowserOpen]       = useState(false);
  const [archiveExpanded, setArchiveExpanded] = useState(false);
  const [activeTab, setActiveTab] = usePersistedState<MyTab>(
    'nemoa-mypage-tab', 'overview',
    (raw) => (isMyTab(raw) ? raw : null),
  );

  // ?tab=... 쿼리 또는 legacy 해시(#shopping 등)로 탭 초기화 — 외부 진입용
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('tab');
    if (requested && isMyTab(requested)) {
      if (requested !== activeTab) setActiveTab(requested);
      return;
    }
    // legacy 해시 — 마이페이지 v1.5 시절의 #shopping/#closet-cleanup/#cook-stats/#seasonal-hist 호환
    const hash = window.location.hash.replace('#', '');
    const HASH_TO_TAB: Record<string, MyTab> = {
      'shopping':       'shopping',
      'closet-cleanup': 'closet',
      'cook-stats':     'cook',
      'seasonal-hist':  'cook',
      // weekly-stats / partners는 항상 노출 영역 또는 overview 탭이라 매핑 불필요
    };
    const mapped = HASH_TO_TAB[hash];
    if (mapped && mapped !== activeTab) setActiveTab(mapped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 해시(#weekly-stats 등) 자동 스크롤 — 탭 전환 후 DOM 업데이트 완료를 기다린 뒤 1회 실행
  // 탭 전환은 useEffect 비동기라 native hash scroll이 그 시점엔 element를 못 찾음.
  // 두 번의 rAF로 React commit 후를 잡고, motion 애니메이션 보정용 setTimeout 200ms 폴백.
  const hashScrolledRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hashScrolledRef.current) return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      hashScrolledRef.current = true;
      return;
    }

    function tryScroll() {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        hashScrolledRef.current = true;
      }
    }

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(tryScroll);
    });
    const fallback = setTimeout(tryScroll, 200);
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      clearTimeout(fallback);
    };
  }, [activeTab]);

  const foodItemsList     = items.filter(isFoodItem);
  const clothingItemsList = items.filter(isClothingItem);

  const urgentCount = foodItemsList.filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length;
  const coldCount   = foodItemsList.filter((f) => f.storageType === '냉장').length;
  const frozenCount = foodItemsList.filter((f) => f.storageType === '냉동').length;
  const roomCount   = foodItemsList.filter((f) => f.storageType === '실온').length;

  function handleBackupNow() {
    const filename = downloadBackup();
    backup.refresh();
    showToast(`백업 완료 — ${filename}`);
  }

  return (
    <div>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">마이페이지</h1>
            <p className="text-sm text-gray-400 mt-0.5">통계 · 기록 · 리스트</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <PaletteButton />
            <Link
              href="/settings"
              aria-label="설정"
              className="w-10 h-10 flex items-center justify-center text-gray-900 hover:text-brand-primary transition-colors"
            >
              <SettingsIcon size={22} strokeWidth={2} />
            </Link>
          </div>
        </div>
        <div role="tablist" aria-label="마이페이지 탭" className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(t.id)}
                className={[
                  'shrink-0 text-sm font-semibold px-3 py-1.5 rounded-full transition-colors',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                ].join(' ')}
              >
                <span className="mr-1">{t.emoji}</span>{t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">
        {/* 프로필 카드 + 슬로건 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className={CARD}
          style={CARD_SHADOW}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
              <EmojiIcon emoji="👤" size={22} className="text-brand-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">네모아 사용자</p>
              <p className="text-xs text-gray-400 mt-0.5">{PLAN_LABEL[tier]} 플랜 · AI 비서 활성화</p>
            </div>
          </div>
          <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 tracking-wide text-center">
            <span className="font-semibold text-brand-primary">NEMOA</span> — 일상을 반듯하게 모으다
          </p>
        </motion.div>

        {/* 백업 상태 배너 (간단 버전 — 상세는 /settings) */}
        {backup.isStale && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.05 }}
            className="rounded-[28px] border px-4 py-3 flex items-center gap-3 bg-brand-warning/5 border-brand-warning/15"
          >
            <EmojiIcon emoji="💾" size={20} className="text-brand-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">
                {backup.lastBackupAt === null ? '아직 백업한 적 없어요' : `마지막 백업 ${backup.daysSince}일 전`}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">브라우저 캐시가 비면 데이터가 사라질 수 있어요.</p>
            </div>
            <button
              onClick={handleBackupNow}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90"
            >
              지금 백업
            </button>
          </motion.div>
        )}

        {/* ─── 탭별 섹션 ──────────────────────────────────── */}

        {activeTab === 'overview' && (
          <>
            <StatsSection
              items={items}
              foodItems={foodItemsList}
              clothingItems={clothingItemsList}
              urgentCount={urgentCount}
              discardCount={discardCount}
              coldCount={coldCount}
              frozenCount={frozenCount}
              roomCount={roomCount}
            />

            {/* 소진 히스토리 */}
            {discardHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.22 }}
                className={CARD}
                style={CARD_SHADOW}
              >
                <h3 className="text-xs text-gray-400 font-medium mb-2">최근 소진 내역</h3>
                <div className="flex flex-col gap-2">
                  {discardHistory.slice(0, 5).map((record, i) => (
                    <div key={`${record.name}-${i}`} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <EmojiIcon emoji={record.category === '식품' ? '🥦' : '👗'} size={14} className="text-gray-600" />
                        <span className="text-sm text-gray-700 truncate">{record.name}</span>
                      </div>
                      <span className="text-sm text-gray-400 tabular-nums shrink-0">{record.date}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <SectionErrorBoundary label="내 냉장고">
              <MyFridgeSection />
            </SectionErrorBoundary>

            <SectionErrorBoundary label="이번 주 활동">
              <PlanGate feature="이번 주 활동 리포트">
                <WeeklySummarySection discardHistory={discardHistory} />
              </PlanGate>
            </SectionErrorBoundary>

            <SectionErrorBoundary label="이번 달 활동">
              <PlanGate feature="이번 달 활동 리포트">
                <MonthlySummarySection discardHistory={discardHistory} />
              </PlanGate>
            </SectionErrorBoundary>

            <SectionErrorBoundary label="자주 구매하는 재료">
              <FrequentIngredientsSection
                discardHistory={discardHistory}
                currentItemNames={foodItemsList.map((f) => f.name)}
              />
            </SectionErrorBoundary>

            <SectionErrorBoundary label="올해 활동 요약">
              <PlanGate feature="올해 활동 연간 요약">
                <AnnualSummarySection discardHistory={discardHistory} />
              </PlanGate>
            </SectionErrorBoundary>

            {/* 아카이브 — 요약 탭 끝 (소진/복원 = 데이터 관리) */}
            {archived.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.29 }}
                className={CARD}
                style={CARD_SHADOW}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs text-gray-400 font-medium">아카이브 ({archived.length}개)</h3>
                  {archived.length > 5 && (
                    <button
                      onClick={() => setArchiveExpanded(!archiveExpanded)}
                      className="text-sm text-brand-primary font-semibold hover:underline"
                    >
                      {archiveExpanded ? '접기' : `전체 보기 (${archived.length})`}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {(archiveExpanded ? archived : archived.slice(0, 5)).map((item, i) => (
                    <div key={`${item.id}-${i}`} className="flex items-center justify-between py-1 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <EmojiIcon emoji={item.category === '식품' ? '🥦' : '👗'} size={14} className="text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-500 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-sm text-gray-300">{item.category}</span>
                        <button
                          onClick={() => {
                            const ok = restoreFromArchive(item.id);
                            if (ok) {
                              showToast(`"${item.name}" 복원했어요${item.category === '식품' ? ' (구매일 오늘로)' : ''}.`);
                            }
                          }}
                          className="text-sm font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 transition-colors"
                        >
                          복원
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {activeTab === 'shopping' && (
          <>
            <SpendingSection />

            <ShoppingMallCard
              domain="groceries"
              title="식품 쇼핑몰"
              subtitle="장보기 — 탭하면 새 창으로 이동"
              emoji="🥬"
            />

            <ShoppingMallCard
              domain="fashion"
              title="패션 쇼핑몰"
              subtitle="옷 사러 가기 — 탭하면 새 창으로 이동"
              emoji="👕"
            />

            <ShoppingMallCard
              domain="secondhand"
              title="중고 판매"
              subtitle="안 입는 옷 판매 — 당근·번개장터·KREAM"
              emoji="💰"
            />

            <ShoppingMallCard
              domain="donation"
              title="기부하기"
              subtitle="오래 안 입은 옷 따뜻하게 보내기"
              emoji="❤️"
            />

            <ShoppingMallCard
              domain="storage"
              title="짐 보관 서비스"
              subtitle="계절 옷 잠깐 빼두기 — 세탁특공대·다락"
              emoji="📦"
            />

            <SectionErrorBoundary label="장볼 거 추천">
              <ShoppingSuggestionsSection
                items={items}
                discardHistory={discardHistory}
                showToast={showToast}
              />
            </SectionErrorBoundary>

            <SectionErrorBoundary label="쇼핑 리스트">
              <ShoppingListSection addItems={addItems} showToast={showToast} />
            </SectionErrorBoundary>

            <SectionErrorBoundary label="파트너 로드맵">
              <PartnerRoadmapSection />
            </SectionErrorBoundary>
          </>
        )}

        {activeTab === 'closet' && (
          <>
            <SectionErrorBoundary label="착용 로그 분석">
              <PlanGate feature="착용 로그 분석">
                <WearStatsSection items={items} />
              </PlanGate>
            </SectionErrorBoundary>

            <SectionErrorBoundary label="계절 보관">
              <SeasonalStorageSection items={items} />
            </SectionErrorBoundary>

            <SectionErrorBoundary label="옷장 정리 제안">
              <ClosetCleanupSection items={items} />
            </SectionErrorBoundary>
          </>
        )}

        {activeTab === 'cook' && (
          <>
            <SectionErrorBoundary label="조리 로그 분석">
              <PlanGate feature="조리 로그 분석">
                <CookStatsSection onOpenRecipe={setSelectedRecipe} />
              </PlanGate>
            </SectionErrorBoundary>

            <SectionErrorBoundary label="제철 식탁 히스토리">
              <SeasonalHistorySection history={discardHistory} />
            </SectionErrorBoundary>

            <SectionErrorBoundary label="즐겨찾기 레시피">
              <FavoriteRecipesSection
                onOpenRecipe={setSelectedRecipe}
                onOpenBrowser={() => setBrowserOpen(true)}
              />
            </SectionErrorBoundary>
          </>
        )}

        {/* ─── 탭과 무관하게 항상 노출 ────────────────── */}

        <WaitlistBanner />

        {/* 설정 진입 링크 (하단) */}
        <Link
          href="/settings"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-gray-100 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <SettingsIcon size={14} />
          <span>알림 · 백업 · 내보내기 설정</span>
        </Link>
      </div>

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          isFavorite={isFavorite(selectedRecipe.id)}
          onToggleFavorite={() => toggle(selectedRecipe.id)}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {browserOpen && (
        <RecipeBrowserModal
          onSelect={(recipe) => {
            setBrowserOpen(false);
            setSelectedRecipe(recipe);
          }}
          onClose={() => setBrowserOpen(false)}
        />
      )}
    </div>
  );
}
