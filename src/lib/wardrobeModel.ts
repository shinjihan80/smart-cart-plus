import type { FashionCategory, FashionGroup } from '@/types';

// ─────────────────────────────────────────────
// 섹션 타입
// ─────────────────────────────────────────────

export type WardrobeSection =
  | 'hanging'      // 걸이 (1단 or 2단 상단 — 아우터·원피스)
  | 'hanging_2'    // 2단 걸이 하단 — 상의·셔츠
  | 'folded'       // 1단 서랍
  | 'drawer_2'     // 2단 서랍
  | 'drawer_3'     // 3단 서랍
  | 'drawer_4'     // 4단 서랍
  | 'drawer_5'     // 5단 서랍
  | 'drawer_s1'    // 작은 서랍 칸 1
  | 'drawer_s2'    // 작은 서랍 칸 2
  | 'drawer_s3'    // 작은 서랍 칸 3
  | 'shoes'
  | 'bags'
  | 'accessories';

export type WardrobeModelId = 'hanger' | 'wardrobe' | 'dresser' | 'system';

const MODEL_IDS: ReadonlyArray<WardrobeModelId> = ['hanger', 'wardrobe', 'dresser', 'system'];

export const isWardrobeModelId = (v: unknown): v is WardrobeModelId =>
  typeof v === 'string' && MODEL_IDS.includes(v as WardrobeModelId);

// ─────────────────────────────────────────────
// 그리드 셀
// ─────────────────────────────────────────────

export interface WardrobeCell {
  section: WardrobeSection;
  col:     number;
  row:     number;
  colSpan: number;
  rowSpan: number;
}

export interface WardrobeModel {
  id:          WardrobeModelId;
  label:       string;
  emoji:       string;
  description: string;
  cols:        number;
  rows:        number;
  cells:       WardrobeCell[];
}

// ─────────────────────────────────────────────
// 섹션 → 패션 그룹 매핑
// ─────────────────────────────────────────────

export const WARDROBE_SECTION_GROUP: Record<WardrobeSection, FashionGroup> = {
  hanging:     '의류',
  hanging_2:   '의류',
  folded:      '의류',
  drawer_2:    '의류',
  drawer_3:    '의류',
  drawer_4:    '의류',
  drawer_5:    '의류',
  drawer_s1:   '의류',
  drawer_s2:   '의류',
  drawer_s3:   '의류',
  shoes:       '신발',
  bags:        '가방',
  accessories: '액세서리',
};

// 서랍(개어넣기)에 해당하는 카테고리 — 나머지 의류는 걸이
export const FOLDED_CATEGORIES: ReadonlyArray<FashionCategory> = ['하의'];

export const WARDROBE_SECTION_META: Record<WardrobeSection, { emoji: string; label: string; hint: string }> = {
  hanging:     { emoji: '🪝', label: '걸이 (상단)',       hint: '아우터·원피스·점프수트' },
  hanging_2:   { emoji: '🪝', label: '걸이 (하단)',       hint: '상의·셔츠·블라우스' },
  folded:      { emoji: '🗂️', label: '1단 서랍',        hint: '하의·접어 보관' },
  drawer_2:    { emoji: '🗂️', label: '2단 서랍',        hint: '니트·스웨터·후드' },
  drawer_3:    { emoji: '🗂️', label: '3단 서랍',        hint: '속옷·양말·기타' },
  drawer_4:    { emoji: '🗂️', label: '4단 서랍',        hint: '계절 의류·여분' },
  drawer_5:    { emoji: '🗂️', label: '5단 서랍',        hint: '기타·잡화' },
  drawer_s1:   { emoji: '🗂️', label: '작은 서랍 ①',    hint: '속옷·양말' },
  drawer_s2:   { emoji: '🗂️', label: '작은 서랍 ②',    hint: '스카프·손수건' },
  drawer_s3:   { emoji: '🗂️', label: '작은 서랍 ③',    hint: '기타 소품' },
  shoes:       { emoji: '👟', label: '신발',            hint: '신발·슬리퍼·부츠' },
  bags:        { emoji: '👜', label: '가방',            hint: '가방·백팩·클러치' },
  accessories: { emoji: '✨', label: '악세서리',         hint: '모자·주얼리·스카프' },
};

// ─────────────────────────────────────────────
// 모델 프리셋
// ─────────────────────────────────────────────

/** 행거 — 걸이대 중심, 하단 신발·가방 */
const HANGER: WardrobeModel = {
  id: 'hanger', label: '행거', emoji: '🪝',
  description: '미니멀 걸이대 + 하단 공간',
  cols: 2, rows: 2,
  cells: [
    { section: 'hanging',  col: 1, row: 1, colSpan: 2, rowSpan: 1 },
    { section: 'shoes',    col: 1, row: 2, colSpan: 1, rowSpan: 1 },
    { section: 'bags',     col: 2, row: 2, colSpan: 1, rowSpan: 1 },
  ],
};

