'use client';

import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import SyncBridge from '@/components/layout/SyncBridge';
import NativeInit from '@/components/layout/NativeInit';
import NotificationScheduler from '@/components/layout/NotificationScheduler';
import AutoSnapshotScheduler from '@/components/layout/AutoSnapshotScheduler';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <SyncBridge />
          <NativeInit />
          <NotificationScheduler />
          <AutoSnapshotScheduler />
          {children}
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
