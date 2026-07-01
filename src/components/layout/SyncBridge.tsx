'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useSupabaseSync } from '@/lib/useSupabaseSync';
import type { CartItem } from '@/types';

/**
 * AuthContext + CartContext를 연결하는 브릿지 — UI 없음.
 * Providers 안에 배치해 로그인 상태가 바뀔 때 Supabase ↔ 로컬 동기화를 수행한다.
 */
export default function SyncBridge() {
  const { user } = useAuth();
  const { items, archived, restoreAll } = useCart();

  const onMerge = useCallback((snapshot: { items: CartItem[]; archived: CartItem[] }) => {
    restoreAll(snapshot);
  }, [restoreAll]);

  useSupabaseSync({ userId: user?.id ?? null, items, archived, onMerge });

  return null;
}
