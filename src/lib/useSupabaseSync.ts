'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseEnabled, cartItemToRow, rowToCartItem, type ItemRow } from '@/lib/supabase';
import type { CartItem } from '@/types';

const SYNC_DEBOUNCE_MS = 2000;

interface SyncOptions {
  userId:   string | null;
  items:    CartItem[];
  archived: CartItem[];
  onMerge:  (snapshot: { items: CartItem[]; archived: CartItem[] }) => void;
}

/**
 * 로그인 상태일 때 items/archived ↔ Supabase 동기화.
 * - 로그인 직후: Supabase → 로컬 머지 (updated_at 기준 최신 우선)
 * - 이후 변경: 디바운스 2초 후 Supabase에 upsert
 */
export function useSupabaseSync({ userId, items, archived, onMerge }: SyncOptions) {
  const mergedRef = useRef(false); // 세션당 한 번만 초기 머지
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserId = useRef<string | null>(null);

  // ── 초기 머지: 로그인 시 Supabase 데이터 내려받아 로컬과 병합 ──────────────
  const mergeFromSupabase = useCallback(async (uid: string) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', uid);

    if (error || !data) return;

    const rows = data as ItemRow[];
    const remoteItems    = rows.filter((r) => !r.archived).map(rowToCartItem);
    const remoteArchived = rows.filter((r) => r.archived).map(rowToCartItem);

    // 로컬 아이템 맵 (id 기준)
    const localMap    = new Map(items.map((i) => [i.id, i]));
    const archiveMap  = new Map(archived.map((i) => [i.id, i]));

    // 원격 우선 머지 — 로컬에 없는 원격 아이템 추가
    const mergedItems: CartItem[] = [...items];
    for (const ri of remoteItems) {
      if (!localMap.has(ri.id)) mergedItems.push(ri);
    }
    const mergedArchived: CartItem[] = [...archived];
    for (const ra of remoteArchived) {
      if (!archiveMap.has(ra.id)) mergedArchived.push(ra);
    }

    // 로컬 아이템 Supabase에 업서트 (로컬에만 있는 것)
    const remoteIds = new Set(rows.map((r) => r.id));
    const toUpload  = [
      ...items.filter((i) => !remoteIds.has(i.id)).map((i) => cartItemToRow(i, uid, false)),
      ...archived.filter((i) => !remoteIds.has(i.id)).map((i) => cartItemToRow(i, uid, true)),
    ];
    if (toUpload.length > 0) {
      await supabase.from('items').upsert(toUpload, { onConflict: 'id' });
    }

    onMerge({ items: mergedItems, archived: mergedArchived });
  }, [items, archived, onMerge]);

  // ── 변경 시 디바운스 upsert ───────────────────────────────────────────────
  const pushToSupabase = useCallback((uid: string, nextItems: CartItem[], nextArchived: CartItem[]) => {
    if (!supabase) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!supabase) return;
      const rows = [
        ...nextItems.map((i) => cartItemToRow(i, uid, false)),
        ...nextArchived.map((i) => cartItemToRow(i, uid, true)),
      ];
      if (rows.length > 0) {
        await supabase.from('items').upsert(rows, { onConflict: 'id' });
      }
    }, SYNC_DEBOUNCE_MS);
  }, []);

  // ── userId 변경 감지 ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseEnabled || !userId) {
      mergedRef.current = false;
      prevUserId.current = null;
      return;
    }

    // 새 사용자 로그인 → 초기 머지
    if (userId !== prevUserId.current) {
      prevUserId.current = userId;
      mergedRef.current = false;
    }

    if (!mergedRef.current) {
      mergedRef.current = true;
      mergeFromSupabase(userId);
      return;
    }

    // 이후 변경분 업서트
    pushToSupabase(userId, items, archived);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, items, archived]);
}
