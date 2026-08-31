'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * localStorage에 자동 동기화되는 state 훅.
 *
 * - SSR·첫 CSR 렌더는 **항상 fallback** 을 반환한다. 이전엔 lazy initializer 가
 *   클라이언트에서 localStorage 를 읽어, 저장값 ≠ fallback 이면 hydration
 *   mismatch(React #418) 가 났다. (N-3)
 * - 마운트 직후 useEffect 에서 저장값을 1회 반영한다 → 한 프레임 뒤 스냅.
 * - validate 콜백으로 저장된 값 유효성 검증 (잘못된 값이면 fallback 유지)
 * - 단순 직렬화만 지원: 문자열·숫자·불리언·JSON-safe 객체
 */
export function usePersistedState<T>(
  key: string,
  fallback: T,
  validate?: (raw: unknown) => T | null,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(fallback);
  const hydrated = useRef(false);
  // 최신 validate 참조 (effect 의존성에서 제외해도 stale 안 되게)
  const validateRef = useRef(validate);
  validateRef.current = validate;

  // 마운트 후 1회: 저장값 로드
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        const v = validateRef.current ? validateRef.current(parsed) : (parsed as T);
        if (v !== null && v !== undefined) setState(v);
      }
    } catch { /* 파싱 실패 → fallback 유지 */ }
    hydrated.current = true;
  }, [key]);

  // state 변경 시 저장 (하이드레이션 전엔 스킵 — fallback 으로 덮어쓰기 방지)
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch { /* quota or serialization fail — silently skip */ }
  }, [key, state]);

  return [state, setState];
}
