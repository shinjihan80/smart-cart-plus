'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Cloud, CloudOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseEnabled } from '@/lib/supabase';
import { useModalA11y } from '@/lib/useModalA11y';

interface LoginSheetProps {
  open:    boolean;
  onClose: () => void;
}

export default function LoginSheet({ open, onClose }: LoginSheetProps) {
  useModalA11y(onClose, open);
  const { user, signInGoogle, signInKakao, signOut } = useAuth();

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
          aria-label="계정 동기화"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{ y: 60,    opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-md bg-white rounded-t-[32px] px-6 pt-6 pb-10"
          style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 핸들 + 닫기 */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <button
            onClick={onClose}
            aria-label="닫기"
            className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>

          {!isSupabaseEnabled ? (
            /* Supabase 미설정 안내 */
            <div className="text-center py-4">
              <CloudOff size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-700">클라우드 동기화 준비 중</p>
              <p className="text-xs text-gray-400 mt-1.5">
                Supabase 연동이 설정되면<br />기기 간 데이터 동기화가 활성화돼요.
              </p>
            </div>
          ) : user ? (
            /* 로그인 상태 */
            <div className="text-center py-2">
              <Cloud size={32} className="mx-auto text-brand-primary mb-3" />
              <p className="text-sm font-bold text-gray-900">{user.email ?? user.id.slice(0, 8)}</p>
              <p className="text-xs text-brand-success mt-1">클라우드 동기화 켜짐</p>
              <button
                onClick={async () => { await signOut(); onClose(); }}
                className="mt-5 w-full py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            /* 로그인 선택 */
            <>
              <div className="mb-5">
                <h2 className="text-base font-bold text-gray-900">다기기 동기화 시작</h2>
                <p className="text-sm text-gray-400 mt-1">
                  로그인하면 냉장고·옷장 데이터가 모든 기기에서 동기화돼요.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* 카카오 */}
                <button
                  onClick={signInKakao}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm text-[#191919] transition-colors active:scale-[.98]"
                  style={{ backgroundColor: '#FEE500' }}
                >
                  <span className="text-lg">💬</span>
                  카카오로 계속하기
                </button>

                {/* 구글 */}
                <button
                  onClick={signInGoogle}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-gray-200 font-semibold text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors active:scale-[.98]"
                >
                  <span className="text-lg">🌐</span>
                  Google로 계속하기
                </button>

                <button
                  onClick={onClose}
                  className="mt-1 text-xs text-gray-400 text-center w-full py-2"
                >
                  로그인 없이 계속 (데이터는 이 기기에만 저장)
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
