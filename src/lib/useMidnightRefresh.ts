'use client';

import { useEffect, useState } from 'react';
import { todayLocalStr } from './dateMath';

/**
 * 재검토(/nemoa-review 비판 모드, C5 실측) P1 — D-day는 items 상태가
 * 바뀔 때만 다시 계산되는데(렌더 시점 Date.now() 기준), 자정이 지나도
 * items가 그대로면 리렌더 자체가 안 일어나 어제 날짜 기준 D-day가
 * 화면에 그대로 남았다. 23:59에 음식 탭을 열어둔 채 00:04로 넘기면
 * "D-0"가 그대로 보이다가, 다른 화면으로 이동했다 돌아와야(리마운트)
 * 그제서야 "기한 초과"로 바뀌는 식.
 *
 * visibilitychange·focus(탭 재방문)와 1분 간격 폴링(탭이 계속 열려
 * 있는 PWA 백그라운드 케이스)으로 로컬 날짜 변화를 감지해 더미 state를
 * 바꿔 리렌더만 강제한다 — 리렌더되면 getRemainingDays 등이 그 시점의
 * 실제 Date.now()로 다시 계산되므로 이 훅 자체는 날짜 계산에 관여하지
 * 않는다.
 */
export function useMidnightRefresh(): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    let lastDate = todayLocalStr();
    function checkDate() {
      const now = todayLocalStr();
      if (now !== lastDate) {
        lastDate = now;
        setTick((t) => t + 1);
      }
    }
    document.addEventListener('visibilitychange', checkDate);
    window.addEventListener('focus', checkDate);
    const interval = setInterval(checkDate, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', checkDate);
      window.removeEventListener('focus', checkDate);
      clearInterval(interval);
    };
  }, []);
}
