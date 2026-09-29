'use client';

import { useEffect } from 'react';
import { useInstallErrorHandlers } from '@/lib/errorLog';
import { useToast } from '@/context/ToastContext';

/**
 * 최상위 레이아웃에 마운트 — window.onerror / unhandledrejection 핸들러 설치.
 * `CartProvider`가 `ToastProvider`보다 트리 상 바깥이라(Providers.tsx) 직접
 * useToast()를 못 불러 이벤트로 연결한다 — safeStorage.ts가 저장 실패 시
 * 쏘는 신호를 여기서 받아 토스트로 안내한다(P0-23/P0-63, 검토단 C5·
 * 전문단 E2 발견 — 예전엔 저장 실패가 사용자에게 전혀 안 알려졌다).
 * 렌더링은 핸들러 설치 목적 외엔 없음.
 */
export default function ErrorCapture() {
  useInstallErrorHandlers();
  const { showToast } = useToast();

  useEffect(() => {
    function onStorageWriteFailed(e: Event) {
      const detail = (e as CustomEvent<{ key: string; isQuota: boolean }>).detail;
      showToast(
        detail?.isQuota
          ? '저장 공간이 가득 찼어요 — 설정 > 백업에서 파일로 저장해주세요.'
          : '방금 변경사항 저장에 실패했어요 — 새로고침하면 사라질 수 있어요.',
      );
    }
    window.addEventListener('nemoa:storage-write-failed', onStorageWriteFailed);
    return () => window.removeEventListener('nemoa:storage-write-failed', onStorageWriteFailed);
  }, [showToast]);

  return null;
}
