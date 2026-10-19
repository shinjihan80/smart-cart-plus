'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { usePlan } from '@/lib/usePlan';
import type { PlanTier } from '@/types';

function SuccessContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const { setTier } = usePlan();
  const [state, setState] = useState<'confirming' | 'done' | 'error'>('confirming');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const paymentKey = params.get('paymentKey');
    const orderId    = params.get('orderId');
    const amount     = params.get('amount');
    const plan       = params.get('plan') as PlanTier | null;

    if (!paymentKey || !orderId || !amount) {
      // billing-success/page.tsx와 같은 사유 — 파라미터 없이 이 URL에
      // 직접 들어오면(북마크·새로고침 등) done이 끝내 true가 안 돼
      // "결제를 확인 중이에요..."에 영원히 머물렀다.
      setErrorMsg('결제 정보가 올바르지 않아요.');
      setState('error');
      return;
    }

    // 서버에서 결제 검증
    fetch('/api/payments/confirm', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.ok) {
          setErrorMsg(data.error ?? '결제 확인에 실패했어요.');
          setState('error');
          return;
        }
        const tier = (data.planTier ?? plan ?? 'pro_lite') as PlanTier;
        setTier(tier);
        setState('done');
      })
      .catch(() => {
        setErrorMsg('네트워크 오류가 발생했어요.');
        setState('error');
      });
  }, [params, setTier]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        {state === 'error' ? (
          <XCircle size={64} className="text-red-400 mx-auto mb-5" strokeWidth={1.5} />
        ) : (
          <CheckCircle size={64} className="text-brand-success mx-auto mb-5" strokeWidth={1.5} />
        )}
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {state === 'error' ? '결제 확인 실패' : '결제 완료!'}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {state === 'confirming' && '결제를 확인 중이에요...'}
          {state === 'done' && 'NEMOA Pro가 활성화됐어요. 이제 AI 기능을 마음껏 사용하세요.'}
          {state === 'error' && errorMsg}
        </p>
        <button
          onClick={() => router.replace('/mypage')}
          className="w-full max-w-xs py-3 rounded-2xl bg-brand-primary text-white font-semibold text-sm"
        >
          내 정보로
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
