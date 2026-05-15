'use client';

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { PARTNERS, type PartnerDomain } from '@/lib/partnerLinks';
import { logPartnerClick } from '@/lib/partnerClickLog';

interface ShoppingMallCardProps {
  /** 'groceries' | 'fashion' 등 도메인 */
  domain:   PartnerDomain;
  /** 카드 헤더 라벨 */
  title:    string;
  /** 한 줄 설명 */
  subtitle?: string;
  /** 추천 이모지 (헤더 좌측) */
  emoji?:   string;
}

/**
 * 쇼핑몰 그리드 카드 — 사용자가 즉시 외부 사이트로 이동할 수 있는 직관적 UI.
 *
 * 냉장고 장보기 탭 / 옷장 쇼핑 탭 / 마이페이지 쇼핑 탭 등에서 재사용.
 * `enabled: true`인 파트너만 노출. 클릭 시 새 창으로 열림.
 */
export default function ShoppingMallCard({
  domain, title, subtitle, emoji = '🛒',
}: ShoppingMallCardProps) {
  const malls = Object.values(PARTNERS).filter((p) => p.domain === domain && p.enabled && p.buildUrl);

  if (malls.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="bg-white rounded-[24px] p-5"
      style={{ boxShadow: '0 6px 16px -8px rgba(31, 31, 46, 0.08)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base" aria-hidden>{emoji}</span>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 mb-3">{subtitle}</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {malls.map((p) => (
          <a
            key={p.id}
            href={p.buildUrl!()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => logPartnerClick({ partnerId: p.id, domain: p.domain })}
            className="group relative flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-brand-primary/5 hover:border-brand-primary/20 active:scale-95 transition-all"
          >
            <span className="text-xl" aria-hidden>{p.emoji}</span>
            <span className="text-xs font-medium text-gray-700 group-hover:text-brand-primary truncate w-full text-center">
              {p.label}
            </span>
            <ExternalLink
              size={10}
              strokeWidth={2}
              className="absolute top-1.5 right-1.5 text-gray-300 group-hover:text-brand-primary"
            />
          </a>
        ))}
      </div>
    </motion.div>
  );
}
