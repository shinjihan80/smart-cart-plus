'use client';

import { motion } from 'framer-motion';
import { PARTNERS, type PartnerDomain } from '@/lib/partnerLinks';
import { usePartnerClicks } from '@/lib/partnerClickLog';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from '@/components/closet/shared';

const DOMAIN_LABEL: Record<PartnerDomain, string> = {
  groceries:  '식품',
  fashion:    '패션',
  secondhand: '중고',
  donation:   '기부',
  storage:    '보관',
  laundry:    '세탁',
};

/**
 * 파트너 클릭 인사이트 카드 (설정 페이지).
 *
 * 사용자가 어떤 파트너를 얼마나 자주 쓰는지 본인의 데이터로 시각화.
 * 30일 보관, 데이터는 localStorage 만에 저장 (외부 전송 없음).
 */
export default function PartnerClickInsights() {
  const { total, topPartners, byDomain, clearAll } = usePartnerClicks();

  if (total === 0) return null;

  const top5 = topPartners(5);
  const domains = byDomain().sort((a, b) => b.count - a.count);
  const maxDomainCount = Math.max(...domains.map((d) => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.07 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="🔗" size={16} className="text-gray-600" />
          <span className="text-xs text-gray-400 font-medium">파트너 사용 기록</span>
        </div>
        <span className="text-sm text-gray-400 tabular-nums shrink-0">
          최근 30일 · {total}회
        </span>
      </div>

      {/* 도메인별 빈도 (가로 막대) */}
      <div className="flex flex-col gap-1.5 mb-3">
        {domains.map(({ domain, count }) => {
          const widthPct = (count / maxDomainCount) * 100;
          return (
            <div key={domain} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 shrink-0">{DOMAIN_LABEL[domain as PartnerDomain] ?? domain}</span>
              <div className="flex-1 h-3 rounded-full bg-gray-50 overflow-hidden">
                <div
                  className="h-full bg-brand-primary/70 rounded-full transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 tabular-nums w-8 text-right shrink-0">{count}</span>
            </div>
          );
        })}
      </div>

      {/* 자주 쓰는 파트너 TOP 5 */}
      {top5.length > 0 && (
        <div className="border-t border-gray-50 pt-2.5">
          <p className="text-xs text-gray-400 font-medium mb-1.5">자주 가는 곳 TOP 5</p>
          <div className="flex flex-col gap-1">
            {top5.map((t, i) => {
              const partner = PARTNERS[t.partnerId];
              if (!partner) return null;
              return (
                <div key={t.partnerId} className="flex items-center gap-2 py-0.5">
                  <span className="text-xs text-gray-400 w-4 text-center shrink-0">{i + 1}</span>
                  <span className="text-sm shrink-0" aria-hidden>{partner.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 flex-1 truncate">{partner.label}</span>
                  <span className="text-xs text-gray-400 tabular-nums shrink-0">{t.count}회</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 클리어 버튼 */}
      <div className="border-t border-gray-50 pt-2 mt-2.5 flex items-center justify-between">
        <span className="text-xs text-gray-400">기록은 이 기기에만 저장돼요</span>
        <button
          onClick={() => {
            if (confirm('파트너 클릭 기록을 모두 삭제할까요?')) clearAll();
          }}
          className="text-xs text-gray-400 hover:text-brand-warning transition-colors"
        >
          기록 삭제
        </button>
      </div>
    </motion.div>
  );
}
