import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FRIDGE_MODELS,
  FRIDGE_MODEL_LIST,
  isFridgeModelId,
  modelHasSection,
  resolveSectionForModel,
} from '../src/lib/fridgeModel.ts';

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
