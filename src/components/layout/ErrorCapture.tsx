'use client';

import { useInstallErrorHandlers } from '@/lib/errorLog';

/**
 * 최상위 레이아웃에 마운트 — window.onerror / unhandledrejection 핸들러 설치.
 * 렌더링 없음.
 */
export default function ErrorCapture() {
  useInstallErrorHandlers();
  return null;
}