/** 일반 옷장 — 걸이 + 1단 서랍 + 신발/가방/악세서리 */
const WARDROBE_MODEL: WardrobeModel = {
  id: 'wardrobe', label: '일반 옷장', emoji: '🚪',
  description: '걸이·서랍·하단 표준 구성',
  cols: 3, rows: 3,
  cells: [
    { section: 'hanging',     col: 1, row: 1, colSpan: 3, rowSpan: 1 },
    { section: 'folded',      col: 1, row: 2, colSpan: 3, rowSpan: 1 },
    { section: 'shoes',       col: 1, row: 3, colSpan: 1, rowSpan: 1 },
    { section: 'bags',        col: 2, row: 3, colSpan: 1, rowSpan: 1 },
    { section: 'accessories', col: 3, row: 3, colSpan: 1, rowSpan: 1 },
  ],
};

/** 서랍장 — 3단 서랍 중심, 상단 걸이 공간 + 하단 신발·악세서리·가방 */
const DRESSER: WardrobeModel = {
  id: 'dresser', label: '서랍장', emoji: '🗂️',
  description: '3단 서랍 + 걸이·하단 수납',
  cols: 3, rows: 4,
  cells: [
    { section: 'hanging',     col: 1, row: 1, colSpan: 3, rowSpan: 1 },
    { section: 'folded',      col: 1, row: 2, colSpan: 3, rowSpan: 1 },
    { section: 'drawer_2',    col: 1, row: 3, colSpan: 3, rowSpan: 1 },
    { section: 'drawer_3',    col: 1, row: 4, colSpan: 1, rowSpan: 1 },
    { section: 'shoes',       col: 2, row: 4, colSpan: 1, rowSpan: 1 },
    { section: 'accessories', col: 3, row: 4, colSpan: 1, rowSpan: 1 },
  ],
};

/** 시스템 옷장 — 긴 걸이 + 2단 서랍 + 전체 구역 */
const SYSTEM: WardrobeModel = {
  id: 'system', label: '시스템 옷장', emoji: '🏠',
  description: '구역별 분리 대용량 수납',
  cols: 3, rows: 3,
  cells: [
    { section: 'hanging',     col: 1, row: 1, colSpan: 1, rowSpan: 2 },
    { section: 'folded',      col: 2, row: 1, colSpan: 2, rowSpan: 1 },
    { section: 'drawer_2',    col: 2, row: 2, colSpan: 1, rowSpan: 1 },
    { section: 'shoes',       col: 3, row: 2, colSpan: 1, rowSpan: 1 },
    { section: 'bags',        col: 1, row: 3, colSpan: 1, rowSpan: 1 },
    { section: 'accessories', col: 2, row: 3, colSpan: 2, rowSpan: 1 },
  ],
};

export const WARDROBE_MODELS: Record<WardrobeModelId, WardrobeModel> = {
  hanger:   HANGER,
  wardrobe: WARDROBE_MODEL,
  dresser:  DRESSER,
  system:   SYSTEM,
};

export const WARDROBE_MODEL_LIST: WardrobeModel[] = MODEL_IDS.map((id) => WARDROBE_MODELS[id]);

export const DEFAULT_WARDROBE_MODEL: WardrobeModelId = 'wardrobe';

// ─────────────────────────────────────────────
// 섹션별 개별 설정
// ─────────────────────────────────────────────

export interface WardrobeConfig {
  hangingType:  'single' | 'double' | 'none';
  drawers:      0 | 1 | 2 | 3 | 4 | 5;
  splitDrawer?: 0 | 2 | 3;
  hasShoes:     boolean;
  hasBags:      boolean;
  hasAccessories: boolean;
}

export const DEFAULT_WARDROBE_CONFIG: WardrobeConfig = {
  hangingType: 'single',
  drawers: 1,
  splitDrawer: 0,
  hasShoes: true,
  hasBags: true,
  hasAccessories: true,
};

export function isValidWardrobeConfig(v: unknown): v is WardrobeConfig {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    (o.hangingType === 'single' || o.hangingType === 'double' || o.hangingType === 'none' || o.hangingType === 'standard') &&
    (o.drawers === 0 || o.drawers === 1 || o.drawers === 2 || o.drawers === 3 || o.drawers === 4 || o.drawers === 5) &&
    (o.splitDrawer === undefined || o.splitDrawer === 0 || o.splitDrawer === 2 || o.splitDrawer === 3) &&
    typeof o.hasShoes === 'boolean' &&
    typeof o.hasBags === 'boolean' &&
    typeof o.hasAccessories === 'boolean'
  );
}

