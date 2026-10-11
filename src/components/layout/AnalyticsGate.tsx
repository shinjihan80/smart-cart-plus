'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useAnalyticsEnabled } from '@/lib/analytics';

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
 *
 * 재검토(C3) — 예전엔 자체 useState+'storage' 이벤트로 구현돼, 같은
 * 탭에서 토글을 꺼도(storage 이벤트는 "다른 탭"에서만 발생) 반영이
 * 안 돼 추적이 계속됐다. useAnalyticsEnabled()가 같은 탭 반응형
 * 구독(useSyncExternalStore)을 제공하므로 그대로 사용 — 토글을 끄는
 * 즉시 이 컴포넌트가 리렌더되어 언마운트된다.
 */
export default function AnalyticsGate() {
  const enabled = useAnalyticsEnabled();

  if (!enabled) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
