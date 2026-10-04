'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * "오늘 할 일" 섹션의 자식(NotificationOffBanner·UrgentAlert·RebuyAlert·
 * SeasonChangeAlert)은 전부 각자 조건에 따라 null을 반환할 수 있는
 * 독립 컴포넌트 — 전부 null이면 섹션 제목만 남고 그 아래는 빈 여백뿐이라,
 * 바로 이어지는 카테고리 바로가기 타일이 "오늘 할 일"의 일부처럼 보였다
 * (P2-46, C1 실측). 각 자식의 내부 조건(dismiss 상태 등)을 부모가
 * 중복 구현하지 않고, 렌더 후 실제 DOM 자식 수를 재서 비어있으면 빈
 * 상태 문구를 보여준다 — display:contents라 레이아웃에는 끼어들지 않음.
 */
export default function TodoEmptyState({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  // 의도적으로 deps 없이 매 렌더 후 재확인 — NotificationOffBanner는
  // 알림 권한(permState)을 자기 내부 useEffect로 비동기 확인해, 마운트
  // 시점엔 항상 null을 반환했다가 한 틱 뒤에 배너를 그릴 수 있다. deps를
  // []로 주면(마운트 시 1회만) 그 틱 전에 "비어있음"으로 굳어버려 실제로는
  // 채워질 섹션도 빈 상태 문구가 눌어붙는다 — NotificationOffBanner.tsx의
  // 동일 set-state-in-effect 수용 패턴과 같은 이유.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setIsEmpty(ref.current?.children.length === 0);
  });

  return (
    <>
      <div ref={ref} className="contents">{children}</div>
      {isEmpty && (
        <p className="text-sm text-gray-400 text-center py-6">오늘은 할 일이 없어요 🎉</p>
      )}
    </>
  );
}
