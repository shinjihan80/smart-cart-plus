'use client';

import { motion } from 'framer-motion';

import {
  FRIDGE_MODELS,
  type FridgeModelId,
} from '@/lib/fridgeModel';
import {
  FRIDGE_SECTION_META,
  groupBySection,
} from '@/lib/fridgeSection';
import type { FoodItem, FridgeSection } from '@/types';

interface FridgeViewProps {
  modelId:        FridgeModelId;
  /** dDay가 미리 계산된 식품 목록 (page.tsx와 동일 형태) */
  items:          (FoodItem & { dDay: number })[];
  onSectionClick: (section: FridgeSection) => void;
  /** 강조 표시할 칸 — undefined면 강조 없음 */
  highlight?:     FridgeSection;
}

/**
 * 모델 그리드를 그대로 따라가는 냉장고 시각화.
 * 각 칸은 라벨·이모지·아이템 수·임박 배지를 보여주고, 클릭하면 상세 시트가 열린다.
 */
export function FridgeView({ modelId, items, onSectionClick, highlight }: FridgeViewProps) {
  const model = FRIDGE_MODELS[modelId];

  // 칸별로 아이템 그룹화 — 모델이 노출하는 칸만
  const validSections = new Set(model.cells.map((c) => c.section));
  const initial = groupBySection(items, validSections);
  // 추천 결과도 모델에 없을 수 있어 첫 셀로 추가 폴백
  const bySection = new Map<FridgeSection, (FoodItem & { dDay: number })[]>();
  initial.forEach((list, section) => {
    const target = validSections.has(section) ? section : model.cells[0].section;
    const existing = bySection.get(target) ?? [];
    bySection.set(target, [...existing, ...list]);
  });

  return (
    <div
      className="grid gap-2 bg-gradient-to-br from-slate-50 to-gray-100 rounded-[28px] p-3"
      style={{
        gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))`,
        gridTemplateRows:    `repeat(${model.rows}, minmax(64px, auto))`,
      }}
    >
      {model.cells.map((cell, idx) => {
        const meta     = FRIDGE_SECTION_META[cell.section];
        const list     = bySection.get(cell.section) ?? [];
        const urgent   = list.some((i) => i.dDay <= 3);
        const isActive = highlight === cell.section;

        return (
          <motion.button
            key={cell.section}
            type="button"
            onClick={() => onSectionClick(cell.section)}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: idx * 0.025 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={[
              'relative flex flex-col justify-between text-left rounded-2xl p-2.5',
              'bg-white ring-1',
              isActive ? 'ring-2 ring-indigo-500' : 'ring-gray-100',
              urgent && !isActive ? 'ring-rose-200 bg-rose-50/40' : '',
            ].join(' ')}
            style={{
              gridColumn: `${cell.col} / span ${cell.colSpan}`,
              gridRow:    `${cell.row} / span ${cell.rowSpan}`,
              boxShadow:  '0 2px 6px -3px rgba(31, 31, 46, 0.08)',
            }}
            aria-label={`${meta.label} — ${list.length}개`}
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-base leading-none" aria-hidden>{meta.emoji}</span>
              {list.length > 0 && (
                <span className={[
                  'text-[10px] font-bold rounded-full px-1.5 py-0.5 tabular-nums',
                  urgent ? 'bg-rose-500 text-white' : 'bg-gray-900 text-white',
                ].join(' ')}>
                  {list.length}
                </span>
              )}
            </div>

            <div className="mt-1.5">
              <p className="text-[11px] font-bold text-gray-800 leading-tight">{meta.label}</p>
              {list.length === 0 ? (
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-1">{meta.hint}</p>
              ) : (
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight line-clamp-1">
                  {list.slice(0, 3).map((i) => i.name).join(', ')}
                  {list.length > 3 ? ` 외 ${list.length - 3}` : ''}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
