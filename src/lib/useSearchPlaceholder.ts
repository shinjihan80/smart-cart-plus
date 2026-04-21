'use client';

import { useEffect, useState } from 'react';

/**
 * 검색창 placeholder를 일정 간격으로 순환시키는 훅.
 * 동적 힌트로 검색 기능이 다양한 항목에 대응함을 보여준다.
 *
 * @param hints 순환할 힌트 배열
 * @param intervalMs 전환 간격 (기본 3.5초)
 */
export function useSearchPlaceholder(hints: string[], intervalMs = 3500): string {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (hints.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % hints.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [hints.length, intervalMs]);

  return hints[idx] ?? '';
}
