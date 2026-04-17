'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { CartItem } from '@/types';
import { mockCartItems } from '@/data/mockData';

const STORAGE_KEY = 'smart-cart-items';
const DISCARD_KEY = 'smart-cart-discard-count';

function loadItems(): CartItem[] {
  if (typeof window === 'undefined') return mockCartItems;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CartItem[];
      return parsed.length > 0 ? parsed : mockCartItems;
    }
  } catch { /* ignore */ }
  return mockCartItems;
}

function loadDiscardCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return parseInt(localStorage.getItem(DISCARD_KEY) ?? '0', 10);
  } catch { return 0; }
}

interface CartContextValue {
  items:         CartItem[];
  addItems:      (newItems: CartItem[]) => void;
  removeItem:    (id: string) => void;
  resetData:     () => void;
  discardCount:  number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]               = useState<CartItem[]>(loadItems);
  const [discardCount, setDiscardCount] = useState<number>(loadDiscardCount);

  // localStorage 동기화
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(DISCARD_KEY, String(discardCount));
  }, [discardCount]);

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
