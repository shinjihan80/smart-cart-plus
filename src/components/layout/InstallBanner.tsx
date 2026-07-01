'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { isNative, IS_IOS } from '@/lib/native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'nemoa-install-banner-dismissed';

/**
 * PWA 설치 배너.
 * - Android Chrome: beforeinstallprompt 이벤트 기반 네이티브 설치 프롬프트
 * - iOS Safari: "홈 화면에 추가" 가이드 텍스트
 * - 이미 네이티브 앱으로 실행 중이면 숨김
 */
export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS]               = useState(false);
  const [dismissed, setDismissed]           = useState(true); // 기본 숨김

  useEffect(() => {
    // 이미 설치됨(네이티브) 또는 standalone 모드 → 숨김
    if (isNative()) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // 이미 닫은 적 있으면 숨김
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // iOS Safari: 설치 가이드 배너
    const isIosSafari = IS_IOS && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (isIosSafari) {
      setShowIOS(true);
      setDismissed(false);
      return;
    }

    // Android Chrome: beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  const visible = !dismissed && (!!deferredPrompt || showIOS);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="fixed top-0 left-0 right-0 z-30 flex justify-center"
        >
          <div className="w-full max-w-md bg-brand-primary text-white px-4 py-3 flex items-center gap-3 shadow-lg">
            <Download size={16} className="shrink-0" />
            <div className="flex-1 min-w-0">
              {showIOS ? (
                <p className="text-xs font-medium leading-snug">
                  홈 화면에 추가하려면 Safari 하단의 <strong>공유 →</strong> <strong>홈 화면에 추가</strong>를 탭하세요.
                </p>
              ) : (
                <p className="text-xs font-medium leading-snug">
                  NEMOA를 홈 화면에 설치하면 더 빠르게 실행돼요.
                </p>
              )}
            </div>
            {!showIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="shrink-0 text-xs font-bold bg-white text-brand-primary px-3 py-1.5 rounded-full"
              >
                설치
              </button>
            )}
            <button onClick={dismiss} aria-label="닫기" className="shrink-0 text-white/80 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
