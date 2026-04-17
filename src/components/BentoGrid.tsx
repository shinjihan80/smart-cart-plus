'use client';

import { AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
}

/**
 * BentoGrid — 벤토 박스 스타일 CSS Grid 컨테이너
 *
 * 열 구성:
 *   모바일:  2열 (col-span-2 = 전체 폭, col-span-1 = 절반)
 *   태블릿+: 4열 (col-span-2 = 절반, col-span-1 = 1/4)
 *
 * 셀 크기는 BentoCell 컴포넌트로 제어한다.
 */
export function BentoGrid({ children }: BentoGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-start">
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </div>
  );
}

/**
 * getBentoSpan — 인덱스 기반 col-span 반환
 *
 * 패턴 (3개씩 반복):
 *   index % 3 === 0  →  넓은 카드 (col-span-2)
 *   index % 3 === 1  →  작은 카드 (col-span-1)
 *   index % 3 === 2  →  작은 카드 (col-span-1)
 *
 * 결과 (4열 그리드):
 *   [넓은][작은][작은]
 *   [넓은][작은][작은]
 */
export function getBentoSpan(index: number): string {
  return index % 3 === 0 ? 'col-span-2' : 'col-span-1';
}
