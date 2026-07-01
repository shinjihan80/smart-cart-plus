'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function FailContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const message = params.get('message') ?? '결제가 취소됐거나 오류가 발생했어요.';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <XCircle size={64} className="text-brand-warning mx-auto mb-5" strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-gray-900 mb-2">결제 실패</h1>
        <p className="text-sm text-gray-500 mb-8">{message}</p>
        <button
          onClick={() => router.replace('/mypage')}
          className="w-full max-w-xs py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm"
        >
          돌아가기
        </button>
      </motion.div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <FailContent />
    </Suspense>
  );
}
