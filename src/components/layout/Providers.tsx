'use client';

import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </CartProvider>
  );
}
