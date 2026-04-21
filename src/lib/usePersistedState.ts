'use client';

import { useEffect, useState } from 'react';

/**
 * localStorage에 자동 동기화되는 state 훅.
 *
 * - 초기값은 lazy initializer로 SSR 환경에서도 안전 (typeof window 가드)
 * - validate 콜백으로 저장된 문자열/값 유효성 검증 (잘못된 값이면 fallback)
 * - 단순 직렬화만 지원: 문자열·숫자·불리언·JSON-safe 객체
 */
export function usePersistedState<T>(
  key: string,
  fallback: T,
  validate?: (raw: unknown) => T | null,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = window.localStorage.getItem(key);
      if (saved === null) return fallback;
      const parsed = JSON.parse(saved);
      if (validate) {
        const v = validate(parsed);
        return v === null ? fallback : v;
      }
      return parsed as T;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch { /* quota or serialization fail — silently skip */ }
  }, [key, state]);

  return [state, setState];
}
