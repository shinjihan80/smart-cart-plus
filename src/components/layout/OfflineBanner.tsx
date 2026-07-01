'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

/**
 * 오프라인 상태 시 상단에 고정 배너 표시.
 * 온라인 복귀 시 자동으로 숨김.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline  = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online',  onOnline);
    // 마운트 시 현재 상태 동기화
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online',  onOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{ y: -40,    opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-md bg-gray-800 text-white px-4 py-2.5 flex items-center gap-2">
            <WifiOff size={14} className="shrink-0 text-gray-400" />
            <p className="text-xs font-medium">오프라인 상태 — 저장된 데이터는 계속 사용할 수 있어요</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
