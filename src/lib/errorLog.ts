'use client';

import { useEffect } from 'react';
import { createSharedStore } from './sharedStore.ts';
import { isAnalyticsEnabled } from './analytics.ts';

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
  reportErrorToServer(entry);
}

/** opt-in 사용자에 한해 서버로도 전송 — 관리자 콘솔 오류 현황용. 실패해도 무시. */
function reportErrorToServer(entry: ErrorEntry): void {
  if (!isAnalyticsEnabled()) return;
  try {
    fetch('/api/admin/telemetry/errors', {
      method:    'POST',
      keepalive: true,
      headers:   { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:   entry.message,
        stack:     entry.stack,
        source:    entry.source,
        url:       entry.url,
        userAgent: entry.userAgent,
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function clearErrorLog(): void {
  store.setState(() => []);
}

export function useErrorLog() {
  const entries = store.useStore();
  return { entries, clear: clearErrorLog, log: logError };
}

const CHUNK_RELOAD_KEY = 'nemoa-chunk-reload-at';

/**
 * 재검토(비판 모드) P1-82 — 배포마다 청크 파일명이 바뀌는데, 배포 직후
 * 탭을 열어둔 사용자가 옛 HTML에서 네비게이션하면 브라우저가 이미
 * 사라진 청크를 요청해 `ChunkLoadError`가 뜬다(자동 복구 없음, E2
 * 지적). SW 버전은 이번 라운드에서 커밋 SHA 기반으로 이미 고쳤지만
 * (src/app/sw.js/route.ts), 그건 "다음 로드부터 최신"을 보장할 뿐
 * "지금 이 탭"은 구해주지 못한다 — 딱 한 번 자동 새로고침으로 복구.
 * 무한 루프 방지: 같은 분 안에 또 터지면(실제로 배포가 깨졌거나
 * 네트워크 문제) 더는 자동 재시도하지 않고 조용히 로그만 남긴다.
 */
function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const name = (err as { name?: string }).name ?? '';
  const message = (err as { message?: string }).message ?? String(err);
  return name === 'ChunkLoadError' || /loading chunk|failed to fetch dynamically imported module/i.test(message);
}

function maybeRecoverFromChunkError(err: unknown): boolean {
  if (typeof window === 'undefined' || !isChunkLoadError(err)) return false;
  const lastAttempt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
  if (Date.now() - lastAttempt < 60_000) return false; // 1분 내 재시도 이력 — 루프 방지
  try { sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now())); } catch { /* quota */ }
  window.location.reload();
  return true;
}

/** window.onerror + onunhandledrejection 훅을 한 번만 설치. */
let installed = false;
export function installGlobalErrorHandlers(): void {
  if (typeof window === 'undefined' || installed) return;
  installed = true;

  window.addEventListener('error', (e) => {
    // 외부 리소스 로딩 실패는 메시지가 비어있을 수 있음
    const msg = e.message || e.error?.message || 'window.error';
    if (maybeRecoverFromChunkError(e.error ?? msg)) return;
    logError(e.error ?? msg, 'error');
  });

  window.addEventListener('unhandledrejection', (e) => {
    if (maybeRecoverFromChunkError(e.reason)) return;
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

