'use client';

import type { Partner } from '@/lib/partnerLinks';

interface PartnerChipProps {
  partner: Partner;
  query?:  string;
  /** 칩 사이즈 변형 — 'sm': 리스트 안, 'md': 섹션 푸터. */
  size?:   'sm' | 'md';
}

/**
 * Phase 7 제휴 파트너 칩.
 *
 * v1.8 시점: 18개 파트너 모두 enabled + 실제 URL 활성화 상태.
 *   - 검색 URL 지원 파트너: query 인자 전달 시 자동 검색 (예: 당근에 옷 이름 검색)
 *   - 검색 미지원 파트너: 메인 페이지로 이동 (예: 아름다운가게 기부 페이지)
 *
 * disabled 분기는 admin overlay 로 향후 일부 파트너 비활성화하는 경우 대비.
 */
export default function PartnerChip({ partner, query, size = 'sm' }: PartnerChipProps) {
  const base = size === 'sm'
    ? 'text-sm px-2 py-1'
    : 'text-xs px-2.5 py-1.5 font-medium';

  if (partner.enabled && partner.buildUrl) {
    return (
      <a
        href={partner.buildUrl(query)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} rounded-full bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 transition-colors`}
      >
        {partner.emoji} {partner.label}
      </a>
    );
  }

  return (
    <button
      disabled
      title={partner.comingSoon}
      className={`${base} rounded-full bg-gray-50 border border-gray-100 text-gray-400 cursor-not-allowed`}
    >
      {partner.emoji} {partner.label} <span className="text-xs text-gray-300">· 준비 중</span>
    </button>
  );
}
