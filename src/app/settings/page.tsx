'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, AlertTriangle, Cloud,
  Loader2, Save, CheckCircle2, User, Package, Smartphone, GraduationCap, RotateCcw,
  Download, FileText, BarChart3, type LucideIcon,
} from 'lucide-react';
import type { CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseEnabled } from '@/lib/supabase';
import { exportAsJSON, exportAsCSV } from '@/lib/exportUtils';
import {
  useBackupStatus, downloadBackup, readBackupFile, applyNonCartFromSnapshot, daysAgoLabel,
} from '@/lib/backup';

import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';
import NotificationSettings from '@/components/mypage/NotificationSettings';
import AppInfo              from '@/components/mypage/AppInfo';
import FeedbackToggles      from '@/components/settings/FeedbackToggles';
import StorageUsage         from '@/components/settings/StorageUsage';
import ErrorLogCard         from '@/components/settings/ErrorLogCard';
import PaletteButton        from '@/components/PaletteButton';
import LoginSheet           from '@/components/auth/LoginSheet';
import UpgradeSheet         from '@/components/settings/UpgradeSheet';
import ResetConfirmSheet    from '@/components/settings/ResetConfirmSheet';
import AutoSnapshotRecoveryCard from '@/components/settings/AutoSnapshotRecoveryCard';
import { usePlan }          from '@/lib/usePlan';

