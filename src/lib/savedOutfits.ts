'use client';

import { useCallback } from 'react';
import { createSharedStore } from './sharedStore';

const STORAGE_KEY = 'nemoa-saved-outfits';

/**
 * 사용자가 저장한 코디 — 슬롯별 아이템 id 매핑 + 메모.
 * OutfitPreview에서 "저장" 클릭 시 추가, /closet에서 불러오기.
 */
export interface SavedOutfit {
  id:         string;
  name:       string;    // 예: '봄 출근 코디'
  slots:      Record<string, string>;  // slot key → clothing id
  createdAt:  number;
}

function isValidOutfit(x: unknown): x is SavedOutfit {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string'
    && typeof o.name === 'string'
    && typeof o.slots === 'object' && o.slots !== null
    && typeof o.createdAt === 'number';
}

const store = createSharedStore<SavedOutfit[]>({
  storageKey: STORAGE_KEY,
  initial:    [],
  validate:   (raw) => (Array.isArray(raw) ? raw.filter(isValidOutfit) : null),
});

export function useSavedOutfits() {
  const outfits = store.useStore();

  const save = useCallback((name: string, slots: Record<string, string>) => {
    store.setState((prev) => [
      ...prev,
      {
        id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim() || '무제 코디',
        slots,
        createdAt: Date.now(),
      },
    ].slice(-20));  // 최대 20개 유지
  }, []);

  const remove = useCallback((id: string) => {
    store.setState((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return { outfits, save, remove };
}
