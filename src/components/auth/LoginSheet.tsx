'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cloud, CloudOff, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseEnabled } from '@/lib/supabase';
import { useModalA11y } from '@/lib/useModalA11y';

interface LoginSheetProps {
  open:    boolean;
  onClose: () => void;
}

type View = 'choose' | 'login' | 'signup';

export default function LoginSheet({ open, onClose }: LoginSheetProps) {
  useModalA11y(onClose, open);
  const { user, signInGoogle, signUpEmail, signInEmail, signOut } = useAuth();
  const [view, setView]           = useState<View>('choose');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  if (!open) return null;

  function resetForm() {
    setEmail(''); setPassword(''); setError(null); setSignupSent(false);
  }

  function goTo(next: View) {
    resetForm();
    setView(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || submitting) return;
    setSubmitting(true);
    setError(null);
    const err = view === 'signup' ? await signUpEmail(email, password) : await signInEmail(email, password);
    setSubmitting(false);
    if (err) { setError(err); return; }
    if (view === 'signup') {
      setSignupSent(true); // 이메일 확인이 필요한 설정이면 여기서 안내, 아니면 user가 곧 채워져 자동으로 로그인 화면으로 전환됨
    } else {
      onClose();
    }
  }

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
          {/* 핸들 */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

          {/* 뒤로가기 (로그인/가입 폼일 때만) */}
          {!user && view !== 'choose' && (
            <button
              onClick={() => goTo('choose')}
              aria-label="뒤로"
              className="absolute top-5 left-5 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
          )}
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
          ) : view === 'choose' ? (
            /* 로그인 방법 선택 */
            <>
              <div className="mb-5">
                <h2 className="text-base font-bold text-gray-900">다기기 동기화 시작</h2>
                <p className="text-sm text-gray-400 mt-1">
                  로그인하면 냉장고·옷장 데이터가 모든 기기에서 동기화돼요.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* 카카오 — 사업자 인증 전이라 이메일 스코프 승인 불가, 임시로 숨김.
                    AuthContext.signInKakao는 그대로 남겨둠, 인증 후 버튼만 복원하면 됨. */}

                {/* 구글 */}
                <button
                  onClick={signInGoogle}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-gray-200 font-semibold text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors active:scale-[.98]"
                >
                  <span className="text-lg">🌐</span>
                  Google로 계속하기
                </button>

                {/* 이메일 */}
                <button
                  onClick={() => goTo('login')}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-gray-200 font-semibold text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors active:scale-[.98]"
                >
                  <Mail size={18} />
                  이메일로 계속하기
                </button>

                <button
                  onClick={onClose}
                  className="mt-1 text-xs text-gray-400 text-center w-full py-2"
                >
                  로그인 없이 계속 (데이터는 이 기기에만 저장)
                </button>
              </div>
            </>
          ) : (
            /* 이메일 로그인 / 회원가입 폼 */
            <>
              <div className="mb-5 mt-2">
                <h2 className="text-base font-bold text-gray-900">
                  {view === 'signup' ? '이메일로 회원가입' : '이메일로 로그인'}
                </h2>
              </div>

              {signupSent ? (
                <div className="text-center py-4">
                  <Mail size={32} className="mx-auto text-brand-primary mb-3" />
                  <p className="text-sm font-semibold text-gray-800">가입 요청을 보냈어요</p>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    이메일 확인이 필요한 경우, {email}로 온<br />확인 메일의 링크를 눌러 완료해주세요.
                  </p>
                  <button
                    onClick={() => goTo('login')}
                    className="mt-5 w-full py-3 rounded-2xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    로그인하러 가기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (6자 이상)"
                    autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                    minLength={6}
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />

                  {error && (
                    <p className="text-xs text-red-500 px-1">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
                  >
                    {submitting ? '처리 중…' : view === 'signup' ? '가입하기' : '로그인'}
                  </button>

                  <button
                    type="button"
                    onClick={() => goTo(view === 'signup' ? 'login' : 'signup')}
                    className="text-xs text-gray-400 text-center w-full py-1"
                  >
                    {view === 'signup' ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                  </button>
                </form>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
