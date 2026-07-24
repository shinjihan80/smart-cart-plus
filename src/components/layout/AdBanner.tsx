'use client';

import Script from 'next/script';

// 카카오 애드핏 발급 광고 단위 ID — adfit.kakao.com에서 확인/변경
const AD_UNIT_ID = 'DAN-OIIEQHddZ182Dyby';

/**
 * 하단 탭바 바로 위에 고정되는 320x50 배너.
 * ins가 display:none으로 시작해 로드 전 레이아웃이 흔들리므로 wrapper에 고정 높이를 준다.
 */
export default function AdBanner() {
  return (
    <div
      className="fixed left-0 right-0 z-20 flex items-center justify-center bg-white border-t border-gray-100"
      style={{
        bottom: 'calc(5rem + env(safe-area-inset-bottom))',
        height: '58px',
      }}
    >
      <span className="absolute top-0.5 left-1.5 text-[9px] text-gray-300">광고</span>
      <ins
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit={AD_UNIT_ID}
        data-ad-width="320"
        data-ad-height="50"
      />
      <Script src="https://t1.daumcdn.net/kas/static/ba.min.js" strategy="afterInteractive" />
    </div>
  );
}
