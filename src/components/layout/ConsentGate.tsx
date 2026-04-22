'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

const CONSENT_KEY = 'nemoa-consent-v1';

/**
 * 앱 최초 실행 시 약관·개인정보 동의 시트.
 * 동의 후 localStorage에 표식 저장. 재방문 시 건너뜀.
 * 이미 사용 중이던 사용자(기존 데이터 있음)도 한 번 동의 받아야 할 때 버전 올리면 재표시됨.
 */
export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  const { loadSampleData } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const v = localStorage.getItem(CONSENT_KEY);
    if (!v) setShow(true);
    setReady(true);
  }, []);

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, new Date().toISOString()); } catch { /* quota */ }
    setShow(false);
  }

  function acceptWithSample() {
    accept();
    const n = loadSampleData();
    showToast(`샘플 ${n}개 불러왔어요. 언제든 설정에서 초기화할 수 있어요.`);
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {ready && show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="이용 약관 및 개인정보 동의"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6"
              style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
            >
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">📱</div>
                <h2 className="text-lg font-bold text-gray-900">NEMOA 시작하기 전에</h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  이용 약관과 개인정보 처리방침을 확인해 주세요.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-4 text-[12px] text-gray-700 leading-relaxed">
                <p className="mb-2">
                  ✓ 모든 데이터는 <strong>이 기기에만 저장</strong>되며 서버로 전송되지 않습니다.
                </p>
                <p className="mb-2">
                  ✓ AI 분석(사진·텍스트)은 사용자가 실행할 때만 Anthropic Claude로 전송됩니다.
                </p>
                <p>
                  ✓ 설정에서 언제든 데이터를 완전 삭제할 수 있습니다.
                </p>
              </div>

              <p className="text-[11px] text-gray-500 text-center mb-4">
                <Link href="/legal" className="underline hover:text-brand-primary">
                  전체 약관·개인정보 처리방침 보기 →
                </Link>
              </p>

              <button
                onClick={accept}
                className="w-full rounded-2xl bg-brand-primary text-white text-sm font-bold py-3 hover:opacity-90 active:scale-95 transition-all"
              >
                동의하고 빈 상태로 시작
              </button>
              <button
                onClick={acceptWithSample}
                className="w-full mt-2 rounded-2xl bg-gray-50 border border-gray-100 text-gray-700 text-xs font-semibold py-2.5 hover:bg-gray-100 transition-colors"
              >
                샘플 22개로 체험해보기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
