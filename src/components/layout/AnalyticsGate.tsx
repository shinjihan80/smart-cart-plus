'use client';

import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { isAnalyticsEnabled } from '@/lib/analytics';

/**
 * Vercel Analytics + Speed Insights — 사용자 동의 시에만 활성.
 *
 * 베이직 정신:
 *   - localStorage `nemoa-analytics`가 'true'면 활성
 *   - 기본값 false → 동의 없이는 추적 안 됨
 *   - 설정 → 피드백 토글에서 사용자가 직접 켤 수 있음
 *
 * Vercel Analytics는 PII 미수집 (URL, 페이지뷰, 익명 디바이스 ID만).
 * 그래도 추적이 사용자 선택이어야 한국 PIPA·EU GDPR 양쪽 모두 안전.
 *
 * 컴포넌트는 SSR 시 마운트되지 않고 클라이언트 마운트 후 토글 확인 → 활성/비활성.
 * 토글이 false면 <Analytics>·<SpeedInsights>를 아예 렌더 안 함 → 스크립트 미주입.
 */
export default function AnalyticsGate() {
  // SSR 안전 lazy init — 마운트 시점 토글 즉시 반영, set-state-in-effect 회피
  const [enabled, setEnabled] = useState(() =>
    typeof window === 'undefined' ? false : isAnalyticsEnabled(),
  );

  useEffect(() => {
    // 다른 탭에서 토글 변경 시 storage 이벤트로 동기화
    function onStorage(e: StorageEvent) {
      if (e.key === 'nemoa-analytics') setEnabled(isAnalyticsEnabled());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!enabled) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
