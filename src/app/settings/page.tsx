'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertTriangle, Cloud } from 'lucide-react';
import type { CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseEnabled } from '@/lib/supabase';
import { exportAsJSON, exportAsCSV } from '@/lib/exportUtils';
import {
  useBackupStatus, downloadBackup, readBackupFile, applyNonCartFromSnapshot,
} from '@/lib/backup';

import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';
import NotificationSettings from '@/components/mypage/NotificationSettings';
import AppInfo              from '@/components/mypage/AppInfo';
import FeedbackToggles      from '@/components/settings/FeedbackToggles';
import PaletteButton        from '@/components/PaletteButton';
import EmojiIcon            from '@/components/EmojiIcon';
import LoginSheet           from '@/components/auth/LoginSheet';

export default function SettingsPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const { user } = useAuth();
  const { items, resetData, restoreAll } = useCart();
  const { showToast } = useToast();
  const backup = useBackupStatus();
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  /** 항상 백업을 먼저 받은 뒤 전체 초기화 — 복원 가능한 지점 확보 */
  function handleReset() {
    if (!confirm('모든 데이터를 초기화할까요?\n\n1) 현재 상태가 JSON으로 백업됩니다.\n2) 백업 완료 후 앱이 초기 상태로 돌아갑니다.')) return;
    try {
      const filename = downloadBackup();
      backup.refresh();
      setTimeout(() => {
        resetData();
        showToast(`백업(${filename}) 저장 후 초기화됐어요.`);
      }, 300);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      showToast(`백업 실패 — 초기화 중단: ${msg}`);
    }
  }

  const dataItems = [
    { label: '지금 백업하기',  emoji: '💾', desc: '전체 상태를 JSON 파일로 저장',     action: handleBackupNow },
    { label: '백업에서 복원',  emoji: '📥', desc: '이전 백업 파일로 데이터 복구',     action: handlePickRestoreFile },
    { label: 'JSON 내보내기', emoji: '📄', desc: '현재 아이템 목록을 JSON으로 내보내기', action: handleExportJSON },
    { label: 'CSV 내보내기',  emoji: '📊', desc: '현재 아이템 목록을 CSV로 내보내기',  action: handleExportCSV },
  ];

  return (
    <div>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-50">
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
            <p className="text-sm text-gray-400 mt-0.5">알림 · 백업 · 내보내기</p>
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
          <EmojiIcon emoji={backup.isStale ? '💾' : '✅'} size={20} className={backup.isStale ? 'text-brand-warning shrink-0' : 'text-brand-success shrink-0'} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800">
              {backup.isStale
                ? (backup.lastBackupAt === null ? '아직 백업한 적 없어요' : `마지막 백업 ${backup.daysSince}일 전`)
                : `백업 ${backup.daysSince}일 전`}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
              {backup.isStale
                ? '브라우저 캐시가 비면 데이터가 사라질 수 있어요. 지금 백업해두세요.'
                : '데이터가 안전하게 보관 중이에요.'}
            </p>
          </div>
          <button
            onClick={handleBackupNow}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90 transition-opacity"
          >
            지금 백업
          </button>
        </motion.div>

        {/* 프로필은 마이페이지 > 사용자 탭에서 관리 */}
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="👤" size={16} className="text-gray-600" />
          <span className="text-base font-bold text-gray-900 tracking-tight">프로필 관리</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.06 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">이름·신체·식습관·아바타 수정</p>
            <Link
              href="/mypage"
              className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              마이페이지 <ChevronRight size={12} />
            </Link>
          </div>
        </motion.div>

        {/* 클라우드 동기화 */}
        <div className="flex items-center gap-2">
          <Cloud size={16} className="text-gray-600" />
          <span className="text-base font-bold text-gray-900 tracking-tight">클라우드 동기화</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.07 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <button
            onClick={() => setLoginOpen(true)}
            className="flex items-center gap-3 w-full py-1 text-left"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${user ? 'bg-brand-success/10' : 'bg-gray-100'}`}>
              <Cloud size={18} className={user ? 'text-brand-success' : 'text-gray-400'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {user ? '동기화 켜짐' : (isSupabaseEnabled ? '로그인하여 동기화 시작' : '동기화 준비 중')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {user ? user.email ?? '로그인됨' : '모든 기기에서 같은 데이터를 사용할 수 있어요'}
              </p>
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          </button>
        </motion.div>

        <NotificationSettings />

        {/* 백업 & 내보내기 */}
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="📦" size={16} className="text-gray-600" />
          <span className="text-base font-bold text-gray-900 tracking-tight">백업 & 내보내기</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <div className="divide-y divide-gray-50">
            {dataItems.map((m) => (
              <button
                key={m.label}
                onClick={m.action}
                className="flex items-center gap-3 w-full py-3 text-left hover:bg-gray-50/50 -mx-2 px-2 rounded-2xl transition-colors"
              >
                <EmojiIcon emoji={m.emoji} size={16} className="text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{m.label}</p>
                  <p className="text-sm text-gray-400">{m.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* 앱 */}
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="📱" size={16} className="text-gray-600" />
          <span className="text-base font-bold text-gray-900 tracking-tight">앱</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.12 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('nemoa:replay-onboarding'))}
            className="flex items-center gap-3 w-full py-3 text-left hover:bg-gray-50/50 -mx-2 px-2 rounded-2xl transition-colors"
          >
            <EmojiIcon emoji="🎓" size={16} className="text-gray-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">온보딩 다시 보기</p>
              <p className="text-sm text-gray-400">네모아 소개 7단계 재생</p>
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          </button>
        </motion.div>

        <FeedbackToggles />

        {/* 위험 구역 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.14 }}
          className="rounded-[28px] border border-brand-warning/20 bg-brand-warning/3 px-4 py-4"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} className="text-brand-warning" />
            <h3 className="text-xs text-brand-warning font-semibold">위험 구역</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">아래 작업은 되돌리기 어려워요. 백업 후 진행을 권장합니다.</p>
          <button
            onClick={handleReset}
            className="flex items-center gap-3 w-full py-2.5 text-left hover:bg-brand-warning/5 -mx-2 px-2 rounded-2xl transition-colors"
          >
            <EmojiIcon emoji="🔄" size={16} className="text-brand-warning" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-warning">전체 초기화</p>
              <p className="text-sm text-gray-400">자동 백업 후 모든 데이터 삭제</p>
            </div>
          </button>
        </motion.div>

        <AppInfo />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleRestoreFile}
        className="hidden"
      />

      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
