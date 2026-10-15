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
import { classifyExpiry, EXPIRY_TONE } from '@/lib/expiryThresholds';
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
    // 재검토(비판 모드, 현재 라운드 실측) P0-51 — gap-2/p-3(그리드)와
    // 셀 내부 p-2.5·emoji text-base·배지 gap-1/px-1.5 py-0.5가 전부
    // rem이라, 루트 폰트가 커지면(OS 글자 확대) 열 너비(1fr)는 안
    // 바뀌는데 그 안의 여백·아이콘·배지가 같이 커져 셀 자체가 트랙
    // 밖으로 넘쳤다(루트 27px 실측: 셀 scrollWidth 77 vs clientWidth
    // 60, 배지 줄은 60 vs 26 — 폭의 절반 이상 넘침). 장식 치수(그리드
    // 틈·셀 안쪽 여백·이모지·배지)만 고정 px로 바꿔 더는 커지지 않게
    // 한다 — 칸 이름·배지 숫자(이미 text-[11px]/text-[10px]로 고정
    // px)는 원래도 안 바뀌던 값이라 그대로 둠.
    <div
      className="grid gap-[8px] bg-gradient-to-br from-slate-50 to-gray-100 rounded-card p-[12px]"
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
        // P1-111 — urgent 배지는 today+soon을 묶어서 세는데 색은 둘 중
        // 더 급한 today가 하나라도 있으면 그 색을 쓴다(SectionDetailSheet
        // 임박 칩과 동일 규칙 — 한 냉장고 안에서 같은 집계가 다른 색으로
        // 안 보이게).
        const urgentTone = list.some((i) => classifyExpiry(i.dDay) === 'today') ? EXPIRY_TONE.today : EXPIRY_TONE.soon;
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
              'relative flex flex-col justify-between text-left rounded-2xl p-[10px]',
              'bg-white ring-1',
              isActive ? 'ring-2 ring-indigo-500' : 'ring-gray-100',
              expired && !isActive ? 'ring-red-300 bg-red-50/50' : urgent && !isActive ? 'ring-rose-200 bg-rose-50/40' : '',
            ].join(' ')}
            style={{
              gridColumn: `${cell.col} / span ${cell.colSpan}`,
              gridRow:    `${cell.row} / span ${cell.rowSpan}`,
              boxShadow:  '0 2px 6px -3px rgba(31, 31, 46, 0.08)',
            }}
            aria-label={`${meta.label} — ${list.length}개 보관${urgent ? `, 임박 ${urgentCount}개` : ''}${expired ? `, 기한초과 ${expiredCount}개` : ''}`}
          >
            <div className="flex items-start justify-between gap-[4px]">
              <span className="emoji text-[16px]" aria-hidden>{meta.emoji}</span>
              {/*
               * 재검토(비판 모드, 2026-10-15) — P1-75(위 "통합" 리팩터)가
               * 숫자를 하나로 합치며 그 숫자를 "총개수"로 정해, 색은
               * 상태(임박/기한초과)를 뜻하는데 숫자는 그걸 안 세는
               * 불일치가 재발했다(P0-29 재오픈 — ⏱4인데 실제 임박은
               * 1개, C8·C9·E1·E2·E3 5인 확인). 배지는 이제 "그 색이
               * 뜻하는 걸 그 숫자만큼" 보여준다 — expired면 기한초과
               * 개수, urgent면 임박 개수. 둘 다 아니면 배지 자체를 안
               * 그린다(총개수는 아래 칸 이름 줄로 이동). 버튼 자체의
               * aria-label(위)이 이미 임박·기한초과 수를 포함하고,
               * 스크린리더는 버튼 레벨 aria-label만 읽고 자식 요소는
               * 건너뛰므로 이 span은 장식으로만 남겨 aria-hidden 처리.
               */}
              {(expired || urgent) && (
                <span
                  // P1-111 — red-700/rose-500 원색 대신 EXPIRY_TONE의
                  // bar(솔리드 채움)를 그대로 쓴다. 칸 상세 시트의
                  // "임박 N" 칩·식품 카드 D배지와 같은 색 소스라 한
                  // 화면 안에서 같은 상태가 다르게 안 보인다.
                  className={`text-[10px] font-bold rounded-full px-[6px] py-[2px] tabular-nums text-white ${
                    expired ? EXPIRY_TONE.expired.bar : urgentTone.bar
                  }`}
                  aria-hidden
                >
                  {expired ? `🚫${expiredCount}` : `⏱${urgentCount}`}
                </span>
              )}
            </div>

            <div className="mt-[6px]">
              {/* P1-92 — "도어 중간 포켓"처럼 긴 칸 이름이 truncate 1줄 컷으로
                  잘렸다(C1·C8 실측). line-clamp-2로 2줄까지 허용.
                  총개수는 더는 우상단 배지가 아니라(P0-29 재오픈 수정)
                  여기 라벨 옆 중립 텍스트로 이동 — 상태(색)와 분리된
                  순수 정보라 시각적으로도 분리한다. */}
              <p title={meta.label} className="text-[11px] font-bold text-gray-800 leading-tight line-clamp-2 break-keep">
                {meta.label}
                {list.length > 0 && <span className="font-normal text-gray-400"> · {list.length}</span>}
              </p>
              {list.length === 0 ? (
                // 빈 칸의 예시 힌트("잼·소스·드레싱" 등)와 실제 보유 품목이
                // 글자 크기·굵기·위치가 전부 같고 명도 차이(gray-400 vs
                // gray-500)만 있어 구분이 안 됐다 — 등록한 적 없는 품목을
                // 있는 것으로 오인하게 했다(P0-25, 전문단 E3 발견).
                // "예: " 접두 + 기울임으로 "이건 예시일 뿐 실제 보유품이
                // 아니다"를 명시적으로 표시한다.
                <p title={`예: ${meta.hint}`} className="text-[10px] text-gray-400 italic mt-0.5 leading-tight line-clamp-1">예: {meta.hint}</p>
              ) : (
                // 재검토(비판 모드) P1-83 — line-clamp-1로 잘리는 품목
                // 목록에 title 속성이 없어, 잘린 이름 전체를 확인할
                // 방법이(호버 툴팁조차) 없었다(전문단 E2 실측).
                <p
                  title={list.map((i) => i.name).join(', ')}
                  className="text-[10px] text-gray-500 mt-0.5 leading-tight line-clamp-1"
                >
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
