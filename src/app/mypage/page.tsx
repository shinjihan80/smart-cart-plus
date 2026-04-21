'use client';

import { useState } from 'react';
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
import { useBackupStatus, downloadBackup } from '@/lib/backup';
import { useToast } from '@/context/ToastContext';

import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';
import StatsSection                              from '@/components/mypage/StatsSection';
import SpendingSection                           from '@/components/mypage/SpendingSection';
import ShoppingListSection                       from '@/components/mypage/ShoppingListSection';
import ShoppingSuggestionsSection                 from '@/components/mypage/ShoppingSuggestionsSection';
import FavoriteRecipesSection                    from '@/components/mypage/FavoriteRecipesSection';
import WearStatsSection                          from '@/components/mypage/WearStatsSection';
import CookStatsSection                          from '@/components/mypage/CookStatsSection';
import ClosetCleanupSection                      from '@/components/mypage/ClosetCleanupSection';
import SeasonalStorageSection                    from '@/components/mypage/SeasonalStorageSection';
import PartnerRoadmapSection                     from '@/components/mypage/PartnerRoadmapSection';
import SeasonalHistorySection                    from '@/components/mypage/SeasonalHistorySection';
import SectionErrorBoundary                      from '@/components/SectionErrorBoundary';

export default function MyPage() {
  const { items, archived, discardCount, discardHistory, addItems } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggle } = useRecipeFavorites();
  const backup = useBackupStatus();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [browserOpen, setBrowserOpen]       = useState(false);

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
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">마이페이지</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">통계 · 기록 · 리스트</p>
          </div>
          <Link
            href="/settings"
            aria-label="설정"
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <SettingsIcon size={16} />
          </Link>
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">
        {/* 프로필 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className={`${CARD} flex items-center gap-4`}
          style={CARD_SHADOW}
        >
          <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">네모아 사용자</p>
            <p className="text-xs text-gray-400 mt-0.5">Pro 플랜 · AI 비서 활성화</p>
          </div>
        </motion.div>

        {/* 백업 상태 배너 (간단 버전 — 상세는 /settings) */}
        {backup.isStale && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.05 }}
            className="rounded-[28px] border px-4 py-3 flex items-center gap-3 bg-brand-warning/5 border-brand-warning/15"
          >
            <span className="text-xl shrink-0">💾</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">
                {backup.lastBackupAt === null ? '아직 백업한 적 없어요' : `마지막 백업 ${backup.daysSince}일 전`}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">브라우저 캐시가 비면 데이터가 사라질 수 있어요.</p>
            </div>
            <button
              onClick={handleBackupNow}
              className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90"
            >
              지금 백업
            </button>
          </motion.div>
        )}

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
                    <span className="text-sm">{record.category === '식품' ? '🥦' : '👗'}</span>
                    <span className="text-sm text-gray-700 truncate">{record.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{record.date}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <SpendingSection />

        {/* 쇼핑몰 연동 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.28 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <h3 className="text-xs text-gray-400 font-medium mb-3">쇼핑몰 자동 연동</h3>
          <div className="flex flex-col gap-2.5">
            {[
              { name: '쿠팡',     mallBg: 'bg-mall-coupang',    status: '준비 중' },
              { name: '네이버',   mallBg: 'bg-mall-naver',      status: '준비 중' },
              { name: '마켓컬리', mallBg: 'bg-mall-kurly',      status: '준비 중' },
              { name: '무신사',   mallBg: 'bg-mall-musinsa',    status: '준비 중' },
            ].map((mall) => (
              <div key={mall.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${mall.mallBg} flex items-center justify-center`}>
                    <span className="text-white text-[9px] font-bold">{mall.name.charAt(0)}</span>
                  </div>
                  <span className="text-sm text-gray-700">{mall.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {mall.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
            이메일 파싱으로 구매 내역을 자동 가져오는 기능이 곧 추가됩니다.
          </p>
        </motion.div>

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

        <SectionErrorBoundary label="착용 로그 분석">
          <WearStatsSection items={items} />
        </SectionErrorBoundary>

        <SectionErrorBoundary label="계절 보관">
          <SeasonalStorageSection items={items} />
        </SectionErrorBoundary>

        <SectionErrorBoundary label="옷장 정리 제안">
          <ClosetCleanupSection items={items} />
        </SectionErrorBoundary>

        <SectionErrorBoundary label="조리 로그 분석">
          <CookStatsSection onOpenRecipe={setSelectedRecipe} />
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

        <SectionErrorBoundary label="파트너 로드맵">
          <PartnerRoadmapSection />
        </SectionErrorBoundary>

        {/* 아카이브 */}
        {archived.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.29 }}
            className={CARD}
            style={CARD_SHADOW}
          >
            <h3 className="text-xs text-gray-400 font-medium mb-2">아카이브 ({archived.length}개)</h3>
            <div className="flex flex-col gap-1.5">
              {archived.slice(0, 5).map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.category === '식품' ? '🥦' : '👗'}</span>
                    <span className="text-sm text-gray-500 truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-300">{item.category}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
