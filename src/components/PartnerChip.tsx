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
 * 현재는 전부 비활성(`enabled: false`) 상태로 "준비 중" 스텁 렌더.
 * 파트너 연결 시 `PARTNERS`의 `enabled: true` + `buildUrl` 채우면
 * 앱 전역에서 클릭 가능 링크로 자동 전환된다.
 */
export default function PartnerChip({ partner, query, size = 'sm' }: PartnerChipProps) {
  const base = size === 'sm'
    ? 'text-[10px] px-2 py-1'
    : 'text-[11px] px-2.5 py-1.5 font-medium';

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
      {partner.emoji} {partner.label} <span className="text-[9px] text-gray-300">· 준비 중</span>
    </button>
  );
}
