'use client';

import { useSyncExternalStore } from 'react';

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

function safeWrite(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* quota */ }
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
