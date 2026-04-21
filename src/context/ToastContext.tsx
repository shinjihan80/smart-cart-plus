'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastData {
  msg:      string;
  onUndo?:  () => void;
}

interface ToastContextValue {
  showToast: (msg: string, onUndo?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((msg: string, onUndo?: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, onUndo });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  function handleUndo() {
    if (toast?.onUndo) toast.onUndo();
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* 스크린리더용 aria-live 영역 — toast가 나오는 즉시 읽힘 */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {toast?.msg ?? ''}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="global-toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4"
          >
            <div className="rounded-2xl bg-gray-900 text-white text-sm font-medium px-4 py-3 shadow-lg flex items-center justify-between gap-3">
              <span>{toast.msg}</span>
              {toast.onUndo && (
                <button
                  onClick={handleUndo}
                  className="shrink-0 text-xs font-bold text-brand-primary bg-white/10 px-2.5 py-1 rounded-xl hover:bg-white/20 transition-colors"
                >
                  되돌리기
                </button>
              )}
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
