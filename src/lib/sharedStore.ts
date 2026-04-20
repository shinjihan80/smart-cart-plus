'use client';

import { useEffect, useState } from 'react';

/**
 * localStorage 기반 공유 스토어 팩토리.
 * 같은 키를 쓰는 모든 훅 인스턴스가 하나의 메모리 상태를 공유하고,
 * 한 곳에서 write하면 모든 구독자에게 즉시 재렌더가 전파된다.
 *
 * 같은 탭 내: 모듈 레벨 Set<listener> 순회
 * 다른 탭 (선택): window.addEventListener('storage', ...) 로도 동기화
 */
export interface SharedStore<T> {
  getState:   () => T;
  setState:   (updater: (prev: T) => T) => void;
  useStore:   () => T;
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
  let state:     T           = opts.initial;     // SSR 기본값 → 첫 훅 마운트에서 hydrate
  let hydrated: boolean      = false;
  const listeners: Set<() => void> = new Set();

  function hydrate() {
    if (hydrated) return;
    state = safeRead(opts.storageKey, opts.initial, opts.validate);
    hydrated = true;
  }

  function getState(): T {
    return state;
  }

  function setState(updater: (prev: T) => T) {
    if (!hydrated) hydrate();
    const next = updater(state);
    if (next === state) return;
    state = next;
    safeWrite(opts.storageKey, state);
    listeners.forEach((l) => l());
  }

  function useStore(): T {
    const [, setVersion] = useState(0);
    useEffect(() => {
      // 마운트 시 처음 hydrate (SSR 기본값이었다면)
      if (!hydrated) {
        hydrate();
        setVersion((v) => v + 1);
      }
      const listener = () => setVersion((v) => v + 1);
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    }, []);
    return state;
  }

  return { getState, setState, useStore };
}
