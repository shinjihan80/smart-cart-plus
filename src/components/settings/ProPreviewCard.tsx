'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ChevronDown } from 'lucide-react';
import { springTransition, CARD, CARD_SHADOW } from '@/components/closet/shared';
import { usePlan, PLAN_LABEL } from '@/lib/usePlan';
import { TIER_LIMITS } from '@/lib/aiQuota';
import type { PlanTier } from '@/types';

const TIERS: { id: PlanTier; price: string; priceYear: string; color: string }[] = [
  { id: 'free',     price: '무료',       priceYear: '',            color: 'border-gray-200 bg-gray-50' },
  { id: 'pro_lite', price: '₩4,900/월',  priceYear: '₩49,000/년', color: 'border-brand-primary bg-brand-primary/5' },
  { id: 'pro_max',  price: '₩9,900/월',  priceYear: '₩99,000/년', color: 'border-brand-primary bg-brand-primary/5' },
];

interface Row {
  label:    string;
  free:     React.ReactNode;
  pro_lite: React.ReactNode;
  pro_max:  React.ReactNode;
}

function Tick({ ok }: { ok: boolean }) {
  return ok
    ? <Check size={12} strokeWidth={3} className="text-brand-primary" />
    : <X    size={12} strokeWidth={3} className="text-gray-300" />;
}

const ROWS: Row[] = [
  {
    label: 'AI 사진 분석',
    free:     `${TIER_LIMITS.free.vision}회/일`,
    pro_lite: `${TIER_LIMITS.pro_lite.vision}회/일`,
    pro_max:  '무제한',
  },
  {
    label: 'AI 텍스트 파싱',
    free:     `${TIER_LIMITS.free.parser}회/일`,
    pro_lite: `${TIER_LIMITS.pro_lite.parser}회/일`,
    pro_max:  '무제한',
  },
  {
    label: '영양·URL 분석',
    free:     `${TIER_LIMITS.free.nutrition + TIER_LIMITS.free.url}회/일`,
    pro_lite: `${TIER_LIMITS.pro_lite.nutrition + TIER_LIMITS.pro_lite.url}회/일`,
    pro_max:  '무제한',
  },
  {
    label:    '분석 리포트',
    free:     <Tick ok={false} />,
    pro_lite: <Tick ok={true}  />,
    pro_max:  <Tick ok={true}  />,
  },
  {
    label:    '클라우드 동기화',
    free:     <Tick ok={false} />,
    pro_lite: '수동',
    pro_max:  '자동',
  },
  {
    label: '레시피 컬렉션',
    free:     '42종',
    pro_lite: '142종+',
    pro_max:  '142종+',
  },
  {
    label:    '파트너 할인',
    free:     <Tick ok={false} />,
    pro_lite: <Tick ok={true}  />,
    pro_max:  <Tick ok={true}  />,
  },
  {
    label:    '우선 지원',
    free:     <Tick ok={false} />,
    pro_lite: '이메일',
    pro_max:  '24시간 내',
  },
];

export default function ProPreviewCard() {
  const [expanded,    setExpanded]    = useState(false);
  const [interested,  setInterested]  = useState(false);
  const { tier: currentTier }         = usePlan();

  function handleNotifyMe() {
    try { localStorage.setItem('nemoa-pro-interest', String(Date.now())); } catch { /* quota */ }
    setInterested(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.05 }}
      className={`${CARD} relative overflow-hidden`}
      style={{
        ...CARD_SHADOW,
        backgroundImage: 'linear-gradient(135deg, rgba(79,70,229,0.04) 0%, rgba(79,70,229,0) 60%)',
      }}
    >
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            NEMOA <span className="text-brand-primary">요금제</span>
          </h3>
          <p className="text-xs text-gray-400">결제 연동 출시 예정</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? '접기' : '자세히'}
          className="text-xs text-gray-500 font-medium flex items-center gap-0.5 hover:text-gray-700"
        >
          {expanded ? '접기' : '상세 비교'}
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* tier cards */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {TIERS.map((t) => {
          const isCurrent = t.id === currentTier;
          return (
            <div
              key={t.id}
              className={`rounded-2xl border px-2 py-2.5 text-center ${t.color} ${isCurrent ? 'ring-2 ring-brand-primary/40' : ''}`}
            >
              {isCurrent && (
                <span className="text-[9px] font-bold text-brand-primary block mb-0.5">현재</span>
              )}
              <p className="text-xs font-bold text-gray-900 leading-tight">{PLAN_LABEL[t.id]}</p>
              <p className="text-[10px] text-brand-primary font-semibold mt-0.5 leading-tight">{t.price}</p>
              {t.priceYear && (
                <p className="text-[9px] text-gray-400 leading-tight">{t.priceYear}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* comparison table */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden mb-3"
        >
          <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
            {/* column header */}
            <div className="grid grid-cols-[1fr,auto,auto,auto] gap-x-2 px-3 py-2 border-b border-gray-50 bg-gray-50/60">
              <span className="text-[10px] text-gray-400 font-medium">기능</span>
              <span className="text-[10px] text-gray-400 font-medium min-w-[2.8rem] text-center">무료</span>
              <span className="text-[10px] text-brand-primary font-medium min-w-[3.2rem] text-center">Lite</span>
              <span className="text-[10px] text-brand-primary font-bold min-w-[3.2rem] text-center">Max</span>
            </div>
            {ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr,auto,auto,auto] gap-x-2 items-center px-3 py-1.5 ${i < ROWS.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <span className="text-xs text-gray-500">{row.label}</span>
                <span className="text-[10px] text-gray-400 tabular-nums min-w-[2.8rem] text-center flex justify-center">{row.free}</span>
                <span className="text-[10px] text-brand-primary tabular-nums min-w-[3.2rem] text-center flex justify-center">{row.pro_lite}</span>
                <span className="text-[10px] text-brand-primary font-semibold tabular-nums min-w-[3.2rem] text-center flex justify-center">{row.pro_max}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA */}
      {currentTier === 'free' && (
        interested ? (
          <div className="text-xs text-brand-success font-semibold text-center py-2 rounded-2xl bg-brand-success/5 border border-brand-success/15">
            ✓ 출시 알림 신청 완료 — 정식 출시 시 알려드릴게요
          </div>
        ) : (
          <button
            onClick={handleNotifyMe}
            className="w-full py-2.5 rounded-2xl bg-brand-primary text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            출시 알림 받기
          </button>
        )
      )}
      {currentTier !== 'free' && (
        <div className="text-xs text-brand-primary font-semibold text-center py-2 rounded-2xl bg-brand-primary/5 border border-brand-primary/15">
          {PLAN_LABEL[currentTier]} 플랜 이용 중
        </div>
      )}
    </motion.div>
  );
}