export function buildWardrobeCells(config: WardrobeConfig): { cells: WardrobeCell[]; rows: number; cols: number } {
  const COLS = 3;
  const cells: WardrobeCell[] = [];
  let row = 1;

  if (config.hangingType === 'single' || (config.hangingType as string) === 'standard') {
    cells.push({ section: 'hanging', col: 1, row, colSpan: COLS, rowSpan: 1 });
    row++;
  } else if (config.hangingType === 'double') {
    cells.push({ section: 'hanging',   col: 1, row, colSpan: COLS, rowSpan: 1 });
    row++;
    cells.push({ section: 'hanging_2', col: 1, row, colSpan: COLS, rowSpan: 1 });
    row++;
  }

  // 작은 서랍 칸 (2칸 or 3칸 나란히) — 일반 서랍 위
  const split = config.splitDrawer ?? 0;
  if (split === 2) {
    cells.push({ section: 'drawer_s1', col: 1, row, colSpan: 1, rowSpan: 1 });
    cells.push({ section: 'drawer_s2', col: 2, row, colSpan: 2, rowSpan: 1 });
    row++;
  } else if (split === 3) {
    cells.push({ section: 'drawer_s1', col: 1, row, colSpan: 1, rowSpan: 1 });
    cells.push({ section: 'drawer_s2', col: 2, row, colSpan: 1, rowSpan: 1 });
    cells.push({ section: 'drawer_s3', col: 3, row, colSpan: 1, rowSpan: 1 });
    row++;
  }

  const drawerSections: WardrobeSection[] = ['folded', 'drawer_2', 'drawer_3', 'drawer_4', 'drawer_5'];
  for (let i = 0; i < config.drawers; i++) {
    cells.push({ section: drawerSections[i], col: 1, row, colSpan: COLS, rowSpan: 1 });
    row++;
  }

  const bottom: WardrobeSection[] = [
    ...(config.hasShoes       ? ['shoes']       : []) as WardrobeSection[],
    ...(config.hasBags        ? ['bags']        : []) as WardrobeSection[],
    ...(config.hasAccessories ? ['accessories'] : []) as WardrobeSection[],
  ];

  if (bottom.length === 3) {
    bottom.forEach((s, i) => cells.push({ section: s, col: i + 1, row, colSpan: 1, rowSpan: 1 }));
    row++;
  } else if (bottom.length === 2) {
    cells.push({ section: bottom[0], col: 1, row, colSpan: 1, rowSpan: 1 });
    cells.push({ section: bottom[1], col: 2, row, colSpan: 2, rowSpan: 1 });
    row++;
  } else if (bottom.length === 1) {
    cells.push({ section: bottom[0], col: 1, row, colSpan: COLS, rowSpan: 1 });
    row++;
  }

  if (cells.length === 0) {
    cells.push({ section: 'hanging', col: 1, row: 1, colSpan: COLS, rowSpan: 1 });
    row = 2;
  }

  return { cells, rows: row - 1, cols: COLS };
}

// ─────────────────────────────────────────────
// 프리셋 (냉장고 모델과 동일한 카드 선택 방식)
// ─────────────────────────────────────────────

export interface WardrobePreset {
  id:          string;
  group:       string;
  label:       string;
  emoji:       string;
  description: string;
  config:      WardrobeConfig;
}

