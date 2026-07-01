'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { usePlan } from '@/lib/usePlan';
import type { PlanTier } from '@/types';

function SuccessContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const { setTier } = usePlan();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const paymentKey = params.get('paymentKey');
    const orderId    = params.get('orderId');
    const amount     = params.get('amount');
    const plan       = params.get('plan') as PlanTier | null;

    if (!paymentKey || !orderId || !amount) return;

    // 서버에서 결제 검증
    fetch('/api/payments/confirm', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          const tier = (data.planTier ?? plan ?? 'pro_lite') as PlanTier;
          setTier(tier);
        }
        setDone(true);
      })
      .catch(() => setDone(true));
  }, [params, setTier]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <CheckCircle size={64} className="text-brand-success mx-auto mb-5" strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-gray-900 mb-2">결제 완료!</h1>
        <p className="text-sm text-gray-500 mb-8">
          {done ? 'NEMOA Pro가 활성화됐어요. 이제 AI 기능을 마음껏 사용하세요.' : '결제를 확인 중이에요...'}
        </p>
        <button
          onClick={() => router.replace('/mypage')}
          className="w-full max-w-xs py-3 rounded-2xl bg-brand-primary text-white font-semibold text-sm"
        >
          마이페이지로
        </button>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
