'use client';

import { motion } from 'framer-motion';
import { isClothingItem, type CartItem } from '@/types';
import { FASHION_ICON } from '@/lib/iconMap';
import { useSavedOutfits } from '@/lib/savedOutfits';
import { useToast } from '@/context/ToastContext';
import { useWearLog } from '@/lib/wearLog';
import { haptic } from '@/lib/haptics';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from './shared';

/**
 * 저장된 코디 목록을 큰 카드로 노출 — OutfitPreview 안의 칩보다 탐색/관리 쉽게.
 * 각 코디에 '이 코디 오늘 입었어요' 원탭 로그 기능.
 */
export default function SavedOutfitsSection({ items }: { items: CartItem[] }) {
  const { outfits, remove } = useSavedOutfits();
  const { markWorn } = useWearLog();
  const { showToast } = useToast();

  if (outfits.length === 0) return null;
  const clothes = items.filter(isClothingItem);

  function handleWearAll(slots: Record<string, string>, name: string) {
    const ids = Object.values(slots);
    let recorded = 0;
    for (const id of ids) {
      if (clothes.find((c) => c.id === id)) {
        markWorn(id);
        recorded += 1;
      }
    }
    haptic('toggle');
    if (recorded > 0) {
      showToast(`"${name}" ${recorded}벌 착용 기록 완료 👕`);
    } else {
      showToast('코디 아이템이 옷장에 없어요.');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.09 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-3">
        <EmojiIcon emoji="💾" size={16} className="text-brand-primary" />
        <span className="text-xs text-gray-400 font-medium">저장된 코디</span>
        <span className="text-sm text-gray-300 tabular-nums">{outfits.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {[...outfits].reverse().slice(0, 5).map((o) => {
          const resolved = Object.values(o.slots)
            .map((id) => clothes.find((c) => c.id === id))
            .filter((c): c is NonNullable<typeof c> => !!c);
          return (
            <div key={o.id} className="rounded-2xl border border-gray-100 p-2.5">
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <p className="text-sm font-semibold text-gray-800 truncate min-w-0">{o.name}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleWearAll(o.slots, o.name)}
                    className="text-sm font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 transition-colors"
                  >
                    👕 오늘 입었어요
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`"${o.name}" 삭제할까요?`)) remove(o.id);
                    }}
                    aria-label={`${o.name} 삭제`}
                    className="text-sm text-gray-400 hover:text-brand-warning px-1.5 py-0.5 transition-colors"
                  >
                    <EmojiIcon emoji="✕" size={12} className="text-current" />
                  </button>
                </div>
              </div>
              {resolved.length > 0 ? (
                <div className="flex gap-1.5 flex-wrap">
                  {resolved.map((c) => {
                    const Icon = FASHION_ICON[c.category] ?? FASHION_ICON['기타 액세서리'];
                    return (
                      <span
                        key={c.id}
                        className="flex items-center gap-1 text-sm px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-700"
                      >
                        <Icon size={12} strokeWidth={2} className="text-gray-600" />
                        <span className="truncate max-w-[80px]">{c.name}</span>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">이 코디의 옷들이 옷장에서 제거됐어요.</p>
              )}
            </div>
          );
        })}
        {outfits.length > 5 && (
          <p className="text-sm text-gray-400 text-center mt-1">
            외 {outfits.length - 5}개 더 있어요 (하단 코디 미리보기에서 칩으로 확인)
          </p>
        )}
      </div>
    </motion.div>
  );
}
