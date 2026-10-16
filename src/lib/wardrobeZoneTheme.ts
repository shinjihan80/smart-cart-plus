import { Shirt, Archive, Footprints, Backpack, Sparkles, type LucideIcon } from 'lucide-react';
import type { WardrobeSection, FashionGroup } from '@/types';

/**
 * 리디자인(옵션 B, 2026-10-16) — 옷장 그리드(WardrobeView)와 칸 상세
 * 시트(WardrobeSectionSheet)가 같은 매핑을 쓰도록 단일 소스로 분리
 * (FridgeView/SectionDetailSheet와 동일 패턴 — fridgeZoneTheme.ts 참고).
 * 칸 안 아이템 썸네일(FASHION_EMOJI)은 "내 옷 식별"이 목적인 별도
 * 문제(P1-38)라 이 재설계 밖.
 */
export const SECTION_ICON: Record<WardrobeSection, LucideIcon> = {
  hanging: Shirt, hanging_2: Shirt,
  folded: Archive, drawer_2: Archive, drawer_3: Archive, drawer_4: Archive, drawer_5: Archive,
  drawer_s1: Archive, drawer_s2: Archive, drawer_s3: Archive,
  shoes: Footprints, bags: Backpack, accessories: Sparkles,
};

// 패션 그룹(4종) 단위 아이콘 — SECTION_ICON과 같은 선택을 공유해 마이
// 페이지의 그룹별 통계(WearStatsSection 등)도 옷장 그리드와 같은
// 아이콘을 쓴다.
export const GROUP_ICON: Record<FashionGroup, LucideIcon> = {
  의류: Shirt, 신발: Footprints, 가방: Backpack, 액세서리: Sparkles,
};

// 따뜻한 색(amber·orange)은 상태 전용으로 예약돼 있어(P2-56) 그룹
// 틴트에선 쓰지 않는다.
export const GROUP_TINT: Record<FashionGroup, { cellBg: string; chipBg: string; icon: string; title: string; meta: string }> = {
  의류:    { cellBg: 'bg-indigo-50',  chipBg: 'bg-indigo-100',  icon: '#4F46E5', title: 'text-[#2E2A8F]', meta: 'text-[#8C87D9]' },
  신발:    { cellBg: 'bg-teal-50',    chipBg: 'bg-teal-100',    icon: '#0D9488', title: 'text-[#0F4C46]', meta: 'text-[#5FAFA3]' },
  가방:    { cellBg: 'bg-rose-50',    chipBg: 'bg-rose-100',    icon: '#BE185D', title: 'text-[#7A1041]', meta: 'text-[#C97BA0]' },
  액세서리: { cellBg: 'bg-emerald-50', chipBg: 'bg-emerald-100', icon: '#059669', title: 'text-[#0F5132]', meta: 'text-[#5FA98A]' },
};
