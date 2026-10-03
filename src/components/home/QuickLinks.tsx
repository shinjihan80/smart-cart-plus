'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Flower2, ShoppingCart, BarChart3, Settings,
  type LucideIcon,
} from 'lucide-react';
import { isFoodItem, type CartItem } from '@/types';
import { currentSeasonByMonth, seasonStart } from '@/lib/season';
import { isSeasonalProduce } from '@/lib/seasonalProduce';
import { useMergedCatalog } from '@/lib/useMergedCatalog';
import { useShoppingList } from '@/lib/shoppingList';
import { springTransition } from './shared';

interface DiscardRecord { name: string; category: string; date: string; }

interface CategoryItem {
  href:      string;
  Icon:      LucideIcon;
  label:     string;
  bgClass:   string;   // 파스텔 배경
  iconClass: string;   // 아이콘 색
  badge?:    string;
  dot?:      boolean;
}

/**
 * 카테고리 그리드 (iOS 앱 아이콘 스타일)
 *
 * - 둥근 사각형 타일 (rounded-2xl) + 파스텔 배경
 * - Lucide 라인 아이콘 (이모지 대신)
 * - 4개 카테고리 × 4열 × 1행 — 냉장고/옷장/내 정보는 하단 탭과 중복이라
 *   제외, 레시피는 전용 라우트가 없어(냉장고 "추천" 탭은 딥링크 미지원,
 *   N-2 설계) 제외했다(P1-20).
 */
export default function QuickLinks({
  items, history,
}: { items: CartItem[]; history: DiscardRecord[] }) {
  const season = currentSeasonByMonth();
  const { seasonal: SEASONAL_PRODUCE } = useMergedCatalog();
  const { list: shopping } = useShoppingList();

  const foods = items.filter(isFoodItem);

  // 제철 놓친 개수
  const missedCount = (() => {
    const winStart = seasonStart(season);
    const triedNames = new Set<string>();
    for (const f of foods) {
      if (!isSeasonalProduce(f.name, season)) continue;
      const base = SEASONAL_PRODUCE.find((p) => p.seasons.includes(season) && (p.name === f.name || f.name.includes(p.name)));
      if (base) triedNames.add(base.name);
    }
    for (const h of history) {
      if (h.category !== '식품' || !h.date || h.date < winStart) continue;
      if (!isSeasonalProduce(h.name, season)) continue;
      const base = SEASONAL_PRODUCE.find((p) => p.seasons.includes(season) && (p.name === h.name || h.name.includes(p.name)));
      if (base) triedNames.add(base.name);
    }
    const total = SEASONAL_PRODUCE.filter((p) => p.seasons.includes(season)).length;
    return total - triedNames.size;
  })();

  // 타일 배경·아이콘 색은 전부 무채색 1종 공유 — 예전엔 타일마다 다른
  // 색(제철=emerald 등)을 썼는데, 그 emerald-500이 brand-success(#10B981)와
  // 완전히 같은 값이라 "제철 바로가기" 아이콘이 냉장고 카드의 "신선함"
  // 상태색과 같은 색으로 보여 상태색의 의미를 희석시켰다(P1-79, E3 실측
  // — 원래는 옷장 타일이 danger 빨강이던 게 문제였는데, P1-20의 8→4 축소
  // 이후 같은 문제가 다른 색으로 재발). 색은 상태(임박·오류·추천 배지)
  // 에만 예약하고 내비게이션 타일은 전부 중립색으로 통일.
  const categories: CategoryItem[] = [
    { href: '/seasonal',           Icon: Flower2,      label: '제철',   bgClass: 'bg-gray-50', iconClass: 'text-brand-ink', dot: missedCount > 0 },
    { href: '/mypage?tab=shopping',Icon: ShoppingCart, label: '쇼핑',   bgClass: 'bg-gray-50', iconClass: 'text-brand-ink', badge: shopping.length > 0 ? String(shopping.length) : undefined },
    { href: '/mypage?tab=activity',Icon: BarChart3,    label: '활동',   bgClass: 'bg-gray-50', iconClass: 'text-brand-ink' },
    { href: '/settings',           Icon: Settings,     label: '설정',   bgClass: 'bg-gray-50', iconClass: 'text-brand-ink' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.03 }}
      // grid-cols-4 고정 + gap 0(computed column-gap: normal = 0px)이던
      // 조합은 루트 폰트 확대(접근성 확대·P2-3의 과거 html{font-size:24px}
      // 같은 설정) 시 rem 기반 타일이 서로 겹쳐 그려졌다 — 겹친 구간에선
      // 뒤 타일의 배지가 앞 타일 위에 떠 "배지 소속 불명"으로 보였다
      // (P1-65, C8·E3 발견, P0-51과 같은 뿌리). auto-fit + minmax로 열 수가
      // 화면·글자 크기에 맞춰 자동으로 줄고, gap-x-2로 완충 구간을 둬
      // 타일이 트랙 밖으로 겹쳐 나가지 않게 한다.
      className="grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-x-2"
    >
      {categories.map((c) => (
        <Link
          key={`${c.href}-${c.label}`}
          href={c.href}
          className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div className={`relative w-14 h-14 rounded-2xl ${c.bgClass} flex items-center justify-center`}>
            <c.Icon
              size={26}
              strokeWidth={1.8}
              className={c.iconClass}
              aria-hidden
            />
            {c.badge && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-accent text-white text-[10px] font-bold flex items-center justify-center tabular-nums ring-2 ring-white">
                {c.badge}
              </span>
            )}
            {c.dot && !c.badge && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-accent ring-2 ring-white" />
            )}
          </div>
          <span className="text-xs font-semibold text-brand-ink tracking-tight">{c.label}</span>
        </Link>
      ))}
    </motion.div>
  );
}
