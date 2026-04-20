'use client';

import { useCallback } from 'react';
import { createSharedStore } from './sharedStore';

const STORAGE_KEY = 'nemoa-profiles';

export type Relation = '본인' | '배우자' | '자녀' | '부모' | '기타';

export interface BodyInfo {
  heightCm?: number;   // 키
  weightKg?: number;   // 몸무게
  topSize?:  string;   // 상의 사이즈 (덮어쓰기 가능, 빈 값이면 권장값 사용)
  bottomSize?: string; // 하의 사이즈
  shoeSize?: number;   // 신발 사이즈 (mm)
}

export interface Profile {
  id:        string;
  name:      string;
  relation:  Relation;
  body:      BodyInfo;
  isMain?:   boolean;  // 본인 표시 (최초 1명)
  createdAt: number;
}

// ─── 기본 프로필 시드 ────────────────────────────────────────────────────────
function createDefaultProfile(): Profile {
  return {
    id:        `p-${Date.now()}`,
    name:      '나',
    relation:  '본인',
    body:      {},
    isMain:    true,
    createdAt: Date.now(),
  };
}

const store = createSharedStore<Profile[]>({
  storageKey: STORAGE_KEY,
  initial:    [createDefaultProfile()],
  validate:   (raw) => {
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const cleaned = raw.filter((p): p is Profile =>
      !!p && typeof p === 'object'
      && typeof (p as Record<string, unknown>).id === 'string'
      && typeof (p as Record<string, unknown>).name === 'string',
    );
    return cleaned.length > 0 ? cleaned : null;
  },
});

// ─── 훅 ──────────────────────────────────────────────────────────────────────
export function useProfiles() {
  const profiles = store.useStore();
  const main = profiles.find((p) => p.isMain) ?? profiles[0];

  const add = useCallback((name: string, relation: Relation) => {
    const p: Profile = {
      id:        `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name:      name.trim(),
      relation,
      body:      {},
      createdAt: Date.now(),
    };
    store.setState((prev) => [...prev, p]);
    return p;
  }, []);

  const remove = useCallback((id: string) => {
    store.setState((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target || target.isMain) return prev; // 본인 프로필은 삭제 불가
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<Profile, 'id'>>) => {
    store.setState((prev) => prev.map((p) =>
      p.id === id ? { ...p, ...patch, body: { ...p.body, ...patch.body } } : p,
    ));
  }, []);

  return { profiles, main, add, remove, update };
}
