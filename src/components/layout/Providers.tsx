'use client';

import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import SyncBridge from '@/components/layout/SyncBridge';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <SyncBridge />
          {children}
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
