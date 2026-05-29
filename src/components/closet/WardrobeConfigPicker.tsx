'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

import { CARD_SHADOWS, springTransition } from '@/components/home/shared';
import {
  WARDROBE_PRESETS,
  buildWardrobeCells,
  matchPreset,
  type WardrobeConfig,
} from '@/lib/wardrobeModel';

interface WardrobeConfigPickerProps {
  config:   WardrobeConfig;
  onSelect: (config: WardrobeConfig) => void;
}

// 그룹 순서 고정
const GROUP_ORDER = ['행거', '신발장', '옷장', '서랍장', '시스템 옷장'];

export function WardrobeConfigPicker({ config, onSelect }: WardrobeConfigPickerProps) {
  const activeId = matchPreset(config);

  // 그룹별로 분류
  const groups = GROUP_ORDER.map((g) => ({
    name: g,
    presets: WARDROBE_PRESETS.filter((p) => p.group === g),
  })).filter((g) => g.presets.length > 0);

  let globalIdx = 0;

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.name} className="flex flex-col gap-2">
          {/* 그룹 헤더 */}
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide px-0.5">
            {group.name}
          </p>

          {/* 카드 2열 그리드 */}
          <div className="grid grid-cols-2 gap-2.5">
            {group.presets.map((preset) => {
              const isActive  = preset.id === activeId;
              const cellCount = buildWardrobeCells(preset.config).cells.length;
              const idx       = globalIdx++;

              return (
                <motion.button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelect(preset.config)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: idx * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={[
                    'relative flex flex-col items-start gap-1 text-left p-3 rounded-[18px]',
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
                  <span className="text-2xl" aria-hidden>{preset.emoji}</span>
                  <span className="text-sm font-bold text-gray-900 leading-tight">{preset.label}</span>
                  <span className="text-[11px] text-gray-500 leading-snug">{preset.description}</span>
                  <span className="text-[10px] text-gray-400">칸 {cellCount}개</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
