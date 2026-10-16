'use client';

import { motion } from 'framer-motion';
import { Shirt, Archive, Footprints, Backpack, Sparkles, type LucideIcon } from 'lucide-react';
import {
  WARDROBE_MODELS,
  WARDROBE_SECTION_META,
  WARDROBE_SECTION_GROUP,
  FOLDED_CATEGORIES,
  buildWardrobeCells,
  DEFAULT_WARDROBE_MODEL,
  type WardrobeModelId,
  type WardrobeSection,
  type WardrobeConfig,
} from '@/lib/wardrobeModel';
import { FASHION_GROUP, FASHION_EMOJI, isClothingItem } from '@/types';
import type { CartItem, ClothingItem, FashionGroup } from '@/types';
import type { FashionCategory } from '@/types';

// 리디자인(옵션 B, 2026-10-16) — FridgeView와 같은 패턴: 칸 헤더
// 이모지(🪝🗂️👟👜✨)를 라인 아이콘 + 그룹별 틴트로 바꾼다. 칸 안
// 아이템 썸네일(FASHION_EMOJI)은 "내 옷 식별"이 목적인 별도 문제
// (P1-38, 타이포 타일 전환 검토 중)라 이번엔 안 건드린다.
const SECTION_ICON: Record<WardrobeSection, LucideIcon> = {
  hanging: Shirt, hanging_2: Shirt,
  folded: Archive, drawer_2: Archive, drawer_3: Archive, drawer_4: Archive, drawer_5: Archive,
  drawer_s1: Archive, drawer_s2: Archive, drawer_s3: Archive,
  shoes: Footprints, bags: Backpack, accessories: Sparkles,
};

