'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { WARDROBE_SECTION_META, WARDROBE_SECTION_GROUP, type WardrobeSection, type WardrobeCell } from '@/lib/wardrobeModel';
import { SECTION_ICON, GROUP_TINT } from '@/lib/wardrobeZoneTheme';
import type { ClothingItem } from '@/types';
import type { MatchBadge } from '@/lib/weather';
import SwipeClothingCard from '@/components/closet/SwipeClothingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { openRegister } from '@/lib/registerIntent';

interface WardrobeSectionSheetProps {
  section:        WardrobeSection | null;
  items:          ClothingItem[];
  getMatchBadge?: (item: ClothingItem) => MatchBadge | undefined;
  /** P1-109 — 등록 모달에 "어느 옷장인지" 넘기기 위한 현재 활성 인스턴스 */
  activeInstanceId?: string;
  onClose:        () => void;
  onRemove:       (id: string) => void;
  onUpdate:       (id: string, updates: Partial<ClothingItem>) => void;
  wardrobeCells?: WardrobeCell[];
}

export function WardrobeSectionSheet({
  section,
  items,
  getMatchBadge,
  activeInstanceId,
  onClose,
  onRemove,
  onUpdate,
  wardrobeCells,
}: WardrobeSectionSheetProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {section && (() => {
        const meta = WARDROBE_SECTION_META[section];
        const tint = GROUP_TINT[WARDROBE_SECTION_GROUP[section]];
        const Icon = SECTION_ICON[section];
        return (
          <motion.div
            key={section}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`${meta.label} 상세`}
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative w-full max-w-md bg-white rounded-t-card sm:rounded-card px-5 pt-6 pb-8 max-h-[80vh] overflow-y-auto"
              style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* drag handle */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-200" />

              <button
                onClick={onClose}
                aria-label="닫기"
                className="touch-target-44 absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={20} strokeWidth={2} />
              </button>

              {/* 리디자인(옵션 B) — 그리드 칸(WardrobeView)과 같은 소스로
                  이어지는 라인 아이콘 + 그룹 틴트. */}
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tint.chipBg}`} aria-hidden>
                  <Icon size={22} strokeWidth={1.8} style={{ color: tint.icon }} />
                </span>
                <div className="flex-1 min-w-0 pr-10">
                  <h2 className="text-base font-extrabold text-gray-900">{meta.label}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{meta.hint}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-1 mb-4">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium tabular-nums">
                  {items.length}개 보관
                </span>
              </div>

              {items.length === 0 ? (
                <EmptyState
                  title="이 칸은 비어있어요"
                  action={{
                    label: '의류 등록하기',
                    onClick: () => {
                      // 등록 모달(z-50)이 이 시트(z-[60])보다 아래라 시트를
                      // 먼저 닫지 않으면 뒤에 가려 안 보인다 (라이브 실측)
                      onClose();
                      // P1-109 — 어느 칸·어느 옷장에서 눌렀는지 등록
                      // 모달에 넘긴다(이전엔 맥락 없이 열려 식품/옷을
                      // 다시 묻고 선택이 저장 안 됐다, C9·E1·E2).
                      openRegister({ domain: 'clothing', wardrobeSection: section ?? undefined, wardrobeInstanceId: activeInstanceId });
                    },
                  }}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {items.map((item, index) => (
                    <SwipeClothingCard
                      key={item.id}
                      item={item}
                      index={index}
                      onRemove={(id) => { onRemove(id); setExpandedId(null); }}
                      onUpdate={onUpdate}
                      matchBadge={getMatchBadge?.(item)}
                      wardrobeCells={wardrobeCells}
                      expanded={expandedId === item.id}
                      onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
