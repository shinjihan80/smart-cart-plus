'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { haptic, isHapticEnabled, setHapticEnabled } from '@/lib/haptics';
import { playChime, isChimeEnabled, setChimeEnabled } from '@/lib/chime';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '@/lib/analytics';
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
  }

  const toggles = [
    { label: '햅틱 피드백', desc: '탭·스와이프 시 짧은 진동', on: hapticOn, toggle: toggleHaptic },
    { label: '알림음',       desc: '타이머 완료 시 짧은 비프', on: chimeOn,  toggle: toggleChime  },
    { label: '익명 사용 통계', desc: '개인정보 없이 "오늘 몇 명이 썼나"만 집계 — 서비스 개선용', on: analyticsOn, toggle: toggleAnalytics },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.2 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">✨</span>
        <span className="text-xs text-gray-400 font-medium">피드백</span>
      </div>
      <div className="flex flex-col gap-2">
        {toggles.map((t) => (
          <button
            key={t.label}
            onClick={t.toggle}
            className="flex items-center justify-between gap-3 py-2 px-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{t.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t.desc}</p>
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
  );
}
