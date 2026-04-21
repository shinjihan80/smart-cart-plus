'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { exportAsJSON, exportAsCSV } from '@/lib/exportUtils';
import {
  useBackupStatus, downloadBackup, readBackupFile, applyNonCartFromSnapshot,
} from '@/lib/backup';

import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';
import NotificationSettings from '@/components/mypage/NotificationSettings';
import AppInfo              from '@/components/mypage/AppInfo';
import ProfilesSection      from '@/components/settings/ProfilesSection';
import KnowledgeSummary     from '@/components/settings/KnowledgeSummary';
import PaletteButton        from '@/components/PaletteButton';

export default function SettingsPage() {
  const { items, resetData, archiveExpired, restoreAll } = useCart();
  const { showToast } = useToast();
  const backup = useBackupStatus();
  const fileRef = useRef<HTMLInputElement | null>(null);

  function handleReset() {
    if (confirm('모든 데이터를 초기화하시겠어요? 기본 샘플 데이터로 복원됩니다.')) {
      resetData();
      showToast('데이터가 초기화됐어요.');
    }
  }

  /** 안전한 초기화 — 백업 다운로드 후 전체 초기화. 복원 가능한 지점 확보. */
  function handleBackupAndReset() {
    if (!confirm('전체 상태를 백업한 뒤 데이터를 초기화할까요?\n\n1) JSON 백업 파일이 다운로드됩니다.\n2) 확인되면 샘플 데이터로 복원됩니다.')) return;
    try {
      const filename = downloadBackup();
      backup.refresh();
      // 다운로드 시작은 즉시, 파일 저장은 브라우저가 비동기로 처리 — 짧은 지연 후 초기화
      setTimeout(() => {
        resetData();
        showToast(`백업 저장(${filename}) + 초기화 완료`);
      }, 300);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      showToast(`백업 실패 — 초기화 중단: ${msg}`);
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
      if (Array.isArray(snap.profiles) && snap.profiles.length > 0) {
        summary.push(`프로필 ${snap.profiles.length}명`);
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

  function handleClearPreferences() {
    // 아이템/로그/백업 관련 핵심 데이터 키 (nemoa- 프리픽스) — 보존
    const PROTECTED_NEMOA = new Set([
      'nemoa-wear-log',        // 착용 로그
      'nemoa-cook-log',        // 조리 로그
      'nemoa-profiles',        // 프로필
      'nemoa-shopping-list',   // 쇼핑 리스트
      'nemoa-recipe-favorites',// 즐겨찾기 레시피
      'nemoa-last-backup-at',  // 백업 타임스탬프
      'nemoa-weather-cache',   // 날씨 캐시 (30분 만료 — 굳이 비울 필요 없음)
    ]);
    const toClear: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nemoa-') && !PROTECTED_NEMOA.has(key)) toClear.push(key);
    }
    if (toClear.length === 0) {
      showToast('이미 초기화된 상태예요.');
      return;
    }
    if (!confirm(`검색어·필터·접기 상태 ${toClear.length}개를 초기화할까요? (아이템·로그·프로필은 유지돼요)`)) return;
    for (const k of toClear) localStorage.removeItem(k);
    showToast(`${toClear.length}개 설정이 초기화됐어요. 페이지를 새로고침하세요.`);
  }

  const menuItems = [
    { label: '만료 식품 정리',  emoji: '📦', desc: '보관 기한 +7일 초과 항목 아카이브',  action: handleArchive },
    { label: '지금 백업하기',   emoji: '💾', desc: '전체 상태를 JSON으로 다운로드',       action: handleBackupNow },
    { label: '백업에서 복원',   emoji: '📥', desc: '이전 백업 JSON 파일 불러오기',       action: handlePickRestoreFile },
    { label: 'JSON 내보내기',   emoji: '📄', desc: '현재 아이템만 JSON으로 내보내기',   action: handleExportJSON },
    { label: 'CSV 내보내기',    emoji: '📊', desc: '현재 아이템만 CSV로 내보내기',      action: handleExportCSV },
    { label: '검색어·필터 초기화', emoji: '🧹', desc: '최근 검색어·필터·정렬 설정 비우기',  action: handleClearPreferences },
    { label: '백업 후 초기화',   emoji: '🛡️', desc: '자동 백업 → 샘플 데이터로 안전 초기화',  action: handleBackupAndReset },
    { label: '전체 데이터 초기화', emoji: '🔄', desc: '샘플 데이터로 복원 (주의: 아이템 삭제)', action: handleReset },
  ];

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <Link
            href="/mypage"
            aria-label="뒤로"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">설정</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">알림 · 백업 · 데이터 관리</p>
          </div>
          <PaletteButton />
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">
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

        <ProfilesSection />

        <NotificationSettings />

        {/* 설정 메뉴 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <h3 className="text-xs text-gray-400 font-medium mb-2">데이터 관리</h3>
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

        <KnowledgeSummary />

        <AppInfo />
      </div>

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
