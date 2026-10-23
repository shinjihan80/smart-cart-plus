'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { useModalA11y } from '@/lib/useModalA11y';
import { usePlan } from '@/lib/usePlan';
import { ensureDeviceId } from '@/lib/deviceId';
import { PAYMENTS_ENABLED } from '@/lib/featureFlags';
import { isAnalyticsEnabled } from '@/lib/analytics';
import { VISION_MONTHLY_LIMITS } from '@/lib/monthlyVisionQuota';
import type { PlanTier } from '@/types';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';
// ProPreviewCard와 같은 집계 키(P0-85) — 두 곳 모두 "관심 있어요"가
// 같은 수요 신호이므로 하나로 합쳐 집계한다.
const INTEREST_KEY = 'nemoa-pro-interest';

// P1-95 — 혜택 목록에 가족 프로필 얘기가 한 줄도 없어, 프로필 한도에
// 걸려 들어온 사용자는 정작 자기가 막힌 이유(가족 프로필 3명+)에 대한
// 답을 못 봤다(C4 실측). ProPreviewCard 비교표 행("프로필(가족 구성원)")
// 과 같은 사실을 여기 피처 목록에도 추가 — 혜택 정의를 한 곳(단일
// 소스 lib/planEntitlements.ts)으로 합치는 전면 개편은 범위 밖, 우선
// 빠진 사실만 채운다.
const PLANS = [
  {
    id:        'pro_lite' as PlanTier,
    name:      'Pro Lite',
    monthly:   4900,
    yearly:    49000,
    perMonth:  Math.round(49000 / 12),
    features:  [`AI 사진 분석 ${VISION_MONTHLY_LIMITS.pro_lite}회/월`, 'AI 텍스트 60회/일', '가족 프로필 무제한', '레시피 142종+', '파트너 할인'],
  },
  {
    id:        'pro_max' as PlanTier,
    name:      'Pro Max',
    monthly:   9900,
    yearly:    99000,
    perMonth:  Math.round(99000 / 12),
    features:  ['AI 전 기능 무제한', '가족 프로필 무제한', '자동 클라우드 동기화', '레시피 142종+', '파트너 VIP 할인'],
  },
];

/** 어떤 한도에서 들어왔는지에 따라 첫 줄에 보여줄 안내 + 해당 혜택을 목록 맨 위로. */
const TRIGGER_INFO: Record<string, { banner: string; keyword: string }> = {
  profile: { banner: '가족 프로필 한도에 닿으셨군요 — Pro는 가족 프로필을 무제한으로 추가할 수 있어요.', keyword: '가족 프로필' },
  sync:    { banner: '클라우드 동기화는 Pro 전용이에요 — 기기를 바꿔도 데이터가 그대로 남아요.', keyword: '클라우드 동기화' },
};

function orderFeatures(features: string[], keyword?: string): string[] {
  if (!keyword) return features;
  const idx = features.findIndex((f) => f.includes(keyword));
  if (idx <= 0) return features;
  return [features[idx], ...features.slice(0, idx), ...features.slice(idx + 1)];
}

interface UpgradeSheetProps {
  open:    boolean;
  onClose: () => void;
  /** 어느 한도에서 열렸는지 — 해당 혜택을 첫 줄에 강조(P1-95). */
  trigger?: 'profile' | 'sync';
}

