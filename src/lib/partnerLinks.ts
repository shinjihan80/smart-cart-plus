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

export type PartnerDomain = 'groceries' | 'fashion' | 'secondhand' | 'donation' | 'storage' | 'laundry';

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
  // 식품 쇼핑몰 — 검색 가능 / 메인 페이지 fallback
  coupang:     { id: 'coupang',     label: '쿠팡',         emoji: '📦',  domain: 'groceries',  enabled: true,
                 buildUrl: (q) => q ? `https://www.coupang.com/np/search?q=${encodeURIComponent(q)}` : 'https://www.coupang.com',
                 comingSoon: '' },
  kurly:       { id: 'kurly',       label: '마켓컬리',     emoji: '🌙',  domain: 'groceries',  enabled: true,
                 buildUrl: (q) => q ? `https://www.kurly.com/search?sword=${encodeURIComponent(q)}` : 'https://www.kurly.com',
                 comingSoon: '' },
  naver_shop:  { id: 'naver_shop',  label: '네이버 장보기', emoji: '🛍️', domain: 'groceries',  enabled: true,
                 buildUrl: (q) => q ? `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(q)}` : 'https://shopping.naver.com',
                 comingSoon: '' },
  ssg:         { id: 'ssg',         label: 'SSG·이마트몰',  emoji: '🏪', domain: 'groceries',  enabled: true,
                 buildUrl: (q) => q ? `https://emart.ssg.com/search.ssg?target=all&query=${encodeURIComponent(q)}` : 'https://emart.ssg.com',
                 comingSoon: '' },
  homeplus:    { id: 'homeplus',    label: '홈플러스',      emoji: '🛒', domain: 'groceries',  enabled: true,
                 buildUrl: (q) => q ? `https://front.homeplus.co.kr/search?searchTerm=${encodeURIComponent(q)}` : 'https://front.homeplus.co.kr',
                 comingSoon: '' },

  // 의류 쇼핑몰 (Phase 7 신규)
  musinsa:     { id: 'musinsa',     label: '무신사',        emoji: '👕', domain: 'fashion',    enabled: true,
                 buildUrl: (q) => q ? `https://www.musinsa.com/search/musinsa/goods?q=${encodeURIComponent(q)}` : 'https://www.musinsa.com',
                 comingSoon: '' },
  twentynine:  { id: 'twentynine',  label: '29CM',         emoji: '✨', domain: 'fashion',    enabled: true,
                 buildUrl: (q) => q ? `https://search.29cm.co.kr/search?keyword=${encodeURIComponent(q)}` : 'https://www.29cm.co.kr',
                 comingSoon: '' },
  wconcept:    { id: 'wconcept',    label: 'W컨셉',         emoji: '🎀', domain: 'fashion',    enabled: true,
                 buildUrl: (q) => q ? `https://www.wconcept.co.kr/Search?kwd=${encodeURIComponent(q)}` : 'https://www.wconcept.co.kr',
                 comingSoon: '' },
  ably:        { id: 'ably',        label: '에이블리',      emoji: '💄', domain: 'fashion',    enabled: true,
                 buildUrl: (q) => q ? `https://m.a-bly.com/search/${encodeURIComponent(q)}` : 'https://a-bly.com',
                 comingSoon: '' },
  zigzag:      { id: 'zigzag',      label: '지그재그',      emoji: '⚡', domain: 'fashion',    enabled: true,
                 buildUrl: (q) => q ? `https://zigzag.kr/search?keyword=${encodeURIComponent(q)}` : 'https://zigzag.kr',
                 comingSoon: '' },

  // 의류 중고·기부·보관 (기존 stub 유지)
  karrot:      { id: 'karrot',      label: '중고 판매',     emoji: '💰', domain: 'secondhand', enabled: true,
                 buildUrl: (q) => q ? `https://www.daangn.com/search/${encodeURIComponent(q)}` : 'https://www.daangn.com',
                 comingSoon: '' },
  beautiful:   { id: 'beautiful',   label: '기부하기',      emoji: '❤️', domain: 'donation',   enabled: false, comingSoon: '곧 연결됩니다 — 아름다운가게·굿윌스토어 등' },
  storage_box: { id: 'storage_box', label: '업체 보관',     emoji: '📦', domain: 'storage',    enabled: false, comingSoon: '곧 연결됩니다 — 세탁특공대·다락 등 짐 보관 업체' },
  storage_svc: { id: 'storage_svc', label: '짐 보관',       emoji: '📦', domain: 'storage',    enabled: false, comingSoon: '곧 연결됩니다 — 세탁특공대·다락 등' },
};

/** 특정 도메인의 모든 파트너 (UI에서 그룹 렌더용). */
export function partnersByDomain(domain: PartnerDomain): Partner[] {
  return Object.values(PARTNERS).filter((p) => p.domain === domain);
}
