import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FRIDGE_MODELS,
  FRIDGE_MODEL_LIST,
  isFridgeModelId,
  modelHasSection,
  resolveSectionForModel,
  planSectionMigrations,
} from '../src/lib/fridgeModel.ts';
import type { CartItem } from '../src/types/index.ts';

test('FRIDGE_MODEL_LIST — 4종 프리셋 모두 노출', () => {
  assert.equal(FRIDGE_MODEL_LIST.length, 4);
  const ids = FRIDGE_MODEL_LIST.map((m) => m.id);
  assert.deepEqual(ids, ['side_by_side', 'four_door', 'one_door', 'kimchi_only']);
});

test('FRIDGE_MODELS — 모든 cell의 col/row가 cols/rows 범위 내', () => {
  for (const model of Object.values(FRIDGE_MODELS)) {
    for (const cell of model.cells) {
      assert.ok(cell.col >= 1 && cell.col <= model.cols, `${model.id}/${cell.section}: col 범위 초과`);
      assert.ok(cell.row >= 1 && cell.row <= model.rows, `${model.id}/${cell.section}: row 범위 초과`);
      assert.ok(cell.col + cell.colSpan - 1 <= model.cols, `${model.id}/${cell.section}: colSpan 초과`);
      assert.ok(cell.row + cell.rowSpan - 1 <= model.rows, `${model.id}/${cell.section}: rowSpan 초과`);
    }
  }
});

test('isFridgeModelId — 유효 ID는 true, 그 외 false', () => {
  assert.equal(isFridgeModelId('side_by_side'), true);
  assert.equal(isFridgeModelId('four_door'), true);
  assert.equal(isFridgeModelId('unknown'), false);
  assert.equal(isFridgeModelId(123), false);
  assert.equal(isFridgeModelId(null), false);
});

test('modelHasSection — 김치냉장고는 main_top을 가지지 않음', () => {
  assert.equal(modelHasSection('kimchi_only', 'main_top'), false);
  assert.equal(modelHasSection('kimchi_only', 'kimchi_top'), true);
  assert.equal(modelHasSection('side_by_side', 'main_top'), true);
});

test('resolveSectionForModel — 김치냉장고에서 main_top 추천 시 zone fallback', () => {
  // pantry zone는 김치냉장고에 있음
  assert.equal(resolveSectionForModel('kimchi_only', 'pantry', 'pantry'), 'pantry');
  // fridge zone fallback은 main_middle인데 김치냉장고엔 없으므로 첫 셀(kimchi_top)
  assert.equal(resolveSectionForModel('kimchi_only', 'main_top', 'fridge'), 'kimchi_top');
});

test('resolveSectionForModel — 1도어에서 freezer_bottom 추천 시 freezer_top으로 폴백', () => {
  assert.equal(resolveSectionForModel('one_door', 'freezer_bottom', 'freezer'), 'freezer_top');
});

test('resolveSectionForModel — 모델이 가진 칸이면 그대로 반환', () => {
  assert.equal(resolveSectionForModel('side_by_side', 'crisper', 'crisper'), 'crisper');
  assert.equal(resolveSectionForModel('four_door', 'main_bottom', 'fridge'), 'main_bottom');
});

// ─── planSectionMigrations (Phase 8.0 Step 5 — 우선순위 3) ────────────────

function food(id: string, name: string, section?: string): CartItem {
  return {
    id,
    name,
    category:          '식품',
    foodCategory:      '기타 식품',
    storageType:       '냉장',
    baseShelfLifeDays: 7,
    purchaseDate:      '2026-05-01',
    ...(section ? { fridgeSection: section as never } : {}),
  } as CartItem;
}

test('planSectionMigrations — 모델 호환 식품은 마이그레이션 대상 아님', () => {
  // side_by_side는 main_top을 가지므로 변경 불필요
  const items = [food('f1', '두부', 'main_top')];
  const plan = planSectionMigrations(items, 'side_by_side');
  assert.equal(plan.length, 0);
});

test('planSectionMigrations — 김치냉장고로 바꾸면 main_* 식품들이 재매핑됨', () => {
  const items = [
    food('f1', '두부',      'main_top'),
    food('f2', '닭가슴살',  'main_bottom'),
    food('f3', '실온 라면', 'pantry'),       // 김치냉장고도 pantry 있으니 제외돼야 함
    food('f4', '딸기'),                       // fridgeSection 미지정 → 제외 (이미 룰 매핑 안 됨)
  ];
  const plan = planSectionMigrations(items, 'kimchi_only');
  const ids = plan.map((m) => m.id).sort();
  assert.deepEqual(ids, ['f1', 'f2']);
  for (const m of plan) {
    // 새 칸은 반드시 김치냉장고가 가진 칸이어야 함
    assert.ok(modelHasSection('kimchi_only', m.to), `${m.id}: ${m.to} 미존재`);
  }
});

test('planSectionMigrations — 의류 등 비식품은 무시', () => {
  const closet: CartItem = {
    id:        'c1',
    name:      '히트텍',
    category:  '상의',
    size:      'L',
    thickness: '얇음',
    material:  '면',
  } as CartItem;
  const plan = planSectionMigrations([closet], 'kimchi_only');
  assert.equal(plan.length, 0);
});
