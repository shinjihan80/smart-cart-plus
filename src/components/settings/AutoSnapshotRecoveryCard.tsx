'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getLatestAutoSnapshot } from '@/lib/autoSnapshot';
import { applyNonCartFromSnapshot, type BackupSnapshot } from '@/lib/backup';
import { LifeBuoy } from 'lucide-react';
import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';

/**
 * P0-7 — 자동 스냅샷(IndexedDB) 복구 카드. 현재 카트가 비어있는데
 * IndexedDB에 내용 있는 자동 스냅샷이 남아있으면(localStorage만
 * 비워진 경우 — 브라우저 저장소 정리, "쿠키 및 사이트 데이터 삭제"의
 * 일부만 적용된 경우 등) 수동 백업 파일 없이도 되돌아갈 길을 보여준다.
 * 평소(정상 사용 중)엔 렌더하지 않는다.
 */
export default function AutoSnapshotRecoveryCard() {
  const { items, restoreAll } = useCart();
  const { showToast } = useToast();
  const [snapshot, setSnapshot] = useState<BackupSnapshot | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (items.length > 0) return; // 정상적으로 데이터가 있으면 확인할 필요 없음
    let cancelled = false;
    getLatestAutoSnapshot().then((snap) => {
      if (!cancelled && snap && Array.isArray(snap.items) && snap.items.length > 0) {
        setSnapshot(snap);
      }
    });
    return () => { cancelled = true; };
  }, [items.length]);

  if (!snapshot) return null;

  async function handleRestore() {
    if (!snapshot) return;
    const itemCount = Array.isArray(snapshot.items) ? snapshot.items.length : 0;
    if (!confirm(`자동 저장된 데이터(${new Date(snapshot.createdAt).toLocaleString('ko-KR')}, 아이템 ${itemCount}개)로 복구할까요?`)) return;
    setRestoring(true);
    restoreAll({
      items:          snapshot.items    as CartItem[] | undefined,
      archived:       snapshot.archived as CartItem[] | undefined,
      discardCount:   snapshot.discard?.count,
      discardHistory: snapshot.discard?.history as { name: string; category: string; date: string }[] | undefined,
    });
    applyNonCartFromSnapshot(snapshot);
    showToast('자동 저장된 데이터로 복구했어요.');
    // 라이브 테스트로 실제 재현 — restoreAll()은 setItems 등 React
    // 상태만 바꾸고, 실제 localStorage 기록은 CartContext의 persist
    // useEffect(비동기)가 다음 렌더 이후에 수행한다. 그 전에 바로
    // reload()하면 effect가 flush되기 전에 페이지가 내려가 복구한
    // 데이터가 결국 디스크엔 안 남는다 — "복구했다"는 토스트만 뜨고
    // 실제로는 그대로 빈 상태인 상황. React가 effect를 흘려보낼 시간을
    // 한 프레임 이상 확보한 뒤에 새로고침한다.
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.location.reload();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className={`${CARD} border border-brand-primary/20 bg-brand-primary/5`}
      style={CARD_SHADOW}
    >
      <div className="flex items-start gap-2.5">
        <LifeBuoy size={18} strokeWidth={2} className="text-brand-primary shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">자동 저장된 데이터를 찾았어요</p>
          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
            지금 화면엔 데이터가 없는데, 이 기기에 {new Date(snapshot.createdAt).toLocaleDateString('ko-KR')}에 자동 저장된 기록이 남아있어요. 브라우저 저장공간 정리 등으로 사라졌을 수 있어요.
          </p>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="mt-2.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-primary text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {restoring ? '복구하는 중…' : '이 데이터로 복구하기'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
