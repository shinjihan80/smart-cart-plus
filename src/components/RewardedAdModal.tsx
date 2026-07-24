'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { X as XIcon } from 'lucide-react';

const AD_UNIT_ID = 'DAN-OIIEQHddZ182Dyby';
const VIEW_SECONDS = 8;

interface RewardedAdModalProps {
  agentLabel: string; // "텍스트 파싱" 등 사용자에게 보여줄 기능명
  onClose:    () => void;
  onGranted:  () => void;
}

/**
 * 무료 한도 소진 시 "광고 보고 1회 더" 흐름.
 * 진짜 SDK 기반 리워드 영상은 아니고, 배너를 일정 시간 노출 후 보상을 지급하는 간이 방식.
 */
export default function RewardedAdModal({ agentLabel, onClose, onGranted }: RewardedAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(VIEW_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const ready = secondsLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">광고 보고 1회 더 쓰기</h2>
          <button aria-label="닫기" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <XIcon size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          오늘 {agentLabel} 무료 사용량을 모두 썼어요. 아래 광고를 {VIEW_SECONDS}초만 보면 오늘 한 번 더 쓸 수 있어요.
        </p>

        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl overflow-hidden" style={{ minHeight: 66 }}>
          <span className="text-[9px] text-gray-300 self-start px-1.5 pt-1">광고</span>
          <ins
            className="kakao_ad_area"
            style={{ display: 'none' }}
            data-ad-unit={AD_UNIT_ID}
            data-ad-width="320"
            data-ad-height="50"
          />
          <Script src="https://t1.daumcdn.net/kas/static/ba.min.js" strategy="afterInteractive" />
        </div>

        <button
          type="button"
          disabled={!ready}
          onClick={onGranted}
          className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white bg-brand-primary disabled:bg-gray-300 transition-colors"
        >
          {ready ? '보상 받기' : `${secondsLeft}초 후 받기 가능`}
        </button>
      </div>
    </div>
  );
}
