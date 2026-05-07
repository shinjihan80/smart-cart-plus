/**
 * 냉장고 모델 프리셋 — Phase 8.0
 *
 * 사용자가 자기 냉장고 타입을 선택하면, 그 모델이 노출하는 칸 목록과
 * 시각화용 그리드 좌표를 제공한다. 그리드는 col/row/colSpan/rowSpan
 * 단위로 표현되어 Step 3 시각화 컴포넌트가 그대로 렌더링한다.
 */

import type { FridgeSection } from '@/types';

// ─────────────────────────────────────────────
// 모델 ID
// ─────────────────────────────────────────────

export type FridgeModelId = 'side_by_side' | 'four_door' | 'one_door' | 'kimchi_only';

const MODEL_IDS: ReadonlyArray<FridgeModelId> = ['side_by_side', 'four_door', 'one_door', 'kimchi_only'];

export const isFridgeModelId = (v: unknown): v is FridgeModelId =>
  typeof v === 'string' && MODEL_IDS.includes(v as FridgeModelId);

// ─────────────────────────────────────────────
// 레이아웃 셀 — 그리드 위 칸 위치
// ─────────────────────────────────────────────

/**
 * 4-column × 6-row 그리드 위의 셀 좌표.
 * - col/row는 1-base (CSS grid-area와 동일)
 * - 도어 포켓은 본체 옆에 좁은 컬럼으로 배치
 */
export interface FridgeCell {
  section:  FridgeSection;
  col:      number;
  row:      number;
  colSpan:  number;
  rowSpan:  number;
}

export interface FridgeModel {
  id:          FridgeModelId;
  label:       string;
  emoji:       string;       // 모델 카드의 식별 아이콘
  description: string;
  cols:        number;       // 그리드 컬럼 수 (시각화 컨테이너용)
  rows:        number;       // 그리드 로우 수
  cells:       FridgeCell[]; // 모델이 노출하는 칸 목록
}

// ─────────────────────────────────────────────
// 프리셋
// ─────────────────────────────────────────────

/**
 * 양문형 (좌: 냉동, 우: 냉장 + 도어 포켓)
 * 4 cols × 6 rows
 *   col 1   : 냉동실 (위/아래)
 *   col 2-3 : 본체 냉장 (위/중/아래) + 야채 + 버터
 *   col 4   : 도어 포켓 (위/중/아래)
 */
const SIDE_BY_SIDE: FridgeModel = {
  id: 'side_by_side',
  label: '양문형',
  emoji: '🧊',
  description: '좌·우로 갈라진 가장 흔한 형태',
  cols: 4,
  rows: 6,
  cells: [
    { section: 'freezer_top',    col: 1, row: 1, colSpan: 1, rowSpan: 3 },
    { section: 'freezer_bottom', col: 1, row: 4, colSpan: 1, rowSpan: 3 },

    { section: 'main_top',    col: 2, row: 1, colSpan: 2, rowSpan: 1 },
    { section: 'butter',      col: 2, row: 2, colSpan: 1, rowSpan: 1 },
    { section: 'main_middle', col: 3, row: 2, colSpan: 1, rowSpan: 1 },
    { section: 'main_bottom', col: 2, row: 3, colSpan: 2, rowSpan: 1 },
    { section: 'crisper',     col: 2, row: 4, colSpan: 2, rowSpan: 2 },
    { section: 'pantry',      col: 2, row: 6, colSpan: 2, rowSpan: 1 },

    { section: 'door_top',    col: 4, row: 1, colSpan: 1, rowSpan: 2 },
    { section: 'door_middle', col: 4, row: 3, colSpan: 1, rowSpan: 2 },
    { section: 'door_bottom', col: 4, row: 5, colSpan: 1, rowSpan: 2 },
  ],
};

/**
 * 4도어 (위 2칸 냉장 좌·우 + 아래 2칸 냉동 좌·우)
 * 2 cols × 6 rows — 본체 위주, 도어는 단순화
 */
