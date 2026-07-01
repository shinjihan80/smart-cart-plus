'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { useModalA11y } from '@/lib/useModalA11y';
import { usePlan } from '@/lib/usePlan';
import type { PlanTier } from '@/types';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';

const PLANS = [
  {
    id:        'pro_lite' as PlanTier,
    name:      'Pro Lite',
    monthly:   4900,
    yearly:    49000,
    perMonth:  Math.round(49000 / 12),
    features:  ['AI 사진 분석 30회/일', 'AI 텍스트 60회/일', '레시피 142종+', '파트너 할인', '이메일 지원'],
  },
  {
    id:        'pro_max' as PlanTier,
    name:      'Pro Max',
    monthly:   9900,
    yearly:    99000,
    perMonth:  Math.round(99000 / 12),
    features:  ['AI 전 기능 무제한', '자동 클라우드 동기화', '레시피 142종+', '파트너 VIP 할인', '24시간 우선 지원'],
  },
];

interface UpgradeSheetProps {
  open:    boolean;
  onClose: () => void;
}

export default function UpgradeSheet({ open, onClose }: UpgradeSheetProps) {
  useModalA11y(onClose, open);
  const { setTier }  = usePlan();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState<PlanTier | null>(null);

  const handleUpgrade = useCallback(async (plan: typeof PLANS[0]) => {
    if (!TOSS_CLIENT_KEY) {
      alert('결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setLoading(plan.id);
    try {
      const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
      const toss    = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = toss.payment({ customerKey: ANONYMOUS });

      const amount  = billing === 'yearly' ? plan.yearly  : plan.monthly;
      const orderId = `nemoa-user-${plan.id}-${Date.now()}`;

      await payment.requestPayment({
        method:      'CARD',
        amount:      { currency: 'KRW', value: amount },
        orderId,
        orderName:   `NEMOA ${plan.name} (${billing === 'yearly' ? '연간' : '월간'})`,
        successUrl:  `${window.location.origin}/payment/success?plan=${plan.id}`,
        failUrl:     `${window.location.origin}/payment/fail`,
      });
      // requestPayment는 리다이렉트 방식 — 이후 코드는 실행 안 됨
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code !== 'USER_CANCEL') {
        alert('결제 중 오류가 발생했어요. 다시 시도해주세요.');
      }
      setLoading(null);
    }
  }, [billing]);

  // 개발/테스트용 플랜 적용 (Toss 미설정 시)
  const handleDevUpgrade = useCallback((planId: PlanTier) => {
    setTier(planId);
    onClose();
  }, [setTier, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="요금제 업그레이드"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{ y: 80,    opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-md bg-white rounded-t-[32px] px-5 pt-5 pb-10 max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <button onClick={onClose} aria-label="닫기" className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-gray-400">
            <X size={20} />
          </button>

          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900">NEMOA Pro 업그레이드</h2>
            <p className="text-sm text-gray-400 mt-1">AI 한도 해제 · 클라우드 동기화 · 레시피 142종+</p>
          </div>

          {/* 결제 주기 토글 */}
          <div className="flex bg-gray-100 rounded-full p-0.5 mb-5 self-start w-fit mx-auto">
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  billing === b ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {b === 'monthly' ? '월간' : '연간'}{b === 'yearly' && <span className="ml-1 text-brand-primary">−17%</span>}
              </button>
            ))}
          </div>

          {/* 플랜 카드 */}
          <div className="flex flex-col gap-3">
            {PLANS.map((plan) => {
              const price = billing === 'yearly' ? plan.perMonth : plan.monthly;
              return (
                <div key={plan.id} className="rounded-[24px] border border-brand-primary/20 bg-brand-primary/3 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-400">
                        {billing === 'yearly' ? `₩${plan.yearly.toLocaleString()}/년` : `₩${plan.monthly.toLocaleString()}/월`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-primary">₩{price.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">/월</p>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-1 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <Check size={12} strokeWidth={3} className="text-brand-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => TOSS_CLIENT_KEY ? handleUpgrade(plan) : handleDevUpgrade(plan.id)}
                    disabled={loading === plan.id}
                    className="w-full py-3 rounded-2xl bg-brand-primary text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[.98] transition-all"
                  >
                    {loading === plan.id
                      ? <><Loader2 size={14} className="animate-spin" /> 결제창 열는 중...</>
                      : TOSS_CLIENT_KEY
                        ? `${plan.name} 시작하기`
                        : `${plan.name} 적용 (테스트)`
                    }
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-gray-300 text-center mt-4">
            구독은 언제든 해지할 수 있어요. 결제는 토스페이먼츠가 처리합니다.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
