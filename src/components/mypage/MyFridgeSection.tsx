'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { FridgeModelPicker } from '@/components/fridge/FridgeModelPicker';
import { useFridgeModel } from '@/lib/useFridgeModel';
import { FRIDGE_MODELS } from '@/lib/fridgeModel';
import { usePersistedState } from '@/lib/usePersistedState';
import EmojiIcon from '@/components/EmojiIcon';

import { springTransition, CARD, CARD_SHADOW } from './shared';

export default function MyFridgeSection() {
  const [modelId, setModelId] = useFridgeModel();
  const [expanded, setExpanded] = usePersistedState<boolean>(
    'nemoa-mypage-fridge-open', false,
    (raw) => typeof raw === 'boolean' ? raw : null,
  );
  const current = FRIDGE_MODELS[modelId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.18 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2 min-w-0">
          <EmojiIcon emoji="🧊" size={16} className="text-brand-primary" />
          <span className="text-xs text-gray-400 font-medium">내 냉장고</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
            {current.emoji} {current.label}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-300 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {!expanded && (
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          {current.description} · 칸 {current.cells.length}개 — 탭해서 변경.
        </p>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <FridgeModelPicker selected={modelId} onSelect={setModelId} compact />
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                선택한 모델에 따라 냉장고 시각화의 칸 구성이 달라져요. 새 식품을 등록하면 권장 칸이 자동으로 매핑됩니다.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
