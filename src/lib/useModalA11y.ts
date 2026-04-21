'use client';

import { useEffect } from 'react';

/**
 * 모달 접근성 기본 세트:
 *  1. Esc 키로 닫기 (onClose 호출)
 *  2. 모달 열리는 동안 body 스크롤 잠금
 *  3. 해제 시 포커스를 모달 열기 전 요소로 복원 (키보드·스크린리더 UX)
 *
 * 포커스 트랩은 복잡도 대비 이득이 낮아 생략 (ESC + 탭 주변 대비 클릭 이탈 허용).
 */
export function useModalA11y(onClose: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 모달 열리기 직전 포커스된 요소를 기억 — 닫힐 때 복원
    const previouslyFocused = document.activeElement as HTMLElement | null;

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      // 여전히 문서에 살아있는 요소라면 포커스 복원
      if (previouslyFocused && document.contains(previouslyFocused)) {
        try { previouslyFocused.focus(); } catch { /* 조용히 실패 */ }
      }
    };
  }, [onClose]);
}