export const WARDROBE_PRESETS: WardrobePreset[] = [
  // ── 행거 ──────────────────────────────────────
  {
    id: 'hanger-mini',
    group: '행거',
    label: '미니 행거',
    emoji: '🪝',
    description: '걸이대만 — 원룸·미니멀',
    config: { hangingType: 'single', drawers: 0, splitDrawer: 0, hasShoes: false, hasBags: false, hasAccessories: false },
  },
  {
    id: 'hanger',
    group: '행거',
    label: '행거',
    emoji: '🪝',
    description: '걸이 + 신발·가방 하단',
    config: { hangingType: 'single', drawers: 0, splitDrawer: 0, hasShoes: true,  hasBags: true,  hasAccessories: false },
  },
  {
    id: 'hanger-double',
    group: '행거',
    label: '2단 행거',
    emoji: '🪝',
    description: '상·하단 걸이 + 신발·가방',
    config: { hangingType: 'double', drawers: 0, splitDrawer: 0, hasShoes: true,  hasBags: true,  hasAccessories: false },
  },
  // ── 신발장 ────────────────────────────────────
  {
    id: 'shoes-only',
    group: '신발장',
    label: '신발장',
    emoji: '👟',
    description: '신발 전용 수납',
    config: { hangingType: 'none', drawers: 0, splitDrawer: 0, hasShoes: true,  hasBags: false, hasAccessories: false },
  },
  {
    id: 'shoes-bags',
    group: '신발장',
    label: '슈즈+가방',
    emoji: '👟',
    description: '신발·가방 하단 수납',
    config: { hangingType: 'none', drawers: 0, splitDrawer: 0, hasShoes: true,  hasBags: true,  hasAccessories: false },
  },
  // ── 옷장 ──────────────────────────────────────
  {
    id: 'wardrobe-hang1',
    group: '옷장',
    label: '걸이형 (1단)',
    emoji: '🚪',
    description: '걸이만 · 신발·가방·악세서리 하단',
    config: { hangingType: 'single', drawers: 0, splitDrawer: 0, hasShoes: true,  hasBags: true,  hasAccessories: true  },
  },
  {
    id: 'wardrobe-hang2',
    group: '옷장',
    label: '걸이형 (2단)',
    emoji: '🚪',
    description: '2단 걸이만 · 신발·가방·악세서리 하단',
    config: { hangingType: 'double', drawers: 0, splitDrawer: 0, hasShoes: true,  hasBags: true,  hasAccessories: true  },
  },
  {
    id: 'wardrobe-basic',
    group: '옷장',
    label: '기본 옷장',
    emoji: '🚪',
    description: '걸이 + 서랍 1단 + 전체',
    config: { hangingType: 'single', drawers: 1, splitDrawer: 0, hasShoes: true,  hasBags: true,  hasAccessories: true  },
  },
  {
    id: 'wardrobe-std',
    group: '옷장',
    label: '스탠다드',
    emoji: '🚪',
    description: '걸이 + 서랍 2단 + 전체',
    config: { hangingType: 'single', drawers: 2, splitDrawer: 0, hasShoes: true,  hasBags: true,  hasAccessories: true  },
  },
  {
    id: 'wardrobe-large',
    group: '옷장',
    label: '대형 옷장',
    emoji: '🚪',
    description: '걸이 + 서랍 3단 + 전체',
    config: { hangingType: 'single', drawers: 3, splitDrawer: 0, hasShoes: true,  hasBags: true,  hasAccessories: true  },
  },
  // ── 서랍장 ────────────────────────────────────
  {
    id: 'dresser-plain',
    group: '서랍장',
    label: '일반 서랍장',
    emoji: '🗂️',
    description: '서랍 3단 — 작은서랍 없음',
    config: { hangingType: 'none', drawers: 3, splitDrawer: 0, hasShoes: false, hasBags: false, hasAccessories: false },
  },
  {
    id: 'dresser-only',
    group: '서랍장',
    label: '서랍장 (분리형)',
    emoji: '🗂️',
    description: '작은서랍 3칸 + 3단 서랍',
    config: { hangingType: 'none', drawers: 3, splitDrawer: 3, hasShoes: false, hasBags: false, hasAccessories: false },
  },
  {
    id: 'dresser-wardrobe',
    group: '서랍장',
    label: '서랍형 옷장',
    emoji: '🗂️',
    description: '걸이 + 작은서랍 3칸 + 3단 + 신발·악세서리',
    config: { hangingType: 'single', drawers: 3, splitDrawer: 3, hasShoes: true,  hasBags: false, hasAccessories: true  },
  },
  // ── 시스템 옷장 ──────────────────────────────
  {
    id: 'system-basic',
    group: '시스템 옷장',
    label: '기본 시스템',
    emoji: '🏠',
    description: '2단 걸이 + 서랍 2단 + 전체',
    config: { hangingType: 'double', drawers: 2, splitDrawer: 0, hasShoes: true,  hasBags: true,  hasAccessories: true  },
  },
  {
    id: 'system-std',
    group: '시스템 옷장',
    label: '표준 시스템',
    emoji: '🏠',
    description: '2단 걸이 + 작은서랍 2칸 + 3단 + 전체',
    config: { hangingType: 'double', drawers: 3, splitDrawer: 2, hasShoes: true,  hasBags: true,  hasAccessories: true  },
  },
  {
    id: 'system-large',
    group: '시스템 옷장',
    label: '대형 시스템',
    emoji: '🏠',
    description: '2단 걸이 + 작은서랍 3칸 + 5단 + 전체',
    config: { hangingType: 'double', drawers: 5, splitDrawer: 3, hasShoes: true,  hasBags: true,  hasAccessories: true  },
  },
];

export function matchPreset(config: WardrobeConfig): string | null {
  for (const p of WARDROBE_PRESETS) {
    const c = p.config;
    if (
      config.hangingType  === c.hangingType  &&
      config.drawers      === c.drawers      &&
      (config.splitDrawer ?? 0) === (c.splitDrawer ?? 0) &&
      config.hasShoes     === c.hasShoes     &&
      config.hasBags      === c.hasBags      &&
      config.hasAccessories === c.hasAccessories
    ) return p.id;
  }
  return null;
}
