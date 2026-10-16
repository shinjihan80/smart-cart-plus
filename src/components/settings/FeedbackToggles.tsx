'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { haptic, isHapticEnabled, setHapticEnabled } from '@/lib/haptics';
import { playChime, isChimeEnabled, setChimeEnabled } from '@/lib/chime';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '@/lib/analytics';
import { Sparkles } from 'lucide-react';
import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';

/**
 * 햅틱·알림음 on/off 토글.
 * localStorage 기반 (nemoa-haptic-enabled, nemoa-chime-enabled).
 */
export default function FeedbackToggles() {
  const [hapticOn, setHapticOn]     = useState(true);
  const [chimeOn, setChimeOn]       = useState(true);
  const [analyticsOn, setAnalyticsOn] = useState(false);

  // 최초 마운트 시 localStorage 반영
  useEffect(() => {
    setHapticOn(isHapticEnabled());
    setChimeOn(isChimeEnabled());
    setAnalyticsOn(isAnalyticsEnabled());
  }, []);

  function toggleHaptic() {
    const next = !hapticOn;
    setHapticOn(next);
    setHapticEnabled(next);
    if (next) haptic('toggle');  // 켰을 때 한 번 울려 확인
  }

  function toggleChime() {
    const next = !chimeOn;
    setChimeOn(next);
    setChimeEnabled(next);
    if (next) playChime();
  }

  function toggleAnalytics() {
    const next = !analyticsOn;
    setAnalyticsOn(next);
    setAnalyticsEnabled(next);
    // 재검토(/nemoa-review 비판 모드, C3 실측) — 끌 때만 새로고침한다.
    // AnalyticsGate는 useSyncExternalStore로 즉시 반응해 <Analytics/>·
    // <SpeedInsights/>를 언마운트하지만(G3), next/script는 같은 src의
    // <script> 태그를 한 번 로드하면 컴포넌트가 사라져도 DOM에서 지우지
    // 않는다(재삽입 중복 로드 방지를 위한 의도된 캐싱) — 그 결과 "껐다"고
    // 믿은 뒤에도 Vercel Analytics의 라우트 변경 리스너가 같은 탭에서
    // 계속 떠 있었다(실측: 끈 뒤 페이지 이동 2건 추가 전송). 이 자바스크립트
    // 캐싱은 React 쪽에서 되돌릴 방법이 없어, 다음 로드부터 스크립트
    // 자체가 안 꽂히게 새로고침으로 확실히 끊는다. 켤 때는 지연이
    // 문제되지 않아 새로고침하지 않는다.
    if (!next) {
      setTimeout(() => window.location.reload(), 200);
    }
  }

  const toggles = [
    { label: '햅틱 피드백', desc: '탭·스와이프 시 짧은 진동', on: hapticOn, toggle: toggleHaptic },
    { label: '알림음',       desc: '타이머 완료 시 짧은 비프', on: chimeOn,  toggle: toggleChime  },
    // 재검토(C3 실측) — 이 설명이 "세션 핑"만 언급해, 실제로 같이 켜지는
    // Vercel Analytics의 화면 방문(페이지뷰) 추적이 안 적힌 수집으로
    // 남아 있었다. PII·식별자는 Vercel 쪽도 수집하지 않지만(URL·익명
    // 디바이스 ID만), 뭘 보내는지는 빠짐없이 적는다.
    { label: '익명 사용 통계', desc: '세션 핑 + 화면 방문 통계(Vercel Analytics) + 파트너 클릭 집계 + Pro 관심 표시 집계 + 오류 발생 시 진단 정보(오류 메시지·화면 경로) 전송 (개인정보·식별자 없음) — 서비스 개선에 사용', on: analyticsOn, toggle: toggleAnalytics },
  ];

  return (
    <>
      <div className="flex items-center gap-2">
        <Sparkles size={16} strokeWidth={2} className="text-gray-600" aria-hidden />
        <span className="text-base font-bold text-gray-900 tracking-tight">피드백</span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.2 }}
        className={CARD}
        style={CARD_SHADOW}
      >
      <div className="flex flex-col gap-2">
        {toggles.map((t) => (
          <button
            key={t.label}
            onClick={t.toggle}
            className="flex items-center justify-between gap-3 py-2 px-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{t.label}</p>
              <p className="text-sm text-gray-400 mt-0.5">{t.desc}</p>
            </div>
            <div
              role="switch"
              aria-checked={t.on}
              className={`shrink-0 w-9 h-5 rounded-full relative transition-colors ${
                t.on ? 'bg-brand-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  t.on ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        ))}
      </div>
      </motion.div>
    </>
  );
}
