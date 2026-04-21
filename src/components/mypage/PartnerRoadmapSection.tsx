'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PARTNERS, type PartnerDomain } from '@/lib/partnerLinks';
import { usePersistedState } from '@/lib/usePersistedState';
import { springTransition, CARD, CARD_SHADOW } from './shared';

const DOMAIN_LABEL: Record<PartnerDomain, { emoji: string; label: string; desc: string }> = {
  groceries:  { emoji: '🛒', label: '냉장고 — 바로 장보기', desc: '쇼핑 리스트에서 원탭으로 배송 주문' },
  secondhand: { emoji: '💰', label: '옷장 — 중고 판매',      desc: '안 입는 옷 바로 판매 게시' },
  donation:   { emoji: '❤️', label: '옷장 — 기부하기',       desc: '기부 수거 예약 + 기부증' },
  storage:    { emoji: '📦', label: '옷장 — 짐 보관',         desc: '비시즌 옷 업체 위탁 보관' },
  laundry:    { emoji: '🧺', label: '옷장 — 세탁 픽업',       desc: '비시즌 옷 세탁 + 보관' },
};

export default function PartnerRoadmapSection() {
  const [expanded, setExpanded] = usePersistedState<boolean>(
    'nemoa-mypage-partner-open', false,
    (raw) => typeof raw === 'boolean' ? raw : null,
  );

  const domains = (Object.keys(DOMAIN_LABEL) as PartnerDomain[]).map((d) => ({
    domain: d,
    partners: Object.values(PARTNERS).filter((p) => p.domain === d),
  })).filter((g) => g.partners.length > 0);

  return (
    <motion.div
      id="partners"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.32 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🚀</span>
          <span className="text-xs text-gray-400 font-medium">곧 연결될 파트너 서비스</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
            Phase 7
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-300 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {!expanded && (
        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
          쇼핑몰·중고·기부·짐 보관 등 {Object.keys(PARTNERS).length}개 제휴를 준비 중이에요. 탭해서 전체 보기.
        </p>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex flex-col gap-3">
              {domains.map(({ domain, partners }) => {
                const meta = DOMAIN_LABEL[domain];
                return (
                  <div key={domain}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-sm">{meta.emoji}</span>
                      <p className="text-[11px] font-semibold text-gray-700">{meta.label}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-1.5 ml-5 leading-relaxed">
                      {meta.desc}
                    </p>
                    <div className="ml-5 flex gap-1.5 flex-wrap">
                      {partners.map((p) => (
                        <span
                          key={p.id}
                          title={p.comingSoon}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500"
                        >
                          {p.emoji} {p.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                네모아는 수수료·Pro 구독·광고 3축으로 운영될 예정이에요. 사용자 데이터는
                판매하지 않고, 파트너 연결은 투명하게 표시됩니다.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
