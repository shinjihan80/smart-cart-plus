'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CartItem } from '@/types';
import { mockCartItems } from '@/data/mockData';

interface CartContextValue {
  items:         CartItem[];
  addItems:      (newItems: CartItem[]) => void;
  removeItem:    (id: string) => void;
  discardCount:  number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]               = useState<CartItem[]>(mockCartItems);
  const [discardCount, setDiscardCount] = useState(0);

  const addItems = useCallback((newItems: CartItem[]) => {
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDiscardCount((prev) => prev + 1);
  }, []);

  return (
    <CartContext.Provider value={{ items, addItems, removeItem, discardCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
