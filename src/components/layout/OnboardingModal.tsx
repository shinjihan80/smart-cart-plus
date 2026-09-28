'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalA11y } from '@/lib/useModalA11y';
import EmojiIcon from '@/components/EmojiIcon';

interface Step {
  emoji: string;
  title: string;
  desc:  string;
}

const STEPS: Step[] = [
  {
    emoji: '🟦',
    title: '네모아에 오신 것을 환영해요',
    desc: '일상을 반듯한 네모로 모으는\nAI 라이프스타일 비서예요.',
  },
  {
    emoji: '📸',
    title: '사진 한 장이면 충분해요',
    desc: '식품 라벨이나 의류 사이즈표를\n네모아가 자동 분류·등록해요.',
  },
  {
    emoji: '🧊',
    title: '스마트 냉장고',
    desc: '보관 기한·영양 밸런스부터\n오늘 만들 레시피까지 챙겨드려요.\n쓰는 냉장고 종류는 냉장고 탭에서 골라주세요.',
  },
  {
    emoji: '👕',
    title: '스마트 옷장',
    desc: '실시간 날씨로 오늘의 코디 매칭.\n오래 안 입은 옷도 다시 꺼내볼까요?',
  },
  {
    emoji: '📝',
    title: '오늘 뭘 입고, 뭘 만들었는지 기록해요',
    desc: '간단한 한 탭으로 착용·조리 로그가 쌓이고\n자주 쓰는 옷과 요리가 드러나요.',
  },
  {
    emoji: '💾',
    title: '데이터는 언제나 안전하게',
    desc: '내 정보에서 한 번에 백업하고\n새 기기에서 그대로 복원할 수 있어요.',
  },
  {
    emoji: '🔍',
    title: '어디서든 빠른 탐색',
    desc: '냉장고·옷장·내 정보 화면 우측 상단\n돋보기 버튼으로 레시피·제철을\n바로 찾을 수 있어요.',
  },
];

function OnboardingContent({ step, setStep, onClose }: { step: number; setStep: (s: number) => void; onClose: () => void }) {
  useModalA11y(onClose);

  function handleNext() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onClose();
  }

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="네모아 소개"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white rounded-[32px] py-10 text-center w-[320px] px-8"
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
            <div className="flex justify-center mb-5"><EmojiIcon emoji={current.emoji} size={48} className="text-brand-primary" /></div>
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
            onClick={onClose}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            건너뛰기
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  // 예전엔 동의 직후 자동으로 떴다(P1-12) — 동의 1탭 + 8장 캐러셀(건너뛰기
  // 눌러도 최소 1탭 더)을 거쳐야 겨우 원래 홈으로 돌아와, 홈의 기존
  // "첫 항목 등록하기" CTA(1탭으로 등록 시트 직행, 이미 정상 동작)에
  // 닿기까지 총 10탭 이상이 걸렸다 — 카피는 "하나만 등록해보면 감이
  // 와요"라고 약속하는데 실제로는 그 전에 설정 부담부터 온 셈이다
  // (P0-56, 전문단 E1 발견). 자동 노출을 없애고 "설정 > 온보딩 다시
  // 보기"에서만 여는 순수 리플레이 전용 투어로 바꾼다.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onReplay() {
      setStep(0);
      setShow(true);
    }
    window.addEventListener('nemoa:replay-onboarding', onReplay);
    return () => window.removeEventListener('nemoa:replay-onboarding', onReplay);
  }, []);

  function handleClose() {
    setShow(false);
  }

  if (!show) return null;
  return <OnboardingContent step={step} setStep={setStep} onClose={handleClose} />;
}
