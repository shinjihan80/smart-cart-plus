'use client';

import Link from 'next/link';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { isFoodItem, FOOD_EMOJI, type CartItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { haptic } from '@/lib/haptics';
import { currentSeasonByMonth } from '@/lib/season';
import { isSeasonalProduce } from '@/lib/seasonalProduce';
import { SEASON_EMOJI } from '@/lib/recipes';
import { Widget } from './shared';

interface FridgeCardProps {
  name:        string;
  dDay:        number;
  storageType: string;
  emoji:       string;
  imageUrl?:   string;
  onDiscard:   () => void;
  inSeason?:   boolean;
}

function FridgeCard({ name, dDay, storageType, emoji, imageUrl, onDiscard, inSeason }: FridgeCardProps) {
  const season = currentSeasonByMonth();
  const x = useMotionValue(0);
  const bgColor = useTransform(
    x, [-100, -30, 0],
    ['rgb(255,241,242)', 'rgb(255,254,253)', 'rgb(255,255,255)'],
  );
  const discardOpacity = useTransform(x, [-100, -30], [1, 0]);

  const isUrgent  = dDay <= 2;
  const isWarning = dDay <= 5;

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -60) {
      haptic('action');
      onDiscard();
    }
  }

  return (
    <div className="relative shrink-0 w-[140px] h-[140px] rounded-3xl overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-end px-3 pointer-events-none">
        <motion.div style={{ opacity: discardOpacity }} className="flex flex-col items-center gap-0.5">
          <span className="text-lg">🗑️</span>
          <span className="text-[8px] font-semibold text-brand-warning">소진</span>
        </motion.div>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.15}
        style={{ x, backgroundColor: bgColor }}
        onDragEnd={handleDragEnd}
        className="relative z-10 w-full h-full rounded-3xl border border-gray-100 p-4 flex flex-col justify-between cursor-grab"
      >
        {imageUrl ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <span className="text-2xl">{emoji}</span>
        )}
        <div>
          <p className={`text-3xl font-extrabold tracking-tight tabular-nums ${
            isUrgent ? 'text-brand-warning' : isWarning ? 'text-amber-500' : 'text-gray-900'
          }`}>
            {dDay <= 0 ? '만료' : `D-${dDay}`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{name}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400">
              {storageType === '냉장' ? '❄️ 냉장' : storageType === '냉동' ? '🧊 냉동' : '📦 실온'}
            </span>
            {inSeason && (
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-semibold">
                {SEASON_EMOJI[season]} 제철
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function FridgeCarousel({ items, onDiscard }: { items: CartItem[]; onDiscard: (id: string) => void }) {
  const season = currentSeasonByMonth();
  const sorted = items.filter(isFoodItem)
    .map((f) => ({
      ...f,
      dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays),
      inSeason: isSeasonalProduce(f.name, season),
    }))
    .sort((a, b) => a.dDay - b.dDay);

  return (
    <div className="col-span-2">
      <Widget index={3} className="!p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧊</span>
            <span className="text-xs text-gray-400 font-medium">스마트 냉장고</span>
            <span className="text-[10px] text-gray-300 tabular-nums">{sorted.length}개</span>
          </div>
          <Link href="/fridge" className="text-xs text-brand-primary font-medium flex items-center gap-0.5">
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-5 pt-1 scrollbar-hide">
          {sorted.length > 0 ? sorted.map((item) => (
            <FridgeCard
              key={item.id}
              name={item.name}
              dDay={item.dDay}
              storageType={item.storageType}
              emoji={FOOD_EMOJI[item.foodCategory] ?? '📦'}
              imageUrl={item.imageUrl}
              inSeason={item.inSeason}
              onDiscard={() => onDiscard(item.id)}
            />
          )) : (
            <div className="flex items-center justify-center w-full py-6 text-gray-400">
              <p className="text-xs">냉장고에 식품을 추가해보세요</p>
            </div>
          )}
        </div>
      </Widget>
    </div>
  );
}
