'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

import { CARD_SHADOWS, springTransition } from '@/components/home/shared';
import {
  FRIDGE_MODEL_LIST,
  type FridgeModelId,
} from '@/lib/fridgeModel';

interface FridgeModelPickerProps {
  selected: FridgeModelId;
  onSelect: (id: FridgeModelId) => void;
  /** 카드 톤을 컴팩트하게 (마이페이지·온보딩 모달 등) */
  compact?: boolean;
}

export function FridgeModelPicker({ selected, onSelect, compact }: FridgeModelPickerProps) {
  return (
    <div className={compact ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-2 gap-3'}>
      {FRIDGE_MODEL_LIST.map((model, idx) => {
        const isActive = model.id === selected;
        return (
          <motion.button
            key={model.id}
            type="button"
            onClick={() => onSelect(model.id)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: idx * 0.04 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={[
              'relative flex flex-col items-start gap-1.5 text-left',
              compact ? 'p-3 rounded-[18px]' : 'p-4 rounded-[22px]',
              isActive
                ? 'bg-indigo-50 ring-2 ring-indigo-500'
                : 'bg-white ring-1 ring-gray-100',
            ].join(' ')}
            style={isActive ? undefined : CARD_SHADOWS.compact}
            aria-pressed={isActive}
          >
            {isActive && (
              <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white">
                <Check className="w-3 h-3" />
              </span>
            )}
            <span className={compact ? 'text-2xl' : 'text-3xl'} aria-hidden>
              {model.emoji}
            </span>
            <span className={['font-bold text-gray-900', compact ? 'text-sm' : 'text-base'].join(' ')}>
              {model.label}
            </span>
            <span className={['text-gray-500 leading-snug', compact ? 'text-[11px]' : 'text-xs'].join(' ')}>
              {model.description}
            </span>
            <span className={['text-gray-400', compact ? 'text-[10px]' : 'text-[11px]'].join(' ')}>
              칸 {model.cells.length}개
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
