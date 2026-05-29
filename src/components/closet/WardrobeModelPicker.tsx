'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { WARDROBE_MODEL_LIST, type WardrobeModelId } from '@/lib/wardrobeModel';
import { springTransition } from '@/components/closet/shared';

interface WardrobeModelPickerProps {
  selected: WardrobeModelId;
  onSelect: (id: WardrobeModelId) => void;
}

export function WardrobeModelPicker({ selected, onSelect }: WardrobeModelPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {WARDROBE_MODEL_LIST.map((model, idx) => {
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
              'relative flex flex-col items-start gap-1 text-left p-3 rounded-[18px]',
              isActive
                ? 'bg-indigo-50 ring-2 ring-indigo-500'
                : 'bg-white ring-1 ring-gray-100',
            ].join(' ')}
            style={isActive ? undefined : { boxShadow: '0 1px 4px -2px rgba(31,31,46,0.10)' }}
            aria-pressed={isActive}
          >
            {isActive && (
              <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white">
                <Check className="w-3 h-3" />
              </span>
            )}
            <span className="text-2xl" aria-hidden>{model.emoji}</span>
            <span className="text-sm font-bold text-gray-900">{model.label}</span>
            <span className="text-[11px] text-gray-500 leading-snug">{model.description}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
