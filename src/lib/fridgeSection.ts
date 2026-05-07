/**
 * 냉장고 칸(섹션) 매핑 — Phase 8.0
 *
 * 식품 카테고리·보관 타입·이름 키워드를 조합해 권장 보관 위치를 결정한다.
 * 룰 기반이라 클라이언트에서 즉시 평가 가능하며, 향후 AI 에이전트로 보강 예정.
 */

import type { FoodCategory, FoodItem, FridgeSection, StorageType } from '@/types';

// ─────────────────────────────────────────────
// 칸 메타데이터 (라벨·이모지·짧은 설명)
// ─────────────────────────────────────────────

export interface FridgeSectionMeta {
  id:    FridgeSection;
  label: string;     // UI 표시명 (한국어)
  emoji: string;     // 시각화에서 칸 아이콘
  hint:  string;     // 한 줄 설명 (어떤 음식이 어울리는지)
  zone:  'fridge' | 'door' | 'crisper' | 'freezer' | 'kimchi' | 'pantry';
}

export const FRIDGE_SECTION_META: Record<FridgeSection, FridgeSectionMeta> = {
  main_top:    { id: 'main_top',    label: '냉장실 위칸',    emoji: '🥫', hint: '바로 먹는 반찬·즉석 식품',     zone: 'fridge' },
  main_middle: { id: 'main_middle', label: '냉장실 중앙',    emoji: '🥛', hint: '유제품·달걀·요리한 음식',      zone: 'fridge' },
  main_bottom: { id: 'main_bottom', label: '냉장실 아래칸',  emoji: '🥩', hint: '가장 차가운 곳 — 정육·생선',   zone: 'fridge' },

  door_top:    { id: 'door_top',    label: '도어 위 포켓',   emoji: '🥫', hint: '잼·소스·드레싱',               zone: 'door' },
  door_middle: { id: 'door_middle', label: '도어 중간 포켓', emoji: '🧃', hint: '음료·주스',                    zone: 'door' },
  door_bottom: { id: 'door_bottom', label: '도어 아래 포켓', emoji: '🍶', hint: '간장·식초 등 큰 양념병',       zone: 'door' },

  crisper:     { id: 'crisper',     label: '야채실',         emoji: '🥬', hint: '채소·과일 (습도 유지)',        zone: 'crisper' },
  butter:      { id: 'butter',      label: '버터·치즈칸',    emoji: '🧈', hint: '버터·치즈 (살짝 따뜻)',         zone: 'fridge' },

  freezer_top:    { id: 'freezer_top',    label: '냉동실 위칸',   emoji: '🧊', hint: '아이스크림·냉동 간식',     zone: 'freezer' },
  freezer_bottom: { id: 'freezer_bottom', label: '냉동실 아래칸', emoji: '🥟', hint: '냉동 정육·만두·식재료',    zone: 'freezer' },

  kimchi_top:    { id: 'kimchi_top',    label: '김치냉장고 위',   emoji: '🥬', hint: '겉절이·김치',           zone: 'kimchi' },
  kimchi_bottom: { id: 'kimchi_bottom', label: '김치냉장고 아래', emoji: '🥒', hint: '장기 보관 김치·장아찌', zone: 'kimchi' },

  pantry:      { id: 'pantry',      label: '실온 보관',      emoji: '📦', hint: '면·통조림·실온 식품',          zone: 'pantry' },
};

// ─────────────────────────────────────────────
// 룰 기반 권장 위치
// ─────────────────────────────────────────────

/**
 * 카테고리만으로 결정되는 기본 매핑 (storageType이 '냉장'일 때 적용)
 */
const CATEGORY_DEFAULT: Record<FoodCategory, FridgeSection> = {
  '채소·과일':   'crisper',
  '정육·계란':   'main_bottom',
  '수산·해산':   'main_bottom',
  '유제품':      'main_middle',
  '음료':        'door_middle',
  '간식·과자':   'main_top',
  '양념·소스':   'door_top',
  '면·즉석':     'pantry',
  '빵·베이커리': 'pantry',
  '건강식품':    'main_top',
  '기타 식품':   'main_middle',
};

/**
 * 이름 키워드 → 더 정확한 칸 (카테고리 매핑보다 우선)
 * 사용자가 자주 쓰는 단어만 좁게 — 과적합 방지
 */
const KEYWORD_OVERRIDES: Array<{ patterns: RegExp; section: FridgeSection }> = [
  { patterns: /김치|깍두기|총각|동치미|장아찌/,   section: 'kimchi_bottom' },
  { patterns: /버터|치즈|모짜렐라|체다|브리/,    section: 'butter' },
  { patterns: /계란|달걀/,                        section: 'main_middle' },
  { patterns: /우유|요거트|요구르트/,             section: 'main_middle' },
  { patterns: /잼|시럽|마요|케찹|머스타드|드레싱/, section: 'door_top' },
  { patterns: /간장|식초|미림|맛술|액젓/,         section: 'door_bottom' },
  { patterns: /물|주스|콜라|사이다|음료/,         section: 'door_middle' },
];

/**
 * 식품 1건의 권장 보관 위치를 반환한다.
 *
 * 우선순위
 *   1) storageType === '냉동' → 정육·생선이면 freezer_bottom, 그 외 freezer_top
 *   2) storageType === '실온' → pantry
 *   3) 이름 키워드 매칭 (KEYWORD_OVERRIDES)
 *   4) 카테고리 기본값 (CATEGORY_DEFAULT)
 */
export function recommendFridgeSection(
  input: Pick<FoodItem, 'name' | 'foodCategory' | 'storageType'>,
): FridgeSection {
  const { name, foodCategory, storageType } = input;

  if (storageType === '냉동') {
    if (foodCategory === '정육·계란' || foodCategory === '수산·해산') {
      return 'freezer_bottom';
    }
    return 'freezer_top';
  }

  if (storageType === '실온') {
    return 'pantry';
  }

  // storageType === '냉장' — 키워드 우선
  for (const rule of KEYWORD_OVERRIDES) {
    if (rule.patterns.test(name)) {
      return rule.section;
    }
  }

  return CATEGORY_DEFAULT[foodCategory];
}

// ─────────────────────────────────────────────
// 그루핑 헬퍼
// ─────────────────────────────────────────────

/**
 * 식품 리스트를 칸별로 그룹화한다.
 * 칸이 지정되지 않은 항목은 recommendFridgeSection으로 자동 매핑.
 */
export function groupBySection(items: FoodItem[]): Map<FridgeSection, FoodItem[]> {
  const map = new Map<FridgeSection, FoodItem[]>();
  for (const item of items) {
    const section = item.fridgeSection ?? recommendFridgeSection(item);
    const list = map.get(section) ?? [];
    list.push(item);
    map.set(section, list);
  }
  return map;
}

/** storageType과 칸의 정합성 체크 (UI에서 경고용) */
export function isSectionCompatible(section: FridgeSection, storageType: StorageType): boolean {
  const zone = FRIDGE_SECTION_META[section].zone;
  if (storageType === '냉동') return zone === 'freezer';
  if (storageType === '실온') return zone === 'pantry';
  // 냉장 — 냉동·실온이 아니면 OK
  return zone !== 'freezer' && zone !== 'pantry';
}
