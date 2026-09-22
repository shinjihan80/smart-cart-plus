'use client';

import { useCallback } from 'react';
import { createSharedStore } from './sharedStore';

const STORAGE_KEY  = 'nemoa-notification-log';
const MAX_ENTRIES  = 30;

export type NotificationKind = 'expiry' | 'codi';

export interface NotificationLogEntry {
  id:        string;
  kind:      NotificationKind;
  title:     string;
  body:      string;
  createdAt: string; // ISO
  read:      boolean;
}

const store = createSharedStore<NotificationLogEntry[]>({
  storageKey: STORAGE_KEY,
  initial:    [],
  validate:   (raw) => (Array.isArray(raw) ? (raw as NotificationLogEntry[]) : null),
});

/**
 * 알림을 실제로 화면에 띄운 시점에 기록 — dedupeKey(대개 알림 tag)가 같은 게
 * 오늘 이미 있으면 다시 쓰지 않는다. scheduler의 "하루 1회" 체크와 별개로,
 * 여러 컴포넌트에서 중복 호출돼도 목록에 같은 알림이 여러 줄 쌓이지 않게.
 */
export function addNotificationLogEntry(entry: {
  kind: NotificationKind;
  title: string;
  body: string;
  dedupeKey: string;
}) {
  const id = `${entry.dedupeKey}:${new Date().toDateString()}`;
  store.setState((prev) => {
    if (prev.some((e) => e.id === id)) return prev;
    const next: NotificationLogEntry = {
      id,
      kind:      entry.kind,
      title:     entry.title,
      body:      entry.body,
      createdAt: new Date().toISOString(),
      read:      false,
    };
    return [next, ...prev].slice(0, MAX_ENTRIES);
  });
}

export function useNotificationLog() {
  const entries = store.useStore();
  const unreadCount = entries.filter((e) => !e.read).length;

  const markAllRead = useCallback(() => {
    store.setState((prev) => (prev.every((e) => e.read) ? prev : prev.map((e) => ({ ...e, read: true }))));
  }, []);

  const markRead = useCallback((id: string) => {
    store.setState((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
  }, []);

  const clear = useCallback(() => {
    store.setState(() => []);
  }, []);

  return { entries, unreadCount, markAllRead, markRead, clear };
}
