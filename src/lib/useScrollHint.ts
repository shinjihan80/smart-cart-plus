'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * 디자인 시스템 Step 6(docs/design-system-scope.md, P1-59) — 탭 스트립 등
 * `.scrollbar-hide` 가로 스크롤러가 네이티브 스크롤바까지 지우면서,
 * 화면 밖에 탭이 더 있다는 걸 알려줄 수단이 전혀 없었다. 실제로
 * 스크롤 가능한 쪽(왼쪽/오른쪽)만 참으로 켜지는 플래그를 반환해,
 * 호출부가 그쪽에만 엣지 페이드·화살표를 그리게 한다.
 */
export function useScrollHint<T extends HTMLElement = HTMLDivElement>(): {
  ref: RefObject<T | null>;
  canScrollLeft:  boolean;
  canScrollRight: boolean;
} {
  const ref = useRef<T>(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      // 2px 여유 — 서브픽셀 반올림으로 scrollWidth가 1px쯤 더 커서
      // 끝까지 스크롤해도 canScrollRight가 계속 true로 남는 걸 방지.
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);

    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return { ref, canScrollLeft, canScrollRight };
}
