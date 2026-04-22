'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { isClothingItem, FASHION_EMOJI, type CartItem } from '@/types';
import { useSavedOutfits } from '@/lib/savedOutfits';
import { Widget } from './shared';

/**
 * 홈 벤토에 저장된 코디 중 하나 랜덤 추천.
 * 저장된 코디가 1개+ 있을 때만 노출.
 */
export default function SavedOutfitSuggestion({ items }: { items: CartItem[] }) {
  const { outfits } = useSavedOutfits();
  if (outfits.length === 0) return null;

  // 날짜 시드로 "오늘의 코디" 선택 — 하루 동안 일관된 추천
  const today = new Date().toISOString().slice(0, 10);
  const seedNum = [...today].reduce((s, c) => s + c.charCodeAt(0), 0);
  const pick = outfits[seedNum % outfits.length];

  const clothes = items.filter(isClothingItem);
  const resolved = Object.entries(pick.slots)
    .map(([slot, id]) => {
      const item = clothes.find((c) => c.id === id);
      return item ? { slot, item } : null;
    })
    .filter((x): x is { slot: string; item: typeof clothes[number] } => x !== null);

  // 저장된 코디의 아이템이 모두 삭제됐으면 숨김
  if (resolved.length === 0) return null;

  return (
    <Link href="/closet" className="col-span-2 block">
      <Widget index={2} variant="accent">
        <div className="flex items-center gap-3">
          <span className="text-3xl shrink-0">💾</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">오늘 저장된 코디</p>
            <p className="text-sm font-bold text-gray-900 truncate">{pick.name}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {resolved.slice(0, 4).map(({ item }) => (
                <span key={item.id} className="flex items-center gap-0.5 text-sm px-1.5 py-0.5 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-brand-primary">
                  <span>{FASHION_EMOJI[item.category] ?? '👕'}</span>
                  <span className="font-medium truncate max-w-[60px]">{item.name}</span>
                </span>
              ))}
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0" />
        </div>
      </Widget>
    </Link>
  );
}
