'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Wind } from 'lucide-react';
import { isClothingItem, FASHION_GROUP, type CartItem } from '@/types';
import { currentSeasonByMonth, matchesSeason } from '@/lib/season';
import { springTransition } from './shared';

const SEASON_EMOJI: Record<string, string> = {
  봄:   '🌸',
  여름: '☀️',
  가을: '🍂',
  겨울: '❄️',
};

/**
 * 시즌 전환 알림 배너.
 *
 * 표시 조건:
 *  1. 현재 시즌 진입 후 21일 이내 (3/6/9/12 + 일부 다음 달 초)
 *  2. 보관해야 할 옷(off-season + not hibernating) 또는
 *     꺼내야 할 옷(in storage + matches season) 이 존재
 *
 * 클릭 → 마이페이지 옷장 탭의 SeasonalStorageSection 으로 이동.
 */
export default function SeasonChangeAlert({ items }: { items: CartItem[] }) {
  const today  = new Date();
  const month  = today.getMonth() + 1; // 1-12
  const day    = today.getDate();
  const season = currentSeasonByMonth();

  // 시즌 전환 직후 21일 동안만 — 진입한 첫 달 1-31, 두 번째 달 1-7
  // 봄: 3월, 여름: 6월, 가을: 9월, 겨울: 12월 진입
  const seasonStartMonth = { 봄: 3, 여름: 6, 가을: 9, 겨울: 12 }[season];
  const isJustChanged =
    seasonStartMonth !== undefined &&
    (month === seasonStartMonth || (month === (seasonStartMonth % 12) + 1 && day <= 7));

  if (!isJustChanged) return null;

  const clothes = items.filter(isClothingItem).filter((c) => FASHION_GROUP[c.category] === '의류');

  // 보관해야 할 옷 — 현재 시즌에 안 맞는데 활성 상태
  const toStow = clothes.filter((c) => {
    if (c.hibernating) return false;
    return matchesSeason(c.weatherTags, season) === false;
  }).length;

  // 꺼내야 할 옷 — 보관 중인데 현재 시즌에 맞음
  const toUnstow = clothes.filter(
    (c) => c.hibernating && matchesSeason(c.weatherTags, season) === true,
  ).length;

  const total = toStow + toUnstow;
  if (total === 0) return null;

  const messageParts: string[] = [];
  if (toUnstow > 0) messageParts.push(`${toUnstow}벌 꺼낼 때`);
  if (toStow > 0)   messageParts.push(`${toStow}벌 보관할 때`);
  const message = messageParts.join(' · ');

  return (
    <Link href="/mypage?tab=closet#seasonal" className="block">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="bg-brand-primary/8 border border-brand-primary/15 rounded-[24px] px-4 py-3 flex items-center gap-3 hover:bg-brand-primary/10 transition-colors"
      >
        <span className="w-9 h-9 rounded-xl bg-brand-primary/15 flex items-center justify-center shrink-0 text-lg">
          {SEASON_EMOJI[season] ?? '🍃'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-brand-primary">
            {season} 옷장 정리 시즌 — {total}벌
          </p>
          <p className="text-xs text-gray-600 mt-0.5 truncate">
            <Wind size={11} strokeWidth={2} className="inline mr-0.5 -mt-px" />
            {message} · 마이페이지에서 한 번에 정리하세요
          </p>
        </div>
        <ChevronRight size={16} strokeWidth={2.2} className="text-brand-primary shrink-0" />
      </motion.div>
    </Link>
  );
}