const FOUR_DOOR: FridgeModel = {
  id: 'four_door',
  label: '4도어',
  emoji: '🚪',
  description: '위는 냉장, 아래는 냉동인 4문 타입',
  cols: 2,
  rows: 6,
  cells: [
    { section: 'main_top',    col: 1, row: 1, colSpan: 2, rowSpan: 1 },
    { section: 'main_middle', col: 1, row: 2, colSpan: 1, rowSpan: 1 },
    { section: 'butter',      col: 2, row: 2, colSpan: 1, rowSpan: 1 },
    { section: 'main_bottom', col: 1, row: 3, colSpan: 2, rowSpan: 1 },
    { section: 'crisper',     col: 1, row: 4, colSpan: 2, rowSpan: 1 },

    { section: 'freezer_top',    col: 1, row: 5, colSpan: 2, rowSpan: 1 },
    { section: 'freezer_bottom', col: 1, row: 6, colSpan: 2, rowSpan: 1 },
  ],
};

/**
 * 1도어 (원룸·소형 냉장고 — 본체 + 작은 냉동)
 */
const ONE_DOOR: FridgeModel = {
  id: 'one_door',
  label: '1도어',
  emoji: '🚪',
  description: '소형·원룸용 — 냉장 위주에 작은 냉동',
  cols: 2,
  rows: 4,
  cells: [
    { section: 'freezer_top',  col: 1, row: 1, colSpan: 2, rowSpan: 1 },
    { section: 'main_top',     col: 1, row: 2, colSpan: 2, rowSpan: 1 },
    { section: 'main_middle',  col: 1, row: 3, colSpan: 1, rowSpan: 1 },
    { section: 'door_middle',  col: 2, row: 3, colSpan: 1, rowSpan: 1 },
    { section: 'crisper',      col: 1, row: 4, colSpan: 2, rowSpan: 1 },
  ],
};

/**
 * 김치냉장고 — 위·아래 두 칸 + 보조 실온
 */
const KIMCHI_ONLY: FridgeModel = {
  id: 'kimchi_only',
  label: '김치냉장고',
  emoji: '🥬',
  description: '김치·장아찌 장기 보관용',
  cols: 1,
  rows: 3,
  cells: [
    { section: 'kimchi_top',    col: 1, row: 1, colSpan: 1, rowSpan: 1 },
    { section: 'kimchi_bottom', col: 1, row: 2, colSpan: 1, rowSpan: 1 },
    { section: 'pantry',        col: 1, row: 3, colSpan: 1, rowSpan: 1 },
  ],
};

export const FRIDGE_MODELS: Record<FridgeModelId, FridgeModel> = {
  side_by_side: SIDE_BY_SIDE,
  four_door:    FOUR_DOOR,
  one_door:     ONE_DOOR,
  kimchi_only:  KIMCHI_ONLY,
};

export const FRIDGE_MODEL_LIST: FridgeModel[] = MODEL_IDS.map((id) => FRIDGE_MODELS[id]);

export const DEFAULT_FRIDGE_MODEL: FridgeModelId = 'side_by_side';

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────

/** 모델이 노출하지 않는 칸인지 — 등록 시 폴백 결정에 사용 */
export function modelHasSection(modelId: FridgeModelId, section: FridgeSection): boolean {
  return FRIDGE_MODELS[modelId].cells.some((c) => c.section === section);
}

/**
 * 권장 칸이 모델에 없으면 가장 비슷한 칸으로 폴백한다.
 * 예) 김치냉장고 모델인데 채소·과일 추천 → kimchi_top
 */
const FALLBACK_BY_ZONE: Record<string, FridgeSection> = {
  fridge:  'main_middle',
  door:    'door_middle',
  crisper: 'crisper',
  freezer: 'freezer_top',
  kimchi:  'kimchi_top',
  pantry:  'pantry',
};

export function resolveSectionForModel(
  modelId: FridgeModelId,
  preferred: FridgeSection,
  zone: string,
): FridgeSection {
  if (modelHasSection(modelId, preferred)) return preferred;
  const fallback = FALLBACK_BY_ZONE[zone];
  if (fallback && modelHasSection(modelId, fallback)) return fallback;
  // 마지막 폴백 — 모델의 첫 셀
  return FRIDGE_MODELS[modelId].cells[0].section;
}
