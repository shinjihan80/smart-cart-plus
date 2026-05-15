'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Bookmark } from 'lucide-react';
import { FASHION_EMOJI } from '@/types';
import { getFashionCategoryTone } from '@/lib/categoryImages';
import { outfitItemList, outfitItemIds, type Outfit } from '@/lib/outfitMatcher';
import { useWearLog } from '@/lib/wearLog';
import { useSavedOutfits } from '@/lib/savedOutfits';
import { useToast } from '@/context/ToastContext';
import { haptic } from '@/lib/haptics';
import { useModalA11y } from '@/lib/useModalA11y';
import { logReasonsAction } from '@/lib/reasonsLog';

interface OutfitDetailModalProps {
  outfit:  Outfit | null;
  onClose: () => void;
}

export default function OutfitDetailModal({ outfit, onClose }: OutfitDetailModalProps) {
  // ⚠️ active 플래그 필수 — 미지정 시 모달이 닫혀있어도 body.overflow=hidden
  //   이 항상 적용되어 페이지 스크롤이 영구 잠김 (원인이었던 버그)
  useModalA11y(onClose, !!outfit);
  const { markWorn, getEntry } = useWearLog();
  const { save } = useSavedOutfits();
  const { showToast } = useToast();

  return (
    <AnimatePresence>
      {outfit && (() => {
        const items = outfitItemList(outfit);
        const ids   = outfitItemIds(outfit);
        const today = new Date().toISOString().split('T')[0];
        const allWornToday = ids.every((id) => getEntry(id).lastWorn === today);

        function handleWearAll() {
          for (const id of ids) markWorn(id);
          // 사용자가 추천을 수용 → 어떤 reasons 가 행동으로 이어졌는지 학습
          if (outfit!.reasons.length > 0) logReasonsAction(outfit!.reasons);
          haptic('toggle');
          showToast(`${items.length}벌 오늘 착용 기록됐어요 ✓`);
          onClose();
        }

        function handleSave() {
          const slotsMap: Record<string, string> = {};
          for (const [slot, item] of Object.entries(outfit!.slots)) {
            if (item) slotsMap[slot] = item.id;
          }
          save(outfit!.label, slotsMap);
          showToast(`"${outfit!.label}" 저장됐어요`);
        }

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`${outfit.label} 코디 상세`}
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0,  opacity: 1, scale: 1 }}
              exit={{ y: 40,    opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] px-5 pt-6 pb-8 max-h-[85vh] overflow-y-auto"
              style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-200 sm:hidden" />

              <button
                onClick={onClose}
                aria-label="닫기"
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={20} strokeWidth={2} />
              </button>

              <div className="mb-3 pr-10">
                <h2 className="text-base font-extrabold text-gray-900">{outfit.label}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{items.length}벌 · {allWornToday ? '오늘 모두 기록됨' : '탭으로 일괄 기록 가능'}</p>
                {outfit.reasons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {outfit.reasons.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/15"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 아이템 리스트 — 사진 + 카테고리 + 이름 */}
              <div className="flex flex-col gap-2 mb-5">
                {items.map((item) => {
                  const tone = getFashionCategoryTone(item.category);
                  const wear = getEntry(item.id);
                  const wornToday = wear.lastWorn === today;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-100"
                    >
                      <div className={`relative w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${tone.bg}`}>
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl" aria-hidden>{tone.emoji}</span>
                        )}
                        {wornToday && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-success text-white flex items-center justify-center">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {FASHION_EMOJI[item.category]} {item.category} · {item.size}
                          {item.material && ` · ${item.material}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Bookmark size={14} strokeWidth={2} />
                  코디 저장
                </button>
                <button
                  onClick={handleWearAll}
                  disabled={allWornToday}
                  className={`flex-[2] py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    allWornToday
                      ? 'bg-brand-success/10 text-brand-success cursor-default'
                      : 'bg-brand-primary text-white hover:opacity-90 active:scale-95'
                  }`}
                >
                  <Check size={14} strokeWidth={2.5} />
                  {allWornToday ? '오늘 이미 기록됨' : '✓ 오늘 입었어요'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