export default function SettingsPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const { user } = useAuth();
  const { isPro } = usePlan();
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
    // Pro인데 아직 로그인 전이면 파일 백업 대신 로그인부터 유도 (로그인하면
    // SyncBridge가 자동으로 서버와 동기화). 무료 사용자는 그냥 파일 백업.
    if (isPro && isSupabaseEnabled && !user) {
      setLoginOpen(true);
      return;
    }
    const filename = downloadBackup();
    backup.refresh();
    showToast(
      user
        ? `백업 완료 — ${filename} (클라우드에도 자동으로 동기화되고 있어요)`
        : `백업 완료 — ${filename}`,
    );
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
      // 착용로그·조리로그·쇼핑리스트 등은 createSharedStore(모듈 싱글턴)라
      // applyNonCartFromSnapshot의 localStorage.setItem이 메모리 상태를
      // 안 건드린다 — 토스트만 띄우고 넘어가면 화면은 복원 전 값 그대로
      // 있다가, 사용자가 아무 조작(옷 "오늘 입었어요" 등)만 해도 그 stale
      // 상태가 방금 복원한 로그 전체를 덮어써 데이터 절반이 조용히
      // 사라졌다(P0-62, 전문단 E2 발견) — 기기 교체 시 유일한 이전
      // 경로라 영향이 크다. 새로고침으로 모든 스토어를 새로 hydrate시킨다.
      sessionStorage.setItem('nemoa-restore-just-completed', '1');
      // 재검토(P0-7 작업 중 실측) — restoreAll()은 setItems 등 React
      // 상태만 바꾸고, items/archived/discardCount/history의 실제
      // localStorage 기록은 CartContext의 persist useEffect(비동기)가
      // 다음 렌더 이후에 수행한다. 바로 reload()하면 그 effect가
      // flush되기 전에 페이지가 내려가, "복원됐다"는 토스트만 뜨고
      // 카트 데이터는 실제로 복원 전 상태로 남는 경우가 있었다(아이템
      // 41개 스냅샷 복원 직후 새로고침해도 0개로 되돌아옴, 직접 재현
      // 확인). effect가 흐를 시간을 확보한 뒤 새로고침한다.
      await new Promise((resolve) => setTimeout(resolve, 300));
      window.location.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      showToast(`복원 실패: ${msg}`);
    }
  }

  /**
   * ResetConfirmSheet이 "백업 후 초기화"를 고르면 호출 — 백업만 받고
   * 실패하면 null을 돌려줘 시트가 초기화를 진행하지 않게 막는다.
   */
  function handleDownloadBackupForReset(): string | null {
    try {
      const filename = downloadBackup();
      backup.refresh();
      return filename;
    } catch {
      return null;
    }
  }

  /**
   * 재검토(C3 실측) P1 — "전체 초기화"가 confirm() 두 번뿐이라 백업
   * 없이 지우는 선택지가 없었다. 가족 정보가 담긴 평문 파일을 공용
   * 기기에 새로 남기고 싶지 않은 사용자(C3)를 위해 ResetConfirmSheet가
   * "백업 후"/"백업 없이" 두 경로를 모두 제공하고, 실제 삭제는 이
   * 함수가 수행한다.
   */
  function handleResetConfirmed(backedUp: boolean, filename: string | null) {
    resetData();
    showToast(backedUp ? `백업(${filename}) 확인 후 초기화됐어요.` : '백업 없이 초기화했어요.');
    // 재검토(C5) — resetData()가 nemoa- 전체 키를 지워도, 프로필·
    // 착용/조리 로그·요금제 상태 등은 각자 다른 훅이 메모리에 들고
    // 있어 localStorage만 비우면 화면은 그대로 남는다(새로고침 전까지
    // 거짓 상태). 전체 초기화 직후에는 모든 훅을 빈 저장소로 다시
    // 읽게 전체 새로고침한다.
    setTimeout(() => window.location.reload(), 600);
  }

  // 리디자인(옵션 B) — 행 아이콘을 이모지 대신 라인 아이콘으로.
  const dataItems: { label: string; icon: LucideIcon; desc: string; action: () => void }[] = [
    {
      label: '지금 백업하기',
      icon: Save,
      desc: user
        ? '클라우드에 자동 동기화 중 · JSON 파일로도 저장'
        : isPro
          ? '로그인하면 클라우드에 자동으로 백업돼요'
          : '전체 상태를 JSON 파일로 저장',
      action: handleBackupNow,
    },
    { label: '백업에서 복원',  icon: Download, desc: '이전 백업 파일로 데이터 복구',     action: handlePickRestoreFile },
    // 재검토(C5 실측) P1 — "JSON 내보내기"로 받은 파일을 "백업에서
    // 복원"에 넣으면 "네모아 백업 파일이 아닙니다"로 거부된다(아이템
    // 배열만 담아 프로필·로그 등이 없는 다른 포맷 — readBackupFile이
    // version/app 필드를 검증함). 두 버튼이 똑같이 "JSON"이라 백업으로
    // 착각하기 쉬운데, 기기를 바꾼 뒤에야 복원이 안 된다는 걸 알게 되면
    // 그땐 원본 기기가 없을 수 있다 — 지금 이 자리에서 바로 안내한다.
    { label: 'JSON 내보내기', icon: FileText, desc: '현재 아이템 목록을 JSON으로 내보내기 (복원용 아님 — 복원은 위 "지금 백업하기" 파일로)', action: handleExportJSON },
    { label: 'CSV 내보내기',  icon: BarChart3, desc: '현재 아이템 목록을 CSV로 내보내기',  action: handleExportCSV },
  ];

  return (
    <div>
      <header className="sticky top-0 w-screen ml-[calc(50%-50vw)] z-20 bg-white/95 backdrop-blur-md border-b border-gray-50">
        <div className="max-w-md min-[700px]:max-w-[680px] min-[1000px]:max-w-[880px] mx-auto px-4 py-3.5 flex items-center gap-3">
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
        <AutoSnapshotRecoveryCard />

        {/* 백업 상태 배너 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.05 }}
          className={`rounded-card border px-4 py-3 flex items-center gap-3 ${
            !backup.hydrated
              ? 'bg-gray-50 border-gray-100'
              : backup.isStale
                ? 'bg-caution/5 border-caution/15'
                : 'bg-brand-success/5 border-brand-success/15'
          }`}
        >
          {/* 재검토(C3 실측) P1 — 하이드레이션 전엔 isStale이 임시로
              false라, 한 번도 백업한 적 없는 사용자에게도 SSR 첫
              렌더가 "✅ 백업 null일 전"(curl로 확인) 같은 거짓 성공
              배지를 보여줬다. hydrated로 분기해 "확인 중" 중립 상태를
              먼저 보여주고, 실제 값을 안 뒤에만 성공/경고를 단정한다. */}
          {/* 리디자인(옵션 B) — 상태 이모지(⏳💾✅)를 라인 아이콘으로.
              색은 그대로 상태 의미(중립/caution/success)를 유지. */}
          {!backup.hydrated ? (
            <Loader2 size={20} strokeWidth={2} className="text-gray-400 shrink-0 animate-spin" aria-hidden />
          ) : backup.isStale ? (
            <Save size={20} strokeWidth={2} className="text-caution shrink-0" aria-hidden />
          ) : (
            <CheckCircle2 size={20} strokeWidth={2} className="text-brand-success shrink-0" aria-hidden />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800">
              {!backup.hydrated
                ? '백업 상태 확인 중…'
                : backup.isStale
                  ? (backup.lastBackupAt === null ? '아직 백업한 적 없어요' : `마지막 백업 ${daysAgoLabel(backup.daysSince)}`)
                  : `백업 ${daysAgoLabel(backup.daysSince)}`}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
              {!backup.hydrated
                ? '잠시만 기다려주세요.'
                : backup.isStale
                  ? '브라우저 캐시가 비면 데이터가 사라질 수 있어요. 지금 백업해두세요.'
                  : '다운로드 폴더에서 백업 파일을 확인해보세요.'}
            </p>
            {/* P2-43 — 개인정보 경고문이 text-gray-400(대비 ~2.4:1)로
                카드에서 가장 안 보이는 글씨였다(C8·E3 실측). */}
            {/* 재검토(C3 실측) P1 — 경고문이 "이름·신체 정보"로만 적혀
                있었는데, buildSnapshot()이 실제로 담는 건 그보다 훨씬
                민감하다: 프로필의 알레르기·나이·성별, 아바타로 올린
                얼굴 사진, 식품/의류에 등록한 사진까지 전부 암호화 안 된
                평문 JSON에 들어간다. "이름하고 키 몸무게 정도"로 믿고
                카톡으로 보냈다가 그 안에 아이 알레르기·얼굴 사진까지
                있다는 걸 알면 경고가 경고 역할을 못 한 셈이다. */}
            <p className="text-xs font-medium text-caution mt-1">가족 이름·나이·알레르기·얼굴 사진과 등록한 사진까지 그대로 담겨요 — 남과 공유하지 말고 안전한 곳에 보관하세요.</p>
          </div>
          <button
            onClick={handleBackupNow}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90 transition-opacity"
          >
            지금 백업
          </button>
        </motion.div>

        {/* 프로필은 마이페이지 > 내 정보 탭에서 관리 — "내 정보"로만 연결하면
            탭 지정이 없어 usePersistedState가 기억한 마지막 탭(쇼핑 등)에
            떨어질 수 있었다(P1-50, C4·E1 발견 — "프로필 관리" 진입 경로가
            실질적으로 비어있던 문제). 다른 곳(P1-5/P1-20/P1-40)과 동일하게
            ?tab=profile로 명시 지정. */}
        <div className="flex items-center gap-2">
          <User size={16} strokeWidth={2} className="text-gray-600" aria-hidden />
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
              href="/mypage?tab=profile"
              className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              내 정보 <ChevronRight size={12} />
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
            onClick={() => {
              // 무료 = 이 기기에만. 클라우드 동기화는 Pro 기능 → 업그레이드 시트
              if (isPro || user) setLoginOpen(true);
              else setUpgradeOpen(true);
            }}
            className="flex items-center gap-3 w-full py-1 text-left"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${user ? 'bg-brand-success/10' : 'bg-gray-100'}`}>
              <Cloud size={18} className={user ? 'text-brand-success' : 'text-gray-400'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {user
                  ? '동기화 켜짐'
                  : isPro
                    ? (isSupabaseEnabled ? '로그인하여 동기화 시작' : '동기화 준비 중')
                    : '클라우드 백업'}
                {!user && !isPro && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary align-middle">Pro</span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {user
                  ? user.email ?? '로그인됨'
                  : isPro
                    ? '모든 기기에서 같은 데이터를 사용할 수 있어요'
                    : '무료 요금제는 이 기기에만 저장돼요. 파일 백업은 아래에서'}
              </p>
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          </button>
        </motion.div>

        <NotificationSettings />

        {/* 백업 & 내보내기 */}
        <div className="flex items-center gap-2">
          <Package size={16} strokeWidth={2} className="text-gray-600" aria-hidden />
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
                <m.icon size={16} strokeWidth={2} className="text-gray-600" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{m.label}</p>
                  <p className="text-sm text-gray-400">{m.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>

        <StorageUsage />

        {/* 앱 */}
        <div className="flex items-center gap-2">
          <Smartphone size={16} strokeWidth={2} className="text-gray-600" aria-hidden />
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
            <GraduationCap size={16} strokeWidth={2} className="text-gray-600" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">온보딩 다시 보기</p>
              <p className="text-sm text-gray-400">네모아 소개 7단계 재생</p>
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          </button>
        </motion.div>

        <FeedbackToggles />

        <ErrorLogCard />

        {/* 위험 구역 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.14 }}
          className="rounded-card border border-danger/20 bg-danger/3 px-4 py-4"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} className="text-danger" />
            <h3 className="text-xs text-danger font-semibold">위험 구역</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">아래 작업은 되돌리기 어려워요. 백업 후 진행을 권장합니다.</p>
          <button
            onClick={() => setResetOpen(true)}
            className="flex items-center gap-3 w-full py-2.5 text-left hover:bg-danger/5 -mx-2 px-2 rounded-2xl transition-colors"
          >
            <RotateCcw size={16} strokeWidth={2} className="text-danger" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-danger">전체 초기화</p>
              <p className="text-sm text-gray-400">백업 후 삭제 또는 백업 없이 바로 삭제</p>
            </div>
          </button>
        </motion.div>

        <ResetConfirmSheet
          open={resetOpen}
          onClose={() => setResetOpen(false)}
          onDownloadBackup={handleDownloadBackupForReset}
          onConfirmReset={handleResetConfirmed}
        />

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
      <UpgradeSheet open={upgradeOpen} onClose={() => setUpgradeOpen(false)} trigger="sync" />
    </div>
  );
}
