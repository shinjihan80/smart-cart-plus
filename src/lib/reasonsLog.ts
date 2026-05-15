'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * 추천 신호(reasons) 선호도 로그.
 *
 * 사용자가 추천을 **수용한 시점**(코디 착용 / 레시피 조리)에 그 추천의
 * reasons 배지들을 기록 → 어떤 추천 신호가 실제 행동으로 이어지는지 추적.
 *
 * 활용
 *  1. 자기 인사이트: "당신이 자주 따라가는 추천: 💞 자주 입는 조합 (12회)"
 *  2. 미래 가중치 자동 조정: 자주 클릭하는 reasons 의 점수 가중치를 약간 상향
 *  3. UI 개인화: 사용자가 무시하는 신호는 노출 축소 가능
 *
 * 데이터
 *  - localStorage 'nemoa-reasons-log'
 *  - 구조: { [reasonKey]: { count: N, lastTs: timestamp } }
 *  - reasonKey 는 OutfitCard / TodayDishCard 에서 표시되는 정규 라벨 (이모지 포함)
 */

const STORAGE_KEY = 'nemoa-reasons-log';

export interface ReasonStat {
  count:  number;
  lastTs: number;
}

export type ReasonsLog = Record<string, ReasonStat>;

function load(): ReasonsLog {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ReasonsLog;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function save(log: ReasonsLog): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch { /* storage full — 조용히 실패 */ }
}

/**
 * 사용자가 추천을 수용했을 때 reasons 기록 (외부에서 직접 호출 가능).
 * 예: OutfitDetailModal 의 markWorn / TodayDishCard 의 markCooked.
 */
export function logReasonsAction(reasons: string[]): void {
  if (typeof window === 'undefined') return;
  if (!reasons || reasons.length === 0) return;
  try {
    const existing = load();
    const now = Date.now();
    for (const r of reasons) {
      const prev = existing[r];
      existing[r] = {
        count:  (prev?.count ?? 0) + 1,
        lastTs: now,
      };
    }
    save(existing);
    window.dispatchEvent(new CustomEvent('nemoa:reasons-action'));
  } catch {
    // ignore
  }
}

export function useReasonsLog() {
  const [log, setLog] = useState<ReasonsLog>({});

  useEffect(() => {
    setLog(load());
    function refresh() {
      setLog(load());
    }
    window.addEventListener('storage', refresh);
    window.addEventListener('nemoa:reasons-action', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('nemoa:reasons-action', refresh);
    };
  }, []);

  /** 상위 N개 reasons (count 내림차순) */
  const top = useCallback((n: number = 5) => {
    return Object.entries(log)
      .map(([reason, stat]) => ({ reason, count: stat.count, lastTs: stat.lastTs }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }, [log]);

  const total = Object.values(log).reduce((s, x) => s + x.count, 0);

  function clearAll() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLog({});
    } catch { /* ignore */ }
  }

  return { log, total, top, clearAll };
}
