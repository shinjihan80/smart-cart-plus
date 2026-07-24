'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { X as XIcon } from 'lucide-react';

const AD_UNIT_ID = 'DAN-aoUckWDgvl2T8LDk';
const SHOWN_KEY   = 'nemoa-interstitial-shown'; // sessionStorage — 탭 닫으면 초기화, 세션당 1회
const CONSENT_KEY = 'nemoa-consent-v1';
const ONBOARDING_KEY = 'smart-cart-onboarded-v3';
const SHOW_DELAY_MS = 600;

/**
 * 앱 실행(세션) 당 1회, 홈 화면 진입 직후 잠깐 띄우는 320x480 전면 광고.
 * 약관 동의·온보딩 튜토리얼이 아직 안 끝난 신규 사용자에게는 겹쳐 뜨지 않게 건너뛴다.
 */
export default function InterstitialAd() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (sessionStorage.getItem(SHOWN_KEY)) return; // 이번 세션에 이미 봄
      const consented  = !!localStorage.getItem(CONSENT_KEY);
      const onboarded   = !!localStorage.getItem(ONBOARDING_KEY);
      if (!consented || !onboarded) return; // 신규 사용자 온보딩 중엔 겹치지 않게 스킵
    } catch {
      return;
    }

    const id = setTimeout(() => {
      setVisible(true);
      try { sessionStorage.setItem(SHOWN_KEY, '1'); } catch { /* ignore */ }
    }, SHOW_DELAY_MS);
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
