'use client';

import { motion } from 'framer-motion';
import {
  ShoppingBag, Soup, Shirt, AlertTriangle, Flame, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import {
  FOOD_GROUP, FASHION_GROUP, FOOD_GROUPS,
  type CartItem, type FoodItem, type FashionGroup,
} from '@/types';
import { springTransition, CARD, CARD_SHADOW } from './shared';
import { EXPIRY_LABEL } from '@/lib/expiryThresholds';
import { ZONE_TINT } from '@/lib/fridgeZoneTheme';
import { GROUP_TINT } from '@/lib/wardrobeZoneTheme';
import { STORAGE_ICON } from '@/components/fridge/shared';

// 리디자인(옵션 B) — 플랫폼마다 다르게 렌더되는 이모지 대신 라인
// 아이콘 칩. "임박" 행만 caution(상태색)을 쓰고 나머지는 중립 —
// 범주 정보가 상태색을 침범하지 않도록(P2-56 원칙).
function StatRow({ icon: Icon, iconColor, label, value, accent }: { icon: LucideIcon; iconColor: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
          <Icon size={14} strokeWidth={2} style={{ color: iconColor }} />
        </span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-sm font-bold tabular-nums ${accent ? 'text-caution' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

// 리디자인(옵션 B) — 냉장고 화면(FridgeView)과 같은 구역 색(sky/
// violet/zinc)을 재사용해 "마이페이지에서 본 냉장 막대"와 "냉장고
// 화면의 냉장 칸"이 같은 색으로 느껴지게 한다.
function StorageBar({ label, icon: Icon, tint, count, total }: { label: string; icon: LucideIcon; tint: { icon: string }; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-16 shrink-0 flex items-center gap-1.5">
        <Icon size={14} strokeWidth={2} style={{ color: tint.icon }} aria-hidden />
        {label}
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ...springTransition, delay: 0.3 }}
          className="h-full rounded-full"
          style={{ backgroundColor: tint.icon }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right tabular-nums">{count}</span>
    </div>
  );
}

interface StatsSectionProps {
  items:           CartItem[];
  foodItems:       FoodItem[];
  clothingItems:   CartItem[];
  urgentCount:     number;
  discardHistory:  { name: string; category: string; date: string; kind?: 'eaten' | 'discarded' }[];
  coldCount:       number;
  frozenCount:     number;
  roomCount:       number;
}

export default function StatsSection({
  items, foodItems, clothingItems,
  urgentCount, discardHistory, coldCount, frozenCount, roomCount,
}: StatsSectionProps) {
  // "소진 처리(누적)" 한 줄이 식품을 다 먹은 것과 옷을 치운 것을 같은
  // removeItem 카운터로 합산해, "낭비 줄이기" 핵심 지표를 계산할 수
  // 없게 만들었다(P1-91, C8 실측 + E1 "지표 자체가 계산 불가능"). 같은
  // discardHistory를 category로 나눠 식품/패션을 각자 셀 수 있게 분리.
  // 재검토(C5 실측) P1 — "다 먹은 식품"에 상해서 버린 것까지 섞여
  // 수치가 부풀려졌다(안B 채택) — kind==='discarded'는 제외.
  // undefined(과거 기록)는 기존처럼 '다 먹음'으로 간주해 소급 변경 없음.
  // clearedCount(옷 정리)는 food와 무관하므로 빼기가 아니라 카테고리로
  // 직접 센다 — eatenCount에서 discarded를 빼면서 "total - eatenCount"
  // 뺄셈식을 쓰면 상한 식품(discarded)이 옷 정리 수치로 잘못 흘러든다.
  const eatenCount   = discardHistory.filter((h) => h.category === '식품' && h.kind !== 'discarded').length;
  const clearedCount = discardHistory.filter((h) => h.category !== '식품').length;

  return (
    <>
      {/* 종합 통계 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.1 }}
        className={CARD}
        style={CARD_SHADOW}
      >
        <h3 className="text-xs text-gray-400 font-medium mb-2">종합 통계</h3>
        <div className="divide-y divide-gray-50">
          <StatRow icon={ShoppingBag}   iconColor="#6B7280" label="전체 상품"       value={`${items.length}개`} />
          <StatRow icon={Soup}          iconColor="#6B7280" label="식품"             value={`${foodItems.length}개`} />
          <StatRow icon={Shirt}         iconColor="#6B7280" label="패션 전체"        value={`${clothingItems.length}개`} />
          {/* #B45309 = --color-caution(globals.css) — 냉장고 요약
              줄(fridge/page.tsx)의 집계 "임박" 숫자와 같은 색 규칙
              (today/soon 세부 구분 없는 합계는 caution 하나로 통일). */}
          <StatRow icon={AlertTriangle} iconColor={urgentCount > 0 ? '#B45309' : '#6B7280'} label={EXPIRY_LABEL.soon} value={`${urgentCount}개`} accent={urgentCount > 0} />
          <StatRow icon={Flame}         iconColor="#6B7280" label="다 먹은 식품 (누적)" value={`${eatenCount}개`} />
          <StatRow icon={Sparkles}      iconColor="#6B7280" label="정리한 옷 (누적)"    value={`${clearedCount}개`} />
        </div>
      </motion.div>

      {/* 보관 현황 */}
      {foodItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.2 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <h3 className="text-xs text-gray-400 font-medium mb-3">보관 현황</h3>
          <div className="flex flex-col gap-2.5">
            <StorageBar icon={STORAGE_ICON.냉장} tint={ZONE_TINT.fridge}  label="냉장" count={coldCount}   total={foodItems.length} />
            <StorageBar icon={STORAGE_ICON.냉동} tint={ZONE_TINT.freezer} label="냉동" count={frozenCount} total={foodItems.length} />
            <StorageBar icon={STORAGE_ICON.실온} tint={ZONE_TINT.pantry}  label="실온" count={roomCount}   total={foodItems.length} />
          </div>
        </motion.div>
      )}

      {/* 카테고리 분포 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.22 }}
        className={CARD}
        style={CARD_SHADOW}
      >
        <h3 className="text-xs text-gray-400 font-medium mb-0.5">카테고리 분포</h3>
        {/* 식품·패션 막대가 서로 다른 정규화 기준(각자 자기 카테고리
            내 비중)인데 축·범례 없이 나란히 배치돼 길이가 직접 비교
            가능한 것처럼 보였다(P2-34, C6 실측 — "채소·과일 80%"
            막대와 "상의 80%" 막대가 실제 개수는 달라도 똑같이 길어
            보임). 숨겨진 정규화 기준을 캡션으로 드러낸다. */}
        <p className="text-xs text-gray-300 mb-3">각 칸 안에서의 비중이에요 — 식품·패션 전체 수량은 서로 달라요</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Soup size={12} strokeWidth={2} aria-hidden /> 식품</p>
            {FOOD_GROUPS.map((g) => {
              const count = foodItems.filter((f) => (FOOD_GROUP[f.foodCategory] ?? '기타') === g).length;
              if (count === 0) return null;
              const pct = foodItems.length > 0 ? (count / foodItems.length) * 100 : 0;
              return (
                <div key={g} className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs text-gray-500 w-14 truncate">{g}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ...springTransition, delay: 0.4 }} className="h-full bg-brand-success rounded-full" />
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Shirt size={12} strokeWidth={2} aria-hidden /> 패션</p>
            {/* 리디자인(옵션 B) — 옷장 화면(WardrobeView)과 같은 그룹
                색(indigo/teal/rose/emerald)을 재사용해 일관성 유지. */}
            {(['의류', '신발', '가방', '액세서리'] as FashionGroup[]).map((g) => {
              const count = clothingItems.filter((c) => (FASHION_GROUP[c.category as keyof typeof FASHION_GROUP] ?? '의류') === g).length;
              if (count === 0) return null;
              const pct = clothingItems.length > 0 ? (count / clothingItems.length) * 100 : 0;
              return (
                <div key={g} className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs text-gray-500 w-14 truncate">{g}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ...springTransition, delay: 0.4 }} className="h-full rounded-full" style={{ backgroundColor: GROUP_TINT[g].icon }} />
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}
