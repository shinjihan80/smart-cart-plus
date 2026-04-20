'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'nemoa-recipe-favorites';

function readFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

function writeFavorites(ids: string[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); }
  catch { /* quota — 조용히 실패 */ }
}

/**
 * 레시피 즐겨찾기 훅.
 * SSR에서는 빈 배열, 클라이언트 마운트 후 localStorage에서 복원.
 */
export function useRecipeFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated,  setHydrated]  = useState(false);

  useEffect(() => {
    setFavorites(readFavorites());
    setHydrated(true);
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      writeFavorites(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggle, hydrated };
}
