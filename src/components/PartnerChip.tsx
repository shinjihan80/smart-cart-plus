'use client';

import type { Partner } from '@/lib/partnerLinks';
import { logPartnerClick } from '@/lib/partnerClickLog';

interface PartnerChipProps {
  partner: Partner;
  query?:  string;
  /** 칩 사이즈 변형 — 'sm': 리스트 안, 'md': 섹션 푸터. */
  size?:   'sm' | 'md';
}

// 배경색 밝기에 따라 글자색을 흰/검 중 더 잘 읽히는 쪽으로 — mono 중
// 밝은 색(SSG 노랑 등)에 흰 글자를 쓰면 대비가 안 나와서.
function readableTextColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1A1A1A' : '#FFFFFF';
}

/**
 * 실제 브랜드 로고를 확보하기 전까지의 임시 식별 아이콘 — 브랜드 첫
 * 글자 + 지정 색의 원형 모노그램. 번개장터·지그재그가 둘 다 ⚡, 무신사·
 * 옷캔이 둘 다 👕로 같은 이모지를 공유해 구분이 안 됐던 문제(P1-74,
 * E3 실측)의 즉시 교체재.
 */
export function PartnerMonogram({ partner, size }: { partner: Partner; size: 'sm' | 'md' | 'lg' }) {
  const letter = Array.from(partner.label)[0] ?? '?';
  const dim = size === 'sm' ? 'w-4 h-4 text-[9px]' : size === 'md' ? 'w-5 h-5 text-[10px]' : 'w-8 h-8 text-sm';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${dim}`}
      style={{ backgroundColor: partner.mono, color: readableTextColor(partner.mono) }}
      aria-hidden
    >
      {letter}
    </span>
  );
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
  // 호출부가 존재하지 않는 파트너 키로 조회하면(Record 조회라 undefined가
  // 타입 체크를 통과함) 렌더 중 크래시해 부모 섹션 전체가 영구 에러로
  // 대체됐다(P0-57). 한 칩이 사라지는 게 섹션 전체가 죽는 것보다 낫다.
  if (!partner) return null;

  const base = size === 'sm'
    ? 'text-sm px-2 py-1 inline-flex items-center gap-1'
    : 'text-xs px-2.5 py-1.5 font-medium inline-flex items-center gap-1';

  if (partner.enabled && partner.buildUrl) {
    return (
      <a
        href={partner.buildUrl(query)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => logPartnerClick({ partnerId: partner.id, domain: partner.domain, query })}
        className={`${base} rounded-full bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 transition-colors`}
      >
        <PartnerMonogram partner={partner} size={size} /> {partner.label}
      </a>
    );
  }

  return (
    <button
      disabled
      title={partner.comingSoon}
      className={`${base} rounded-full bg-gray-50 border border-gray-100 text-gray-400 cursor-not-allowed`}
    >
      <PartnerMonogram partner={partner} size={size} /> {partner.label} <span className="text-xs text-gray-300">· 준비 중</span>
    </button>
  );
}
