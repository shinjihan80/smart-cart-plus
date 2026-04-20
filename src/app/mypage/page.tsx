'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { isFoodItem, isClothingItem } from '@/types';
import type { CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { calcRemainingDays } from '@/components/FoodTags';
import { ChevronRight } from 'lucide-react';
import { exportAsJSON, exportAsCSV } from '@/lib/exportUtils';
import { type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import RecipeBrowserModal from '@/components/RecipeBrowserModal';
import {
  useBackupStatus, downloadBackup, readBackupFile, applyNonCartFromSnapshot,
} from '@/lib/backup';

import { springTransition, CARD, CARD_SHADOW }   from '@/components/mypage/shared';
import StatsSection                               from '@/components/mypage/StatsSection';
import SpendingSection                            from '@/components/mypage/SpendingSection';
import ShoppingListSection                        from '@/components/mypage/ShoppingListSection';
import FavoriteRecipesSection                     from '@/components/mypage/FavoriteRecipesSection';
import NotificationSettings                       from '@/components/mypage/NotificationSettings';
import AppInfo                                    from '@/components/mypage/AppInfo';
import WearStatsSection                           from '@/components/mypage/WearStatsSection';

export default function MyPage() {
  const { items, archived, discardCount, discardHistory, resetData, archiveExpired, addItems, restoreAll } = useCart();
  const backup = useBackupStatus();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();
  const { isFavorite, toggle } = useRecipeFavorites();
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

  function handleReset() {
    if (confirm('모든 데이터를 초기화하시겠어요? 기본 샘플 데이터로 복원됩니다.')) {
      resetData();
      showToast('데이터가 초기화됐어요.');
    }
  }

  function handleArchive() {
    const count = archiveExpired();
    if (count > 0) showToast(`${count}개 만료 식품이 아카이브됐어요.`);
    else showToast('아카이브할 만료 식품이 없어요.');
  }

  function handleExportJSON() {
    exportAsJSON(items);
    showToast('JSON 파일로 내보냈어요.');
  }

  function handleExportCSV() {
    exportAsCSV(items);
    showToast('CSV 파일로 내보냈어요.');
  }

  function handleBackupNow() {
    const filename = downloadBackup();
    backup.refresh();
    showToast(`백업 완료 — ${filename}`);
  }

  function handlePickRestoreFile() {
    fileRef.current?.click();
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const snap = await readBackupFile(file);
      const summary: string[] = [];
      if (Array.isArray(snap.items))     summary.push(`아이템 ${snap.items.length}개`);
      if (Array.isArray(snap.favorites)) summary.push(`즐겨찾기 ${snap.favorites.length}개`);
      if (Array.isArray(snap.shopping))  summary.push(`쇼핑 리스트 ${snap.shopping.length}개`);
      if (snap.wearLog && typeof snap.wearLog === 'object' && !Array.isArray(snap.wearLog)) {
        const wearCount = Object.keys(snap.wearLog as Record<string, unknown>).length;
        if (wearCount > 0) summary.push(`착용 로그 ${wearCount}벌`);
      }
      if (snap.cookLog && typeof snap.cookLog === 'object' && !Array.isArray(snap.cookLog)) {
        const cookCount = Object.keys(snap.cookLog as Record<string, unknown>).length;
        if (cookCount > 0) summary.push(`조리 로그 ${cookCount}개`);
      }
      if (!confirm(`백업을 복원할까요?\n생성: ${new Date(snap.createdAt).toLocaleString('ko-KR')}\n${summary.join(' · ')}\n\n현재 데이터는 모두 덮어쓰여요.`)) return;

      restoreAll({
        items:          snap.items    as CartItem[] | undefined,
        archived:       snap.archived as CartItem[] | undefined,
        discardCount:   snap.discard?.count,
        discardHistory: snap.discard?.history as { name: string; category: string; date: string }[] | undefined,
      });
      applyNonCartFromSnapshot(snap);
      backup.refresh();
      showToast('백업에서 복원됐어요.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      showToast(`복원 실패: ${msg}`);
    }
  }

  const menuItems = [
    { label: '만료 식품 정리',  emoji: '📦', desc: '보관 기한 +7일 초과 항목 아카이브',  action: handleArchive },
    { label: '지금 백업하기',   emoji: '💾', desc: '전체 상태를 JSON으로 다운로드',       action: handleBackupNow },
    { label: '백업에서 복원',   emoji: '📥', desc: '이전 백업 JSON 파일 불러오기',       action: handlePickRestoreFile },
    { label: 'JSON 내보내기',   emoji: '📄', desc: '현재 아이템만 JSON으로 내보내기',   action: handleExportJSON },
    { label: 'CSV 내보내기',    emoji: '📊', desc: '현재 아이템만 CSV로 내보내기',      action: handleExportCSV },
    { label: '데이터 초기화',   emoji: '🔄', desc: '샘플 데이터로 복원',                action: handleReset },
  ];

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">마이페이지</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">통계 및 설정</p>
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

        {/* 백업 상태 배너 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.05 }}
          className={`rounded-[28px] border px-4 py-3 flex items-center gap-3 ${
            backup.isStale
              ? 'bg-brand-warning/5 border-brand-warning/15'
              : 'bg-brand-success/5 border-brand-success/15'
          }`}
        >
          <span className="text-xl shrink-0">{backup.isStale ? '💾' : '✅'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800">
              {backup.isStale
                ? (backup.lastBackupAt === null ? '아직 백업한 적 없어요' : `마지막 백업 ${backup.daysSince}일 전`)
                : `백업 ${backup.daysSince}일 전`}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
              {backup.isStale
                ? '브라우저 캐시가 비면 데이터가 사라질 수 있어요. 지금 백업해두세요.'
                : '데이터가 안전하게 보관 중이에요.'}
            </p>
          </div>
          <button
            onClick={handleBackupNow}
            className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90 transition-opacity"
          >
            지금 백업
          </button>
        </motion.div>

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

        <ShoppingListSection addItems={addItems} showToast={showToast} />

        <WearStatsSection items={items} />

        <FavoriteRecipesSection
          onOpenRecipe={setSelectedRecipe}
          onOpenBrowser={() => setBrowserOpen(true)}
        />

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

        <NotificationSettings />

        {/* 설정 메뉴 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.3 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <h3 className="text-xs text-gray-400 font-medium mb-2">설정</h3>
          <div className="divide-y divide-gray-50">
            {menuItems.map((m) => (
              <button
                key={m.label}
                onClick={m.action}
                className="flex items-center gap-3 w-full py-3 text-left hover:bg-gray-50/50 -mx-2 px-2 rounded-2xl transition-colors"
              >
                <span className="text-base">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{m.label}</p>
                  <p className="text-[10px] text-gray-400">{m.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>

        <AppInfo />
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

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleRestoreFile}
        className="hidden"
      />
    </div>
  );
}
