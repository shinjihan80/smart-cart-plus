'use client';

import { useEffect } from 'react';

/**
 * 모달 접근성 기본 세트:
 *  1. Esc 키로 닫기 (onClose 호출)
 *  2. 모달 열리는 동안 body 스크롤 잠금
 *  3. 해제 시 원복
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

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);
}