export default function UpgradeSheet({ open, onClose, trigger }: UpgradeSheetProps) {
  useModalA11y(onClose, open);
  const { setTier }  = usePlan();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState<PlanTier | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interestSaved, setInterestSaved] = useState(false);

  // 재발견(P0-85, C1·C4 재현) — ProfilesSection·설정 화면이 이 시트를
  // PAYMENTS_ENABLED 여부와 무관하게 열어, ProPreviewCard의 "출시
  // 예정" 처리를 우회해 왔다(한 세션 안에서 "출시 예정"과 "지금
  // 시작하기"가 동시에 보인 원인). 호출부마다 플래그를 각자 확인하게
  // 두면 또 잊히므로, 시트 자신이 단일 소스로 렌더를 가른다.
  useEffect(() => {
    if (!open || PAYMENTS_ENABLED) return;
    try { setInterestSaved(localStorage.getItem(INTEREST_KEY) === '1'); } catch {}
  }, [open]);

  const handleUpgrade = useCallback(async (plan: typeof PLANS[0]) => {
    if (!TOSS_CLIENT_KEY) {
      // PAYMENTS_ENABLED가 true인데 결제사 키가 비어있는 설정 누락
      // 상황 — 정상 경로로는 못 들어오지만 방어적으로 남겨둔다.
      setErrorMsg('결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setErrorMsg(null);
    setLoading(plan.id);
    try {
      // 정기결제(빌링) 흐름 — 카드 등록만 여기서 하고, 실제 청구는 서버가
      // /api/subscription/billing-auth/confirm에서 처리한다 (금액은 서버가 재계산).
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const customerKey = ensureDeviceId();
      const toss    = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = toss.payment({ customerKey });

      await payment.requestBillingAuth({
        method:      'CARD',
        successUrl:  `${window.location.origin}/payment/billing-success?plan=${plan.id}&cycle=${billing}`,
        failUrl:     `${window.location.origin}/payment/fail`,
      });
      // requestBillingAuth는 리다이렉트 방식 — 이후 코드는 실행 안 됨
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code !== 'USER_CANCEL') {
        // 재발견(P0-85, E2) — alert()는 포커스를 가로채 뒤 액션을
        // 막고, 모바일 PWA에선 브라우저 chrome 없이 떠서 "앱이
        // 멈췄다"처럼 보인다. 시트 안 인라인 메시지로 대체.
        setErrorMsg('결제 중 오류가 발생했어요. 다시 시도해주세요.');
      }
      setLoading(null);
    }
  }, [billing]);

  // 개발/테스트용 플랜 적용 (Toss 미설정 시) — PAYMENTS_ENABLED 렌더
  // 분기 아래에서만 쓰이므로 결제 killswitch를 우회하지 않는다.
  const handleDevUpgrade = useCallback((planId: PlanTier) => {
    setTier(planId);
    onClose();
  }, [setTier, onClose]);

  const handleInterest = useCallback(() => {
    try { localStorage.setItem(INTEREST_KEY, '1'); } catch {}
    setInterestSaved(true);
    if (isAnalyticsEnabled()) {
      fetch('/api/admin/telemetry/pro-interest', { method: 'POST', keepalive: true }).catch(() => {});
    }
  }, []);

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
          className="relative w-full max-w-md bg-white rounded-t-card px-5 pt-5 pb-10 max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <button onClick={onClose} aria-label="닫기" className="touch-target-44 absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-gray-400">
            <X size={20} />
          </button>

          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900">NEMOA Pro 업그레이드</h2>
            <p className="text-sm text-gray-400 mt-1">AI 한도 해제 · 클라우드 동기화 · 레시피 142종+</p>
            {trigger && TRIGGER_INFO[trigger] && (
              <p className="text-xs text-brand-primary bg-brand-primary/8 rounded-xl px-3 py-2 mt-3 leading-relaxed">
                {TRIGGER_INFO[trigger].banner}
              </p>
            )}
          </div>

          {PAYMENTS_ENABLED ? (
            <>
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
                    <div key={plan.id} className="rounded-panel border border-brand-primary/20 bg-brand-primary/3 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                          <p className="text-xs text-gray-400">
                            {billing === 'yearly' ? `₩${plan.yearly.toLocaleString()}/년` : `₩${plan.monthly.toLocaleString()}/월`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-brand-primary">₩{price.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">/월</p>
                        </div>
                      </div>

                      <ul className="flex flex-col gap-1 mb-4">
                        {orderFeatures(plan.features, trigger ? TRIGGER_INFO[trigger]?.keyword : undefined).map((f) => (
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

              {errorMsg && (
                <p className="text-xs text-danger text-center mt-3 bg-danger/5 rounded-xl px-3 py-2">{errorMsg}</p>
              )}

              <p className="text-xs text-gray-300 text-center mt-4">
                구독은 언제든 해지할 수 있어요. 결제는 토스페이먼츠가 처리합니다.
              </p>
            </>
          ) : (
            // 재발견(P0-85) — ProPreviewCard와 같은 "출시 예정" 모드.
            // 결제사 문구·가격·"시작하기"는 숨기고, 아직 켜지지 않은
            // 기능이라는 걸 분명히 한 채 혜택만 미리 보여준다.
            <>
              <div className="flex flex-col gap-3">
                {PLANS.map((plan) => (
                  <div key={plan.id} className="rounded-panel border border-brand-primary/20 bg-brand-primary/3 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                      <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 rounded-full px-2 py-0.5">출시 예정</span>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {orderFeatures(plan.features, trigger ? TRIGGER_INFO[trigger]?.keyword : undefined).map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <Check size={12} strokeWidth={3} className="text-brand-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <button
                onClick={handleInterest}
                disabled={interestSaved}
                className="w-full mt-4 inline-flex items-center justify-center gap-1 py-3 rounded-2xl bg-brand-primary text-white text-sm font-bold hover:opacity-90 active:scale-[.98] transition-all disabled:opacity-60"
              >
                {interestSaved ? <><Check size={14} strokeWidth={2.5} /> 관심 표시 완료</> : '출시 알림 받기'}
              </button>
              <p className="text-xs text-gray-300 text-center mt-2">
                연락처는 받지 않아요 · 관심 표시만 익명으로 집계돼요
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
