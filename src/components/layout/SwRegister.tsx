'use client';

import { useEffect } from 'react';

/**
 * Service Worker 등록 — 프로덕션에서만 활성화.
 * 개발 모드에서는 HMR과 충돌하므로 등록 해제까지 수행.
 * src/app/sw.js/route.ts가 /sw.js를 서빙 — 정적 public 파일이 아니라
 * Route Handler인 이유는 VERSION을 배포마다 커밋 SHA로 자동 갱신하기
 * 위해서(P1-35, 캐시 영구 누적 버그 수정).
 */
export default function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const isLocalhost =
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.hostname === '0.0.0.0';

    if (process.env.NODE_ENV !== 'production' || isLocalhost) {
      // 개발 환경에서는 기존 SW가 남아있을 수 있으므로 해제
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).catch(() => {});
      return;
    }

    // 페이지 로드 후 등록 — 초기 렌더링 방해 안 하도록
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // 새 버전 감지 시 즉시 활성화 (업데이트 알림은 별도 UI 필요 시 확장)
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                nw.postMessage('SKIP_WAITING');
              }
            });
          });
        })
        .catch(() => {
          // 등록 실패해도 앱은 정상 동작 — 조용히 무시
        });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
