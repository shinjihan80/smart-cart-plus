'use client';

import { motion } from 'framer-motion';
import {
  WARDROBE_MODELS,
  WARDROBE_SECTION_META,
  FOLDED_CATEGORIES,
  buildWardrobeCells,
  DEFAULT_WARDROBE_MODEL,
  type WardrobeModelId,
  type WardrobeSection,
  type WardrobeConfig,
} from '@/lib/wardrobeModel';
import { FASHION_GROUP, FASHION_EMOJI, isClothingItem } from '@/types';
import type { CartItem, ClothingItem } from '@/types';
import type { FashionCategory } from '@/types';

// 아우터·원피스 계열은 상단 걸이, 상의 계열은 하단 걸이(2단)로 분리
export const HANGING_2_CATEGORIES: ReadonlyArray<FashionCategory> = ['상의'];

export function getSectionForCategory(category: FashionCategory, hasDouble: boolean): WardrobeSection {
  const group = FASHION_GROUP[category] ?? '의류';
  if (group === '신발') return 'shoes';
  if (group === '가방') return 'bags';
  if (group === '액세서리') return 'accessories';
  if ((FOLDED_CATEGORIES as readonly string[]).includes(category)) return 'folded';
  if (hasDouble && (HANGING_2_CATEGORIES as readonly string[]).includes(category)) return 'hanging_2';
  return 'hanging';
}

interface WardrobeViewProps {
  modelId?:       WardrobeModelId;
  config?:        WardrobeConfig;
  items:          CartItem[];
  onSectionClick: (section: WardrobeSection) => void;
  highlight?:     WardrobeSection;
}

export function WardrobeView({ modelId, config, items, onSectionClick, highlight }: WardrobeViewProps) {
  const model = config
    ? buildWardrobeCells(config)
    : WARDROBE_MODELS[modelId ?? DEFAULT_WARDROBE_MODEL];
  const clothing = items.filter(isClothingItem);
  const hasDouble = model.cells.some((c) => c.section === 'hanging_2');

  // 섹션별 아이템 맵
  const itemsBySection = new Map<WardrobeSection, ClothingItem[]>();
  for (const item of clothing) {
    // 수동 지정 섹션이 현재 모델에 있으면 우선 사용, 없으면 카테고리 자동 배정
    const autoSection = getSectionForCategory(item.category, hasDouble);
    const manualValid = item.wardrobeSection && model.cells.some((c) => c.section === item.wardrobeSection);
    const section = manualValid ? item.wardrobeSection! : autoSection;
    // 모델에 해당 섹션이 없으면 hanging 또는 첫 셀로 폴백
    const targetSection = model.cells.some((c) => c.section === section)
      ? section
      : model.cells.some((c) => c.section === 'hanging')
        ? 'hanging'
        : model.cells[0].section;
    const existing = itemsBySection.get(targetSection) ?? [];
    existing.push(item);
    itemsBySection.set(targetSection, existing);
  }

  return (
    <div
      className="grid gap-3 bg-gradient-to-br from-slate-50 to-gray-100 rounded-[28px] p-3"
      style={{
        gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))`,
        gridTemplateRows:    `repeat(${model.rows}, minmax(128px, auto))`,
      }}
    >
      {model.cells.map((cell, idx) => {
        const meta      = WARDROBE_SECTION_META[cell.section];
        const cellItems = itemsBySection.get(cell.section) ?? [];
        const count     = cellItems.length;
        const isActive  = highlight === cell.section;

        return (
          <motion.button
            key={`${cell.section}-${idx}`}
            type="button"
            onClick={() => onSectionClick(cell.section)}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: idx * 0.025 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={[
              'relative flex flex-col justify-between text-left rounded-2xl p-4 overflow-hidden',
              'bg-white ring-1',
              isActive ? 'ring-2 ring-indigo-500' : 'ring-gray-100',
            ].join(' ')}
            style={{
              gridColumn: `${cell.col} / span ${cell.colSpan}`,
              gridRow:    `${cell.row} / span ${cell.rowSpan}`,
              boxShadow:  '0 2px 6px -3px rgba(31, 31, 46, 0.08)',
            }}
            aria-label={`${meta.label} — ${count}개`}
          >
            {/* 헤더: 섹션 이모지(배지) + 카운트 — 화면을 넓게 쓰도록 크게 */}
            <div className="flex items-start justify-between gap-1">
              <span
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-3xl leading-none shrink-0"
                aria-hidden
              >
                {meta.emoji}
              </span>
              {count > 0 && (
                <span className="text-xs font-bold rounded-full px-2 py-0.5 tabular-nums bg-gray-900 text-white leading-tight mt-0.5">
                  {count}
                </span>
              )}
            </div>

            {/* 바디: 섹션명 + 의류 이모지 썸네일 */}
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-bold text-gray-700 leading-tight truncate">{meta.label}</p>
              {count === 0 ? (
                <p className="text-xs text-gray-400 leading-tight truncate">{meta.hint}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 leading-none">
                  {cellItems.slice(0, 4).map((item, i) => (
                    <span
                      key={i}
                      className="text-2xl leading-none"
                      aria-hidden
                      title={item.name}
                    >
                      {FASHION_EMOJI[item.category] ?? '👕'}
                    </span>
                  ))}
                  {count > 4 && (
                    <span className="text-xs text-gray-400 font-semibold self-end leading-none">
                      +{count - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
