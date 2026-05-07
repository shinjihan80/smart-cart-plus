'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import SwipeFoodCard from '@/components/fridge/SwipeFoodCard';
import { FRIDGE_SECTION_META } from '@/lib/fridgeSection';
import type { FoodItem, FridgeSection } from '@/types';

interface SectionDetailSheetProps {
  section:    FridgeSection | null;
  items:      (FoodItem & { dDay: number })[];
  onClose:    () => void;
  onDiscard:  (id: string) => void;
  onUpdate:   (id: string, updates: Partial<FoodItem>) => void;
}

export function SectionDetailSheet({
  section,
  items,
  onClose,
  onDiscard,
  onUpdate,
}: SectionDetailSheetProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <AnimatePresence>
      {section && (() => {
        const meta = FRIDGE_SECTION_META[section];
        return (
          <motion.div
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
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] px-5 pt-6 pb-8 max-h-[80vh] overflow-y-auto"
              style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* drag handle */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-200" />

              <button
                onClick={onClose}
                aria-label="닫기"
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={20} strokeWidth={2} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl" aria-hidden>{meta.emoji}</span>
                <div className="flex-1 min-w-0 pr-10">
                  <h2 className="text-base font-extrabold text-gray-900">{meta.label}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{meta.hint}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-1 mb-4">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium tabular-nums">
                  {items.length}개 보관
                </span>
                {items.some((i) => i.dDay <= 3) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-medium tabular-nums">
                    임박 {items.filter((i) => i.dDay <= 3).length}
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm font-medium">이 칸은 비어있어요</p>
                  <p className="text-xs mt-1">{meta.hint}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {items.map((item, index) => (
                    <SwipeFoodCard
                      key={item.id}
                      item={item}
                      dDay={item.dDay}
                      index={index}
                      onDiscard={onDiscard}
                      onUpdate={onUpdate}
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
