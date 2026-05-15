'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cloud, Infinity as InfinityIcon, Gift, ChevronDown } from 'lucide-react';
import { springTransition, CARD, CARD_SHADOW } from '@/components/closet/shared';

/**
 * Pro 미리보기 카드 — Phase A 결제 인프라 도입 전 단계.
 *
 * 베이직 사용자에게 "Pro 가 무엇인지" 한 화면에 보여주고,
 * 출시 시점에 알림을 받을 수 있도록 의향(intent) 만 저장.
 *
 * 실제 결제 흐름은 Phase A 에서 Supabase + 토스페이먼츠 연동 예정.
 */
export default function ProPreviewCard() {
  const [expanded, setExpanded] = useState(false);
  const [interested, setInterested] = useState(false);

  function handleNotifyMe() {
    try {
      localStorage.setItem('nemoa-pro-interest', String(Date.now()));
    } catch { /* storage full — 조용히 실패 */ }
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
        backgroundImage: 'linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(79, 70, 229, 0) 60%)',
      }}
    >
      {/* 우상단 장식 */}
      <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-brand-primary/5" />

      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-brand-primary text-white flex items-center justify-center">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                NEMOA <span className="text-brand-primary">Pro</span>
              </h3>
              <p className="text-xs text-gray-400">곧 출시 예정</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? '접기' : '자세히'}
            className="text-xs text-gray-500 font-medium flex items-center gap-0.5 hover:text-gray-700"
          >
            {expanded ? '접기' : '자세히'}
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          무제한 AI · 여러 기기 자동 동기화 · 파트너 직접 연동까지.
          <br />월 <span className="font-bold text-gray-900">₩4,900</span> · 연 <span className="font-bold text-gray-900">₩49,000</span> (2개월 무료)
        </p>

        {/* 핵심 4가지 — 항상 노출 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <FeatureBadge icon={InfinityIcon} label="AI 무제한" sub="베이직 한도 해제" />
          <FeatureBadge icon={Cloud}         label="자동 동기화" sub="여러 기기 즉시 반영" />
          <FeatureBadge icon={Gift}          label="파트너 할인" sub="제휴 코드 자동 적용" />
          <FeatureBadge icon={Sparkles}      label="레시피 142+" sub="계절·셰프 큐레이션" />
        </div>

        {/* 펼침 — 상세 비교 */}
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-white border border-gray-100 px-3 py-2.5 text-xs mb-3">
              <ComparisonRow label="AI vision"      basic="10회/일"  pro="무제한" />
              <ComparisonRow label="AI parser"      basic="20회/일"  pro="무제한" />
              <ComparisonRow label="저장 코디"      basic="20개"     pro="무제한" />
              <ComparisonRow label="프로필"         basic="2명"      pro="무제한" />
              <ComparisonRow label="클라우드 동기화" basic="수동"     pro="자동" />
              <ComparisonRow label="백업 이력"      basic="로컬만"   pro="30일 서버" />
              <ComparisonRow label="레시피"         basic="42종"     pro="142종+" />
              <ComparisonRow label="우선 지원"      basic="이메일"   pro="24시간 내" last />
            </div>
          </motion.div>
        )}

        {/* CTA */}
        {interested ? (
          <div className="text-xs text-brand-success font-semibold text-center py-2 rounded-2xl bg-brand-success/5 border border-brand-success/15">
            ✓ 출시 알림 신청 완료 — 정식 출시 시 이메일/푸시로 알려드릴게요
          </div>
        ) : (
          <button
            onClick={handleNotifyMe}
            className="w-full py-2.5 rounded-2xl bg-brand-primary text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            출시 알림 받기
          </button>
        )}
      </div>
    </motion.div>
  );
}

function FeatureBadge({
  icon: Icon, label, sub,
}: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-gray-100">
      <Icon size={16} strokeWidth={2.25} className="text-brand-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-900 truncate">{label}</p>
        <p className="text-[10px] text-gray-400 truncate">{sub}</p>
      </div>
    </div>
  );
}

function ComparisonRow({
  label, basic, pro, last,
}: { label: string; basic: string; pro: string; last?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr,auto,auto] gap-2 items-center py-1 ${last ? '' : 'border-b border-gray-50'}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-[10px] text-gray-400 tabular-nums text-right min-w-[3.5rem]">{basic}</span>
      <span className="text-[10px] font-bold text-brand-primary tabular-nums text-right min-w-[3.5rem]">{pro}</span>
    </div>
  );
}
