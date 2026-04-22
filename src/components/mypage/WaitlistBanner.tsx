'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { usePersistedState } from '@/lib/usePersistedState';
import { useToast } from '@/context/ToastContext';
import { springTransition, CARD_SHADOW } from '@/components/mypage/shared';

const WAITLIST_ENDPOINT = process.env.NEXT_PUBLIC_WAITLIST_ENDPOINT || '';

/**
 * Pro 사전 등록 이메일 수집 — 마이페이지 하단 배너.
 *
 * 노출 규칙
 *  - 엔드포인트 미설정 시 숨김 (빈 문자열이면 렌더 없음)
 *  - 사용자가 dismiss 시 영구 숨김 (localStorage)
 *  - 이미 등록한 경우도 숨김
 *
 * 제출 스키마: { email, ts } — 개인 ID 없이 이메일만
 */
export default function WaitlistBanner() {
  const [dismissed, setDismissed]   = usePersistedState('nemoa-waitlist-dismissed', false);
  const [submitted, setSubmitted]   = usePersistedState('nemoa-waitlist-submitted', false);
  const [email, setEmail]           = useState('');
  const [loading, setLoading]       = useState(false);
  const { showToast } = useToast();

  // 엔드포인트 설정 안 된 경우 렌더 안 함 — 출시 초기엔 숨김, MAU 500+ 시 엔드포인트 붙여 활성화
  if (!WAITLIST_ENDPOINT) return null;
  if (dismissed || submitted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      showToast('이메일 주소를 확인해주세요.');
      return;
    }
    setLoading(true);
    try {
      await fetch(WAITLIST_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: trimmed, ts: Date.now() }),
      });
      setSubmitted(true);
      showToast('등록 완료 — Pro 출시 때 가장 먼저 알려드릴게요.');
    } catch {
      showToast('등록에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.3 }}
      className="rounded-[28px] bg-gradient-to-br from-brand-primary/8 to-brand-primary/5 border border-brand-primary/15 px-4 py-4 relative"
      style={CARD_SHADOW}
    >
      <button
        onClick={() => setDismissed(true)}
        aria-label="닫기"
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-brand-primary" />
        <span className="text-xs font-semibold text-brand-primary">곧 만나요 — NEMOA Pro</span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1 tracking-tight">
        무제한 AI · 기기 간 동기화 · 파트너 연결
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">
        사전 등록하면 출시 시점에 1개월 무료 체험권을 먼저 드려요.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="flex-1 min-w-0 text-xs px-3 py-2 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full bg-brand-primary text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? '...' : '사전 등록'}
        </button>
      </form>
      <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
        이메일 외 개인정보는 수집하지 않아요. 언제든 수신 거부 가능.
      </p>
    </motion.div>
  );
}
