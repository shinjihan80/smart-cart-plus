'use client';

import { useCallback } from 'react';
import { createSharedStore } from './sharedStore';

const STORAGE_KEY = 'nemoa-recipe-favorites';

const store = createSharedStore<string[]>({
  storageKey: STORAGE_KEY,
  initial:    [],
  validate:   (raw) => (Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : null),
});

export function useRecipeFavorites() {
  const favorites = store.useStore();

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const toggle = useCallback((id: string) => {
    store.setState((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  }, []);

  return { favorites, isFavorite, toggle };
}
