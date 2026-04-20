'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'nemoa-shopping-list';

export interface ShoppingItem {
  id:        string;   // 생성 시점 기준 unique
  name:      string;
  source?:   string;   // 추가된 출처 레시피 이름 등
  createdAt: number;   // 정렬 · 백업용 타임스탬프
}

function readList(): ShoppingItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is ShoppingItem =>
          x && typeof x === 'object' && typeof x.id === 'string' && typeof x.name === 'string',
        )
      : [];
  } catch { return []; }
}

function writeList(list: ShoppingItem[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  catch { /* quota */ }
}

export function useShoppingList() {
  const [list, setList]   = useState<ShoppingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setList(readList());
    setHydrated(true);
  }, []);

  const has = useCallback(
    (name: string) => list.some((it) => it.name === name),
    [list],
  );

  const add = useCallback((name: string, source?: string) => {
    setList((prev) => {
      if (prev.some((it) => it.name === name)) return prev;
      const next: ShoppingItem[] = [
        ...prev,
        { id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, source, createdAt: Date.now() },
      ];
      writeList(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setList((prev) => {
      const next = prev.filter((it) => it.id !== id);
      writeList(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setList([]);
    writeList([]);
  }, []);

  return { list, has, add, remove, clear, hydrated };
}
