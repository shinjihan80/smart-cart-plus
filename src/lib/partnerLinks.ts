/**
 * Phase 7 제휴 파트너 레지스트리.
 *
 * 모든 Phase 7 파트너 스텁은 이 파일의 `PARTNERS`를 기준으로 렌더된다.
 * 파트너 실제 연결이 되면 `enabled`만 `true`로 바꾸고 `buildUrl`에
 * 딥링크/제휴코드를 채워 넣으면 앱 전체에서 한번에 활성화된다.
 *
 * 수익 전략 (memory: partner_integrations_monetization.md 참조):
 * - 제휴 수수료 (쿠팡 파트너스, 당근 제휴, 세탁특공대 제휴 등)
 * - Pro 구독 (파트너 할인 전용)
 * - 광고비
 */

export type PartnerDomain = 'groceries' | 'secondhand' | 'donation' | 'storage' | 'laundry';

export interface Partner {
  id:      string;
  label:   string;
  emoji:   string;
  domain:  PartnerDomain;
  /** 활성화 여부. Phase 7 출시 시점에 각 파트너별로 true 전환. */
  enabled: boolean;
  /** disabled 상태일 때 노출할 툴팁 — "곧 연결됩니다 — ..." */
  comingSoon: string;
  /** 실제 연결 후 구매 검색용 URL 생성. 현재는 null. */
  buildUrl?: (query?: string) => string;
}

export const PARTNERS: Readonly<Record<string, Partner>> = {
  // 식품 쇼핑몰
  coupang:     { id: 'coupang',     label: '쿠팡',         emoji: '📦',  domain: 'groceries',  enabled: false, comingSoon: '곧 연결됩니다 — 쿠팡 로켓배송 제휴 API' },
  kurly:       { id: 'kurly',       label: '마켓컬리',     emoji: '🌙',  domain: 'groceries',  enabled: false, comingSoon: '곧 연결됩니다 — 마켓컬리 새벽배송' },
  naver_shop:  { id: 'naver_shop',  label: '네이버 장보기', emoji: '🛍️', domain: 'groceries',  enabled: false, comingSoon: '곧 연결됩니다 — 네이버 장보기' },
  mart:        { id: 'mart',        label: '대형마트',      emoji: '🏪', domain: 'groceries',  enabled: false, comingSoon: '곧 연결됩니다 — SSG·이마트몰·홈플러스' },
  quick_mart:  { id: 'quick_mart',  label: '바로 장보기',   emoji: '🛒', domain: 'groceries',  enabled: false, comingSoon: '곧 연결됩니다 — 쿠팡·네이버·마켓컬리 제휴 API' },

  // 의류 중고·기부·보관
  karrot:      { id: 'karrot',      label: '중고 판매',     emoji: '💰', domain: 'secondhand', enabled: false, comingSoon: '곧 연결됩니다 — 당근마켓·번개장터 등' },
  beautiful:   { id: 'beautiful',   label: '기부하기',      emoji: '❤️', domain: 'donation',   enabled: false, comingSoon: '곧 연결됩니다 — 아름다운가게·굿윌스토어 등' },
  storage_box: { id: 'storage_box', label: '업체 보관',     emoji: '📦', domain: 'storage',    enabled: false, comingSoon: '곧 연결됩니다 — 세탁특공대·다락 등 짐 보관 업체' },
  storage_svc: { id: 'storage_svc', label: '짐 보관',       emoji: '📦', domain: 'storage',    enabled: false, comingSoon: '곧 연결됩니다 — 세탁특공대·다락 등' },
};

/** 특정 도메인의 모든 파트너 (UI에서 그룹 렌더용). */
export function partnersByDomain(domain: PartnerDomain): Partner[] {
  return Object.values(PARTNERS).filter((p) => p.domain === domain);
}
