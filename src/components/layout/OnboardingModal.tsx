'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_KEY = 'smart-cart-onboarded';

const STEPS = [
  {
    emoji: '📸',
    title: '사진으로 자동 등록',
    desc: '식품 라벨이나 의류 사이즈표를\n사진 찍으면 AI가 자동 분석해요.',
  },
  {
    emoji: '🧊',
    title: '스마트 냉장고',
    desc: 'D-Day 추적, 레시피 추천까지.\n식품 관리가 쉬워져요.',
  },
  {
    emoji: '👗',
    title: '스마트 옷장',
    desc: '날씨에 맞는 코디 추천.\n옷장 관리를 AI가 도와줘요.',
  },
];

export default function OnboardingModal() {
  const [show, setShow]   = useState(false);
  const [step, setStep]   = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShow(true);
    }
  }, []);

  function handleClose() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleClose();
  }

  if (!show) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-[320px] bg-white rounded-[32px] px-8 py-10 text-center"
        style={{ boxShadow: '0 20px 60px -15px rgba(0,0,0,0.15)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-6xl mb-5">{current.emoji}</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{current.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{current.desc}</p>
          </motion.div>
        </AnimatePresence>

        {/* 도트 인디케이터 */}
        <div className="flex justify-center gap-1.5 mt-6 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === step ? 'w-4 bg-brand-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full rounded-2xl bg-brand-primary text-white text-sm font-semibold py-3 hover:opacity-90 active:scale-95 transition-all"
        >
          {step < STEPS.length - 1 ? '다음' : '시작하기'}
        </button>

        {step < STEPS.length - 1 && (
          <button
            onClick={handleClose}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            건너뛰기
          </button>
        )}
      </motion.div>
    </div>
  );
}
