'use client';

import { motion } from 'framer-motion';
import {
  FOOD_GROUP, FASHION_GROUP,
  type CartItem, type FoodItem, type FoodGroup, type FashionGroup,
} from '@/types';
import { springTransition, CARD, CARD_SHADOW } from './shared';
import EmojiIcon from '@/components/EmojiIcon';

function StatRow({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <EmojiIcon emoji={emoji} size={16} className="text-gray-600" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-sm font-bold tabular-nums ${accent ? 'text-brand-primary' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

function StorageBar({ label, emoji, count, total }: { label: string; emoji: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-16 shrink-0">{emoji} {label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ...springTransition, delay: 0.3 }}
          className="h-full bg-brand-primary rounded-full"
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right tabular-nums">{count}</span>
    </div>
  );
}

interface StatsSectionProps {
  items:          CartItem[];
  foodItems:      FoodItem[];
  clothingItems:  CartItem[];
  urgentCount:    number;
  discardCount:   number;
  coldCount:      number;
  frozenCount:    number;
  roomCount:      number;
}

export default function StatsSection({
  items, foodItems, clothingItems,
  urgentCount, discardCount, coldCount, frozenCount, roomCount,
}: StatsSectionProps) {
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
          <StatRow emoji="🛍️" label="전체 상품"       value={`${items.length}개`} />
          <StatRow emoji="🥦" label="식품"             value={`${foodItems.length}개`} />
          <StatRow emoji="👕" label="패션 전체"        value={`${clothingItems.length}개`} />
          <StatRow emoji="⚠️" label="소비 임박"        value={`${urgentCount}개`} accent={urgentCount > 0} />
          <StatRow emoji="🗑️" label="소진 처리 (누적)"  value={`${discardCount}건`} />
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
            <StorageBar emoji="❄️" label="냉장" count={coldCount}   total={foodItems.length} />
            <StorageBar emoji="🧊" label="냉동" count={frozenCount} total={foodItems.length} />
            <StorageBar emoji="📦" label="실온" count={roomCount}   total={foodItems.length} />
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
        <h3 className="text-xs text-gray-400 font-medium mb-3">카테고리 분포</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1.5">🥬 식품</p>
            {(['신선식품', '가공식품', '음료·간식'] as FoodGroup[]).map((g) => {
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
            <p className="text-xs text-gray-400 mb-1.5">👕 패션</p>
            {(['의류', '신발', '가방', '액세서리'] as FashionGroup[]).map((g) => {
              const count = clothingItems.filter((c) => (FASHION_GROUP[c.category as keyof typeof FASHION_GROUP] ?? '의류') === g).length;
              if (count === 0) return null;
              const pct = clothingItems.length > 0 ? (count / clothingItems.length) * 100 : 0;
              return (
                <div key={g} className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs text-gray-500 w-14 truncate">{g}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ...springTransition, delay: 0.4 }} className="h-full bg-brand-primary rounded-full" />
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
