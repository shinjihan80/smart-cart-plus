'use client';

import { useEffect } from 'react';
import { createSharedStore } from './sharedStore';

/**
 * 익명 사용 통계 — 프라이버시 기본값.
 *
 * 원칙
 *  1. **opt-in 전용** — 기본값 `false`, 사용자가 설정에서 켜야만 수집
 *  2. **식별자 없음** — 매일 랜덤 재생성되는 day-level 토큰만 (stable 추적 불가)
 *  3. **엔드포인트 없으면 no-op** — `NEXT_PUBLIC_ANALYTICS_ENDPOINT` 미설정 시 아무것도 안 보냄
 *  4. **로컬 카운터 유지** — 자기 인사이트 용도로 사용 횟수·연속 사용일 자체 기록
 *
 * MAU/DAU 집계는 Phase A에서 Supabase Edge Function으로 단순 카운팅.
 * 개인정보·행동 프로파일링 목적이 아니라 "오늘 몇 명이 썼는가" 판단용.
 */

interface AnalyticsState {
  enabled:     boolean;          // opt-in 여부
  dayToken:    string;           // YYYY-MM-DD:<rand> — 당일만 유효
  tokenDate:   string;           // YYYY-MM-DD
  installedAt: string;           // 최초 설치일 (연속 사용일 계산)
  totalSessions: number;         // 누적 세션 수 (하루 1회만 증가)
  lastSessionDate: string;       // 마지막 세션 날짜 (중복 ping 방지)
}

const STORAGE_KEY = 'nemoa-analytics';
const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function rand(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyState(): AnalyticsState {
  const today = todayStr();
  return {
    enabled:         false,
    dayToken:        `${today}:${rand()}`,
    tokenDate:       today,
    installedAt:     today,
    totalSessions:   0,
    lastSessionDate: '',
  };
}

const store = createSharedStore<AnalyticsState>({
  storageKey: STORAGE_KEY,
  initial:    emptyState(),
  validate:   (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const s = raw as Partial<AnalyticsState>;
    if (typeof s.enabled !== 'boolean' || typeof s.installedAt !== 'string') return null;
    return { ...emptyState(), ...s } as AnalyticsState;
  },
});

function rotateTokenIfNeeded(s: AnalyticsState): AnalyticsState {
  const today = todayStr();
  if (s.tokenDate === today) return s;
  return { ...s, dayToken: `${today}:${rand()}`, tokenDate: today };
}

/** opt-in 토글 */
export function setAnalyticsEnabled(on: boolean): void {
  store.setState((prev) => ({ ...prev, enabled: on }));
}

export function isAnalyticsEnabled(): boolean {
  return store.getState().enabled;
}

/** 하루 1회 세션 핑 — 홈 진입 시 호출. 중복은 자동 무시. */
export function pingSession(event: string = 'session_start', meta?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  store.setState((prev) => {
    const rotated = rotateTokenIfNeeded(prev);
    const today = todayStr();

    // 세션 이벤트는 하루 1회만 카운트
    if (event === 'session_start' && rotated.lastSessionDate === today) {
      return rotated;
    }

    const next: AnalyticsState =
      event === 'session_start'
        ? {
            ...rotated,
            totalSessions:   rotated.totalSessions + 1,
            lastSessionDate: today,
          }
        : rotated;

    // 옵트인 + 엔드포인트 설정 시에만 실제 전송
    if (next.enabled && ENDPOINT) {
      // fire-and-forget
      try {
        fetch(ENDPOINT, {
          method:   'POST',
          keepalive: true,
          headers:  { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            dayToken: next.dayToken,
            meta:     meta ?? {},
            ts:       Date.now(),
          }),
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return next;
  });
}

/** 홈에서 마운트되면 하루 1회 ping. */
export function useSessionPing() {
  useEffect(() => {
    pingSession('session_start');
  }, []);
}

/** 로컬 자기 인사이트 — "오늘 N일째 사용 중" */
export function useAnalyticsState() {
  return store.useStore();
}

export function daysSinceInstall(installedAt: string): number {
  const d0 = new Date(installedAt).getTime();
  const d1 = Date.now();
  return Math.max(0, Math.round((d1 - d0) / 86_400_000));
}
