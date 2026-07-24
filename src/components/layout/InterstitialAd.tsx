'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { X as XIcon } from 'lucide-react';

const AD_UNIT_ID        = 'DAN-aoUckWDgvl2T8LDk';
const LAUNCH_COUNT_KEY  = 'nemoa-launch-count'; // 누적 실행 횟수(날짜 무관, 계속 증가)
const SHOW_EVERY_N      = 3;                    // 3, 6, 9... 매 N번째 실행마다 노출
const CONSENT_KEY       = 'nemoa-consent-v1';
const ONBOARDING_KEY    = 'smart-cart-onboarded-v3';
const SHOW_DELAY_MS     = 600;

/**
 * 앱을 자주 쓰는 사람일수록 더 자주 보이는 전면 광고 — 매 3번째 "실행"(= 새 페이지 로드)마다 1회.
 * 세션 안에서 페이지 이동으로는 재마운트되지 않으므로 이중 카운트는 안 됨.
 * 약관 동의·온보딩 튜토리얼이 아직 안 끝난 신규 사용자는 카운트에서도 제외(온보딩 중 노출 방지).
 */
export default function InterstitialAd() {
  const [visible, setVisible] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode 등으로 effect가 두 번 도는 것 방지
    ran.current = true;
    if (typeof window === 'undefined') return;

    try {
      const consented = !!localStorage.getItem(CONSENT_KEY);
      const onboarded = !!localStorage.getItem(ONBOARDING_KEY);
      if (!consented || !onboarded) return; // 온보딩 중인 신규 사용자는 카운트도 안 올림

      const prev  = parseInt(localStorage.getItem(LAUNCH_COUNT_KEY) ?? '0', 10) || 0;
      const count = prev + 1;
      localStorage.setItem(LAUNCH_COUNT_KEY, String(count));

      if (count % SHOW_EVERY_N !== 0) return; // 3의 배수 실행일 때만 노출
    } catch {
      return;
    }

    const id = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-[340px] rounded-2xl bg-white p-3 shadow-xl">
        <button
          aria-label="닫기"
          onClick={() => setVisible(false)}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-gray-700"
        >
          <XIcon size={18} />
        </button>

        <span className="block text-[9px] text-gray-300 mb-1">광고</span>
        <div className="flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden" style={{ minHeight: 480 }}>
          <ins
            className="kakao_ad_area"
            style={{ display: 'none' }}
            data-ad-unit={AD_UNIT_ID}
            data-ad-width="320"
            data-ad-height="480"
          />
          <Script src="https://t1.kakaocdn.net/kas/static/ba.min.js" strategy="afterInteractive" />
        </div>
      </div>
    </div>
  );
}
