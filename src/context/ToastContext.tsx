'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastContextValue {
  showToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <AnimatePresence>
        {toast && (
          <motion.div
            key="global-toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4"
          >
            <div className="rounded-2xl bg-gray-900 text-white text-sm font-medium px-4 py-3 text-center shadow-lg">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
