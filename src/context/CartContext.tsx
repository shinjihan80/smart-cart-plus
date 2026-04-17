'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { CartItem } from '@/types';
import { mockCartItems } from '@/data/mockData';

const STORAGE_KEY = 'smart-cart-items';
const DISCARD_KEY = 'smart-cart-discard-count';

interface CartContextValue {
  items:         CartItem[];
  addItems:      (newItems: CartItem[]) => void;
  removeItem:    (id: string) => void;
  resetData:     () => void;
  discardCount:  number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // SSR/클라이언트 동일 초기값 (hydration 불일치 방지)
  const [items, setItems]               = useState<CartItem[]>(mockCartItems);
  const [discardCount, setDiscardCount] = useState(0);
  const [hydrated, setHydrated]         = useState(false);

  // 클라이언트 마운트 후 localStorage에서 복원
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        const parsed = JSON.parse(storedItems) as CartItem[];
        if (parsed.length > 0) setItems(parsed);
      }
      const storedCount = localStorage.getItem(DISCARD_KEY);
      if (storedCount) setDiscardCount(parseInt(storedCount, 10));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // localStorage 동기화 (hydration 완료 후에만)
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DISCARD_KEY, String(discardCount));
  }, [discardCount, hydrated]);

  const addItems = useCallback((newItems: CartItem[]) => {
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDiscardCount((prev) => prev + 1);
  }, []);

  const resetData = useCallback(() => {
    setItems(mockCartItems);
    setDiscardCount(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISCARD_KEY);
  }, []);

  return (
    <CartContext.Provider value={{ items, addItems, removeItem, resetData, discardCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
