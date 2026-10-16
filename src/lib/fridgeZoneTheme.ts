import {
  UtensilsCrossed, Egg, Beef, FlaskConical, CupSoda, Wine,
  Carrot, Milk, IceCreamCone, PackageOpen, Soup, Archive, Box,
  type LucideIcon,
} from 'lucide-react';
import type { FridgeSection } from '@/types';

/**
 * 리디자인(옵션 B, 2026-10-16) — 냉장고 칸 그림(FridgeView)과 칸 상세
 * 시트(SectionDetailSheet)가 같은 칸을 가리키면서도 색·아이콘 소스가
 * 따로였다면 "그리드에서는 보라색이었는데 눌러 들어가면 흰 화면"처럼
 * 다시 끊겨 보인다 — 두 곳이 같은 매핑을 쓰도록 단일 소스로 분리.
 * 공유 FRIDGE_SECTION_META.emoji는 이 재설계 밖의 다른 소비처(등록
 * 폼 미리보기 등)가 그대로 쓰므로 안 건드린다.
 */
export const SECTION_ICON: Record<FridgeSection, LucideIcon> = {
  main_top: UtensilsCrossed, main_middle: Egg, main_bottom: Beef,
  door_top: FlaskConical, door_middle: CupSoda, door_bottom: Wine,
  crisper: Carrot, butter: Milk,
  freezer_top: IceCreamCone, freezer_bottom: PackageOpen,
  kimchi_top: Soup, kimchi_bottom: Archive,
  pantry: Box,
};

export type FridgeZone = 'fridge' | 'door' | 'crisper' | 'freezer' | 'kimchi' | 'pantry';

// 따뜻한 색(amber·orange)은 상태(임박·기한초과) 전용으로 예약돼
// 있어(P2-56) 구역 틴트에선 쓰지 않는다 — pantry(실온)도 일부러
// 따뜻한 베이지 대신 중립 slate를 썼다.
export const ZONE_TINT: Record<FridgeZone, { cellBg: string; chipBg: string; icon: string; title: string; meta: string }> = {
  fridge:  { cellBg: 'bg-sky-50',     chipBg: 'bg-sky-100',     icon: '#2563EB', title: 'text-[#1D3A6B]', meta: 'text-[#6B8FC9]' },
  door:    { cellBg: 'bg-indigo-50',  chipBg: 'bg-indigo-100',  icon: '#4F46E5', title: 'text-[#2E2A8F]', meta: 'text-[#8C87D9]' },
  crisper: { cellBg: 'bg-emerald-50', chipBg: 'bg-emerald-100', icon: '#059669', title: 'text-[#0F5132]', meta: 'text-[#5FA98A]' },
  freezer: { cellBg: 'bg-violet-50',  chipBg: 'bg-violet-100',  icon: '#7C3AED', title: 'text-[#4C2A8F]', meta: 'text-[#A98FE0]' },
  kimchi:  { cellBg: 'bg-rose-50',    chipBg: 'bg-rose-100',    icon: '#BE185D', title: 'text-[#7A1041]', meta: 'text-[#C97BA0]' },
  pantry:  { cellBg: 'bg-zinc-100',   chipBg: 'bg-zinc-200',    icon: '#52525B', title: 'text-[#3F3F46]', meta: 'text-[#8C8C94]' },
};
