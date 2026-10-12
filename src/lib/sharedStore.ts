'use client';

import { useSyncExternalStore } from 'react';
import { safeSetItem } from './safeStorage.ts';

/**
 * localStorage 기반 공유 스토어 팩토리.
 * 같은 키를 쓰는 모든 훅 인스턴스가 하나의 메모리 상태를 공유하고,
 * 한 곳에서 write하면 모든 구독자에게 즉시 재렌더가 전파된다.
 *
 * React의 useSyncExternalStore로 외부 스토어 구독을 안전하게 처리 —
 * SSR/hydration·tearing 자동 방지.
 */
export interface SharedStore<T> {
  getState: () => T;
  setState: (updater: (prev: T) => T) => void;
  useStore: () => T;
}

interface StoreOptions<T> {
  storageKey: string;
  initial:    T;
  validate?:  (raw: unknown) => T | null;
}

function safeRead<T>(key: string, fallback: T, validate?: (raw: unknown) => T | null): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (validate) {
      const v = validate(parsed);
      return v ?? fallback;
    }
    return parsed as T;
  } catch { return fallback; }
}

/**
 * 재검토(/nemoa-review 비판 모드, C5 코드 확인) P0 — 이 함수가 예전엔
 * `catch { quota }`로 조용히 실패를 삼켜, 프로필·조리/착용 로그·
 * 쇼핑 리스트·즐겨찾기·저장 코디·AI 한도 등 이 팩토리로 만든 13개
 * 스토어 전부가 "추가됐어요" 토스트는 띄우면서 실제로는 저장이 안 되고
 * 새로고침하면 사라지는 유실이 있었다(P0-23/P0-63 "완료"는 CartContext·
 * usePersistedState만 safeSetItem으로 통일했을 뿐, 이 팩토리는 안 거쳐서
 * 빠져 있었음). 같은 safeSetItem으로 통일 — 실패 시 ErrorCapture.tsx가
 * 이미 구독 중인 `nemoa:storage-write-failed` 로 토스트가 뜬다(키별로
 * 새로 연결할 필요 없음, 그 이벤트가 범용이라서).
 */
function safeWrite(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  safeSetItem(key, JSON.stringify(value));
}

export function createSharedStore<T>(opts: StoreOptions<T>): SharedStore<T> {
  let state:    T       = opts.initial;
  let hydrated: boolean = false;
  const listeners: Set<() => void> = new Set();

  function hydrateIfNeeded() {
    if (hydrated || typeof window === 'undefined') return;
    state = safeRead(opts.storageKey, opts.initial, opts.validate);
    hydrated = true;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }

  function getClientSnapshot(): T {
    hydrateIfNeeded();
    return state;
  }

  function getServerSnapshot(): T {
    return opts.initial;
  }

  function getState(): T {
    hydrateIfNeeded();
    return state;
  }

  function setState(updater: (prev: T) => T) {
    hydrateIfNeeded();
    const next = updater(state);
    if (next === state) return;
    state = next;
    safeWrite(opts.storageKey, state);
    listeners.forEach((l) => l());
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  }

  return { getState, setState, useStore };
}
