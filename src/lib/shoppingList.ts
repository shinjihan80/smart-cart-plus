'use client';

import { useCallback } from 'react';
import { createSharedStore } from './sharedStore';

const STORAGE_KEY = 'nemoa-shopping-list';

export interface ShoppingItem {
  id:        string;
  name:      string;
  source?:   string;
  createdAt: number;
}

function isValidItem(x: unknown): x is ShoppingItem {
  return !!x && typeof x === 'object'
    && typeof (x as Record<string, unknown>).id === 'string'
    && typeof (x as Record<string, unknown>).name === 'string';
}

const store = createSharedStore<ShoppingItem[]>({
  storageKey: STORAGE_KEY,
  initial:    [],
  validate:   (raw) => (Array.isArray(raw) ? raw.filter(isValidItem) : null),
});

export function useShoppingList() {
  const list = store.useStore();

  const has = useCallback(
    (name: string) => list.some((it) => it.name === name),
    [list],
  );

  const add = useCallback((name: string, source?: string) => {
    store.setState((prev) => {
      if (prev.some((it) => it.name === name)) return prev;
      return [
        ...prev,
        {
          id:        `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          source,
          createdAt: Date.now(),
        },
      ];
    });
  }, []);

  const remove = useCallback((id: string) => {
    store.setState((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clear = useCallback(() => {
    store.setState(() => []);
  }, []);

  return { list, has, add, remove, clear };
}
