'use client';

import { motion } from 'framer-motion';

import {
  FRIDGE_MODELS,
  type FridgeModelId,
} from '@/lib/fridgeModel';
import {
  FRIDGE_SECTION_META,
  groupByEffectiveSection,
} from '@/lib/fridgeSection';
import { classifyExpiry } from '@/lib/expiryThresholds';
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

  // 칸별로 아이템 그룹화 — 상세 시트(page.tsx)와 동일한 effectiveFridgeSection 기준
  const bySection = groupByEffectiveSection(items, modelId);

  return (
    <div
      className="grid gap-2 bg-gradient-to-br from-slate-50 to-gray-100 rounded-[28px] p-3"
      style={{
        gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))`,
        gridTemplateRows:    `repeat(${model.rows}, minmax(64px, auto))`,
      }}
    >
      {model.cells.map((cell, idx) => {
        const meta        = FRIDGE_SECTION_META[cell.section];
        const list        = bySection.get(cell.section) ?? [];
        // 배지 색(urgent)과 숫자(list.length)가 서로 다른 의미라 빨간 배지 합이
        // 임박 수와 안 맞던 버그(P0-29) — 총 개수 배지는 항상 중립색, 임박 개수는
        // 별도 배지로 분리한다. "임박"은 today+soon만 — 홈 배지들과 같은 기준으로
        // 맞추기 위해 이미 지난(expired) 항목은 여기서도 뺀다(!== 'fresh'는 expired도
        // 포함해 홈 배지보다 항상 컸다).
        const urgentCount = list.filter((i) => {
          const bucket = classifyExpiry(i.dDay);
          return bucket === 'today' || bucket === 'soon';
        }).length;
        const urgent      = urgentCount > 0;
        // 재검토(C1 실측) P1 — urgent 배지가 today/soon만 세는 건
        // 의도된 설계(위 주석)지만, 그 결과 기한이 이미 지난 품목만
        // 있는 칸은 ⏱ 배지도 안 뜨고 전체 개수 배지만 중립색으로
        // 남아 칸 그림 어디에도 "여기 상한 게 있다"는 신호가 없었다
        // — "냉장실 아래칸 3개"만 보고는 그중 전부가 상했는지 전혀
        // 알 수 없었다. G8에서 전역 요약에 추가한 "기한초과" 칸과
        // 같은 언어로 칸별 배지도 분리한다.
        const expiredCount = list.filter((i) => classifyExpiry(i.dDay) === 'expired').length;
        const expired      = expiredCount > 0;
        const isActive    = highlight === cell.section;

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
              expired && !isActive ? 'ring-red-300 bg-red-50/50' : urgent && !isActive ? 'ring-rose-200 bg-rose-50/40' : '',
            ].join(' ')}
            style={{
              gridColumn: `${cell.col} / span ${cell.colSpan}`,
              gridRow:    `${cell.row} / span ${cell.rowSpan}`,
              boxShadow:  '0 2px 6px -3px rgba(31, 31, 46, 0.08)',
            }}
            aria-label={`${meta.label} — ${list.length}개${expired ? `, 기한초과 ${expiredCount}개` : ''}`}
          >
            <div className="flex items-start justify-between gap-1">
              <span className="emoji text-base" aria-hidden>{meta.emoji}</span>
              <div className="flex items-center gap-1">
                {expired && (
                  <span
                    className="text-[10px] font-bold rounded-full px-1.5 py-0.5 tabular-nums bg-red-700 text-white"
                    aria-label={`기한초과 ${expiredCount}개`}
                  >
                    🚫{expiredCount}
                  </span>
                )}
                {urgent && (
                  <span
                    className="text-[10px] font-bold rounded-full px-1.5 py-0.5 tabular-nums bg-rose-500 text-white"
                    aria-label={`임박 ${urgentCount}개`}
                  >
                    ⏱{urgentCount}
                  </span>
                )}
                {list.length > 0 && (
                  <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 tabular-nums bg-gray-900 text-white">
                    {list.length}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1.5">
              {/* P1-92 — "도어 중간 포켓"처럼 긴 칸 이름이 truncate 1줄 컷으로
                  잘렸다(C1·C8 실측). line-clamp-2로 2줄까지 허용. */}
              <p className="text-[11px] font-bold text-gray-800 leading-tight line-clamp-2 break-keep">{meta.label}</p>
              {list.length === 0 ? (
                // 빈 칸의 예시 힌트("잼·소스·드레싱" 등)와 실제 보유 품목이
                // 글자 크기·굵기·위치가 전부 같고 명도 차이(gray-400 vs
                // gray-500)만 있어 구분이 안 됐다 — 등록한 적 없는 품목을
                // 있는 것으로 오인하게 했다(P0-25, 전문단 E3 발견).
                // "예: " 접두 + 기울임으로 "이건 예시일 뿐 실제 보유품이
                // 아니다"를 명시적으로 표시한다.
                <p className="text-[10px] text-gray-400 italic mt-0.5 leading-tight line-clamp-1">예: {meta.hint}</p>
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
