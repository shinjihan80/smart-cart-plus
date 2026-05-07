'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalA11y } from '@/lib/useModalA11y';
import EmojiIcon from '@/components/EmojiIcon';
import { FridgeModelPicker } from '@/components/fridge/FridgeModelPicker';
import { useFridgeModel } from '@/lib/useFridgeModel';

// v3: 냉장고 모델 선택 step 추가 (기존 v2 사용자도 재온보딩 1회)
const ONBOARDING_KEY = 'smart-cart-onboarded-v3';

interface Step {
  emoji:    string;
  title:    string;
  desc:     string;
  /** 'fridge_model'이면 FridgeModelPicker 렌더링 */
  picker?:  'fridge_model';
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
    desc: '보관 기한·영양 밸런스부터\n오늘 만들 레시피까지 챙겨드려요.',
  },
  {
    emoji: '🧊',
    title: '쓰는 냉장고를 골라주세요',
    desc: '식재료가 어느 칸에 있는지 한눈에 보여드려요.\n나중에 마이페이지에서도 바꿀 수 있어요.',
    picker: 'fridge_model',
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
    desc: '마이페이지에서 한 번에 백업하고\n새 기기에서 그대로 복원할 수 있어요.',
  },
  {
    emoji: '🔍',
    title: '어디서든 빠른 탐색',
    desc: '⌘K (또는 / · Esc) 단축키와\n홈 우측 상단 탐색 버튼으로\n레시피·제철·페이지를 즉시 찾아요.',
  },
];

function OnboardingContent({ step, setStep, onClose }: { step: number; setStep: (s: number) => void; onClose: () => void }) {
  useModalA11y(onClose);
  const [fridgeModelId, setFridgeModelId] = useFridgeModel();

  function handleNext() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onClose();
  }

  const current = STEPS[step];
  const isPicker = current.picker === 'fridge_model';

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
        className={`relative bg-white rounded-[32px] py-10 text-center ${
          isPicker ? 'w-[340px] px-6' : 'w-[320px] px-8'
        }`}
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

            {isPicker && (
              <div className="mt-5 text-left">
                <FridgeModelPicker selected={fridgeModelId} onSelect={setFridgeModelId} compact />
              </div>
            )}
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShow(true);
    }
    // 설정에서 '온보딩 다시 보기' 눌렀을 때 이벤트로 재오픈
    function onReplay() {
      setStep(0);
      setShow(true);
    }
    window.addEventListener('nemoa:replay-onboarding', onReplay);
    return () => window.removeEventListener('nemoa:replay-onboarding', onReplay);
  }, []);

  function handleClose() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    // 첫 방문자에게 홈 검색 샘플 시드 — 이미 검색 기록 있으면 건드리지 않음
    try {
      const existing = localStorage.getItem('nemoa-home-recent-search');
      if (!existing || existing === '[]') {
        localStorage.setItem('nemoa-home-recent-search', JSON.stringify(['딸기', '불고기', '귤']));
      }
    } catch { /* storage full — 조용히 실패 */ }
    setShow(false);
  }

  if (!show) return null;
  return <OnboardingContent step={step} setStep={setStep} onClose={handleClose} />;
}
