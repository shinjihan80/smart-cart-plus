'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { FridgeModelPicker } from '@/components/fridge/FridgeModelPicker';
import { useFridgeModel } from '@/lib/useFridgeModel';
import {
  FRIDGE_MODELS,
  planSectionMigrations,
  type FridgeModelId,
  type FridgeSectionMigration,
} from '@/lib/fridgeModel';
import { FRIDGE_SECTION_META } from '@/lib/fridgeSection';
import { usePersistedState } from '@/lib/usePersistedState';
import { useCart } from '@/context/CartContext';
import EmojiIcon from '@/components/EmojiIcon';

import { springTransition, CARD, CARD_SHADOW } from './shared';

export default function MyFridgeSection() {
  const [modelId, setModelId] = useFridgeModel();
  const { items, updateItem } = useCart();
  const [expanded, setExpanded] = usePersistedState<boolean>(
    'nemoa-mypage-fridge-open', false,
    (raw) => typeof raw === 'boolean' ? raw : null,
  );
  const current = FRIDGE_MODELS[modelId];

  // 모달 상태 — pending이 null이면 모달 안 보임
  const [pending, setPending] = useState<{
    targetId:    FridgeModelId;
    migrations:  FridgeSectionMigration[];
  } | null>(null);

  function handleSelect(nextId: FridgeModelId) {
    if (nextId === modelId) return;
    const migrations = planSectionMigrations(items, nextId);
    if (migrations.length === 0) {
      // 영향받는 식품 없음 → 바로 적용
      setModelId(nextId);
      return;
    }
    setPending({ targetId: nextId, migrations });
  }

  function handleConfirmMigration() {
    if (!pending) return;
    for (const m of pending.migrations) {
      updateItem(m.id, { fridgeSection: m.to });
    }
    setModelId(pending.targetId);
    setPending(null);
  }

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
              <FridgeModelPicker selected={modelId} onSelect={handleSelect} compact />
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                선택한 모델에 따라 냉장고 시각화의 칸 구성이 달라져요. 기존 식품의 보관 위치가 새 모델에 없으면 자동 재배치 여부를 물어봅니다.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pending && (
          <MigrationConfirmModal
            current={current.label}
            target={FRIDGE_MODELS[pending.targetId].label}
            migrations={pending.migrations}
            onCancel={() => setPending(null)}
            onConfirm={handleConfirmMigration}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── 마이그레이션 확인 모달 ───────────────────────────────────────────────
function MigrationConfirmModal({
  current, target, migrations, onCancel, onConfirm,
}: {
  current:    string;
  target:     string;
  migrations: FridgeSectionMigration[];
  onCancel:   () => void;
  onConfirm:  () => void;
}) {
  const preview = migrations.slice(0, 5);
  const more = migrations.length - preview.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{ y: 40,    opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] px-5 pt-5 pb-6"
        style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.1)' }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />
        <h2 className="text-base font-bold text-gray-900 mb-1">냉장고 모델을 바꿀까요?</h2>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          <span className="font-semibold text-gray-700">{current}</span> → <span className="font-semibold text-brand-primary">{target}</span>
          으로 변경하면 기존 식품 <span className="font-semibold text-gray-900">{migrations.length}개</span>의 보관 위치가 새 모델에 맞게 자동 재배치됩니다.
        </p>

        <div className="rounded-2xl bg-gray-50 px-3 py-2 mb-4 max-h-48 overflow-y-auto">
          <ul className="flex flex-col gap-1">
            {preview.map((m) => {
              const fromMeta = FRIDGE_SECTION_META[m.from];
              const toMeta   = FRIDGE_SECTION_META[m.to];
              return (
                <li key={m.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="font-medium truncate max-w-[40%]">{m.name}</span>
                  <span className="text-gray-400 shrink-0">{fromMeta.emoji} {fromMeta.label}</span>
                  <span className="text-gray-300 shrink-0">→</span>
                  <span className="text-brand-primary font-medium shrink-0">{toMeta.emoji} {toMeta.label}</span>
                </li>
              );
            })}
            {more > 0 && (
              <li className="text-xs text-gray-400 italic">…외 {more}개</li>
            )}
          </ul>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-brand-primary py-3 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
          >
            재배치하고 변경
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
