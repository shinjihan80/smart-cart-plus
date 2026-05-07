'use client';

import { useEffect } from 'react';
import { createSharedStore } from './sharedStore';

/**
 * 가벼운 클라이언트 에러 로깅 — Sentry 없이 로컬 스토리지에 최근 50건 저장.
 *
 * 왜 로컬?
 *  - 베이직 단계: 서버 인프라 없음 (Google Gemini API만 경유)
 *  - 프라이버시 기본값 — 동의 없이 원격 전송 X
 *  - 사용자가 설정에서 직접 확인·복사·삭제 가능 (문의 시 붙여넣기)
 *
 * Pro 단계로 넘어가면 선택적 원격 전송 (opt-in) 추가 예정.
 */

export interface ErrorEntry {
  id:        string;
  ts:        number;                // epoch ms
  message:   string;
  stack?:    string;
  source?:   'error' | 'unhandledrejection' | 'react' | 'manual';
  url?:      string;
  userAgent?: string;
}

const STORAGE_KEY = 'nemoa-error-log';
const MAX_ENTRIES = 50;

const store = createSharedStore<ErrorEntry[]>({
  storageKey: STORAGE_KEY,
  initial:    [],
  validate:   (raw) => (Array.isArray(raw) ? (raw as ErrorEntry[]) : null),
});

function makeId(): string {
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** 문자열 정규화 — Error · 문자열 · 기타 모두 message로 평탄화. */
function normalizeMessage(input: unknown): string {
  if (input instanceof Error) return input.message || input.name || 'Error';
  if (typeof input === 'string') return input;
  try       { return JSON.stringify(input).slice(0, 500); }
  catch     { return '<unserializable>'; }
}

function normalizeStack(input: unknown): string | undefined {
  if (input instanceof Error && input.stack) return input.stack.split('\n').slice(0, 10).join('\n');
  return undefined;
}

/** 앱 어디서든 호출 — 자동으로 저장. */
export function logError(
  input: unknown,
  source: ErrorEntry['source'] = 'manual',
): void {
  if (typeof window === 'undefined') return;
  const entry: ErrorEntry = {
    id:        makeId(),
    ts:        Date.now(),
    message:   normalizeMessage(input),
    stack:     normalizeStack(input),
    source,
    url:       location.pathname + location.search,
    userAgent: navigator.userAgent.slice(0, 200),
  };
  store.setState((prev) => {
    const next = [entry, ...prev];
    return next.length > MAX_ENTRIES ? next.slice(0, MAX_ENTRIES) : next;
  });
}

export function clearErrorLog(): void {
  store.setState(() => []);
}

export function useErrorLog() {
  const entries = store.useStore();
  return { entries, clear: clearErrorLog, log: logError };
}

/** window.onerror + onunhandledrejection 훅을 한 번만 설치. */
let installed = false;
export function installGlobalErrorHandlers(): void {
  if (typeof window === 'undefined' || installed) return;
  installed = true;

  window.addEventListener('error', (e) => {
    // 외부 리소스 로딩 실패는 메시지가 비어있을 수 있음
    const msg = e.message || e.error?.message || 'window.error';
    logError(e.error ?? msg, 'error');
  });

  window.addEventListener('unhandledrejection', (e) => {
    logError(e.reason ?? 'unhandledrejection', 'unhandledrejection');
  });
}

/** layout에서 한 번 마운트되는 보이지 않는 설치자. */
export function useInstallErrorHandlers() {
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);
}

/** 최근 N개 요약 문자열 — 사용자가 문의 시 복사하기 용. */
export function summarizeErrors(entries: ErrorEntry[], limit = 10): string {
  const rows = entries.slice(0, limit).map((e) => {
    const d = new Date(e.ts).toLocaleString('ko-KR');
    return `[${d}] (${e.source ?? '?'}) ${e.message}${e.url ? ` @ ${e.url}` : ''}`;
  });
  return rows.length === 0 ? '(기록된 오류 없음)' : rows.join('\n');
}

