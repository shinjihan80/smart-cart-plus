'use client';

import { useEffect, type RefObject } from 'react';

/**
 * 공용 검색 단축키 훅.
 * - ⌘K / Ctrl+K  → 항상 ref.focus() + select()
 * - '/'          → 다른 입력 요소에 포커스돼 있지 않을 때만 focus()
 * - Escape       → ref에 포커스 돼 있을 때만 onClear 호출 + blur()
 *
 * 여러 페이지에서 동일하게 쓰려고 추출. 비어있으면 onClear는 no-op으로.
 */
export function useSearchShortcut(
  ref: RefObject<HTMLInputElement | null>,
  onClear?: () => void,
) {
  useEffect(() => {
    function isEditable(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return el.isContentEditable;
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
        return;
      }
      if (e.key === '/' && !isEditable(e.target)) {
        e.preventDefault();
        ref.current?.focus();
        return;
      }
      if (e.key === 'Escape' && document.activeElement === ref.current) {
        e.preventDefault();
        onClear?.();
        ref.current?.blur();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ref, onClear]);
}
