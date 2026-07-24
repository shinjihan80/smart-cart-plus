'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { usePlan } from '@/lib/usePlan';
import type { PlanTier } from '@/types';

function BillingSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { setTier } = usePlan();
  const [state, setState] = useState<'confirming' | 'done' | 'error'>('confirming');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const authKey     = params.get('authKey');
    const customerKey = params.get('customerKey');
    const plan        = params.get('plan') as PlanTier | null;
    const cycle       = params.get('cycle');

    if (!authKey || !customerKey || !plan || !cycle) {
      setErrorMsg('결제 정보가 올바르지 않아요.');
      setState('error');
      return;
    }

    fetch('/api/subscription/billing-auth/confirm', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ authKey, customerKey, plan, billingCycle: cycle }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.ok) {
          setErrorMsg(data.error ?? '결제 확인에 실패했어요.');
          setState('error');
          return;
        }
        setTier(data.tier as PlanTier);
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
          {state === 'done' && 'NEMOA Pro가 활성화됐어요. 매 주기 자동으로 갱신돼요.'}
          {state === 'error' && errorMsg}
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

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <BillingSuccessContent />
    </Suspense>
  );
}