// 따뜻한 색(amber·orange)은 상태 전용으로 예약돼 있어(P2-56) 그룹
// 틴트에선 쓰지 않는다.
const GROUP_TINT: Record<FashionGroup, { cellBg: string; chipBg: string; icon: string; title: string; meta: string }> = {
  의류:    { cellBg: 'bg-indigo-50',  chipBg: 'bg-indigo-100',  icon: '#4F46E5', title: 'text-[#2E2A8F]', meta: 'text-[#8C87D9]' },
  신발:    { cellBg: 'bg-teal-50',    chipBg: 'bg-teal-100',    icon: '#0D9488', title: 'text-[#0F4C46]', meta: 'text-[#5FAFA3]' },
  가방:    { cellBg: 'bg-rose-50',    chipBg: 'bg-rose-100',    icon: '#BE185D', title: 'text-[#7A1041]', meta: 'text-[#C97BA0]' },
  액세서리: { cellBg: 'bg-emerald-50', chipBg: 'bg-emerald-100', icon: '#059669', title: 'text-[#0F5132]', meta: 'text-[#5FA98A]' },
};

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
    // 디자인 시스템 Step 5(docs/design-system-scope.md, P1-27) —
    // FridgeView는 P0-51(G37)에서 그리드 틈·셀 여백·이모지·배지를
    // 고정 px로 바꿔 역방향 스케일링(OS 글자 확대) 내성을 얻었는데,
    // 같은 "모델 그리드 + 칸 셀" 구조를 따로 구현한 이 컴포넌트는
    // 그 수정이 안 닿아 같은 class의 overflow 버그에 여전히 노출돼
    // 있었다(P1-27이 지목한 "한쪽만 고쳐지는" 패턴 그대로). 완전한
    // 컴포넌트 통합은 두 칸 디자인(텍스트 목록 vs 이모지 썸네일)이
    // 달라 시각 변경 위험이 커 보류하고, FridgeView에서 이미 검증된
    // 고정 px 전환 기법만 동일하게 적용.
    <div
      className="grid gap-[12px] bg-gradient-to-br from-slate-50 to-gray-100 rounded-card p-[12px]"
      style={{
        gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))`,
        gridTemplateRows:    `repeat(${model.rows}, minmax(128px, auto))`,
      }}
    >
      {model.cells.map((cell, idx) => {
        const meta      = WARDROBE_SECTION_META[cell.section];
        const tint      = GROUP_TINT[WARDROBE_SECTION_GROUP[cell.section]];
        const Icon      = SECTION_ICON[cell.section];
        const cellItems = itemsBySection.get(cell.section) ?? [];
        const count     = cellItems.length;
        const isActive  = highlight === cell.section;
        // P2-31 — 큰 칸(293×133)과 작은 칸(89×156)이 같은 세로 쌓임
        // 레이아웃을 써서 큰 칸은 라벨+썸네일 3개 아래로 빈 공간이
        // 크게 남고, 작은 칸은 라벨이 빠듯했다(실측). colSpan>1(2칸
        // 이상 차지하는 넓은 셀)만 가로 레이아웃으로 전환해 여유
        // 폭을 썸네일 더 보여주는 데 쓰고, 좁은 1칸은 기존 세로
        // 레이아웃(이미 잘 맞음)을 그대로 유지한다.
        const isWide    = cell.colSpan > 1;
        const thumbLimit = isWide ? 8 : 3;

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
            // 리디자인(옵션 B) — FridgeView와 같은 패턴: 흰 배경+회색
            // 링 대신 패션 그룹별 틴트로 칸을 구분.
            className={[
              'relative text-left rounded-2xl p-[16px] overflow-hidden ring-1',
              tint.cellBg,
              isActive ? 'ring-2 ring-indigo-500' : 'ring-black/[0.03]',
              // justify-between이었을 때, 같은 행의 옆 칸이 아이템이 많아 카드가
              // 커지면 이 칸의 본문(라벨)이 아래로 밀려 옆 칸과 라벨 높이가
              // 어긋나 보였다(C2·C8 발견). 세로형은 본문을 헤더 바로 아래 고정.
              isWide ? 'flex items-center gap-[14px]' : 'flex flex-col gap-[8px]',
            ].join(' ')}
            style={{
              gridColumn: `${cell.col} / span ${cell.colSpan}`,
              gridRow:    `${cell.row} / span ${cell.rowSpan}`,
              boxShadow:  '0 1px 2px -1px rgba(31, 31, 46, 0.04), 0 4px 10px -6px rgba(31, 31, 46, 0.10)',
            }}
            aria-label={`${meta.label} — ${count}개`}
          >
            {isWide ? (
              <>
                {/* 넓은 칸(2칸 이상) — 아이콘·라벨+카운트·썸네일을 한 행에 가로로
                    배치해 남는 폭을 썸네일 더 보여주는 데 쓴다.
                    리디자인(옵션 B) — 이모지 대신 그룹 틴트의 라인 아이콘. */}
                <span
                  className={`flex items-center justify-center rounded-2xl shrink-0 w-[56px] h-[56px] ${tint.chipBg}`}
                  aria-hidden
                >
                  <Icon size={26} strokeWidth={1.8} style={{ color: tint.icon }} />
                </span>
                <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between gap-[8px]">
                    <p className={`text-sm font-bold leading-tight truncate ${tint.title}`}>{meta.label}</p>
                    {count > 0 && (
                      <span className="text-[10px] font-bold rounded-full px-[6px] py-[2px] tabular-nums bg-gray-900 text-white leading-tight shrink-0">
                        {count}
                      </span>
                    )}
                  </div>
                  {count === 0 ? (
                    <p className={`text-xs leading-tight truncate ${tint.meta}`}>{meta.hint}</p>
                  ) : (
                    <div className="flex flex-wrap gap-[4px] leading-none">
                      {cellItems.slice(0, thumbLimit).map((item, i) => (
                        <span key={i} className="emoji text-[18px]" aria-hidden title={item.name}>
                          {FASHION_EMOJI[item.category] ?? '👕'}
                        </span>
                      ))}
                      {count > thumbLimit && (
                        <span className={`text-xs font-semibold self-center leading-none ${tint.meta}`}>
                          +{count - thumbLimit}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* 좁은 1칸 — 카운트 배지를 라벨과 한 줄에 같이 두면 "액세서리"
                    4글자가 좁은 폭(89px)에서 잘렸다(실측, 회귀). 배지는 아이콘
                    옆 헤더 행에 두고, 라벨은 그 아래 줄에서 폭을 전부 쓴다. */}
                <div className="flex items-start justify-between gap-[4px]">
                  {/* 리디자인(옵션 B) — 이모지 대신 그룹 틴트의 라인 아이콘. */}
                  <span
                    className={`flex items-center justify-center rounded-2xl shrink-0 w-[48px] h-[48px] ${tint.chipBg}`}
                    aria-hidden
                  >
                    <Icon size={22} strokeWidth={1.8} style={{ color: tint.icon }} />
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] font-bold rounded-full px-[6px] py-[2px] tabular-nums bg-gray-900 text-white leading-tight mt-0.5">
                      {count}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-[6px]">
                  <p className={`text-sm font-bold leading-tight truncate ${tint.title}`}>{meta.label}</p>
                  {count === 0 ? (
                    <p className={`text-xs leading-tight truncate ${tint.meta}`}>{meta.hint}</p>
                  ) : (
                    <div className="flex flex-wrap gap-[4px] leading-none">
                      {cellItems.slice(0, thumbLimit).map((item, i) => (
                        <span key={i} className="emoji text-[18px]" aria-hidden title={item.name}>
                          {FASHION_EMOJI[item.category] ?? '👕'}
                        </span>
                      ))}
                      {count > thumbLimit && (
                        <span className={`text-xs font-semibold self-center leading-none ${tint.meta}`}>
                          +{count - thumbLimit}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
