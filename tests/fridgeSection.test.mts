import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FRIDGE_SECTION_META,
  groupBySection,
  isSectionCompatible,
  recommendFridgeSection,
} from '../src/lib/fridgeSection.ts';
import type { FoodItem } from '../src/types/index.ts';

const baseFood = (overrides: Partial<FoodItem>): FoodItem => ({
  id: 't1',
  name: '테스트',
  category: '식품',
  foodCategory: '기타 식품',
  storageType: '냉장',
  baseShelfLifeDays: 7,
  purchaseDate: '2026-05-07',
  ...overrides,
});

test('storageType 냉동 + 정육 → freezer_bottom', () => {
  assert.equal(
    recommendFridgeSection({ name: '돼지고기', foodCategory: '정육·계란', storageType: '냉동' }),
    'freezer_bottom',
  );
});

test('storageType 냉동 + 일반 → freezer_top', () => {
  assert.equal(
    recommendFridgeSection({ name: '아이스크림', foodCategory: '간식·과자', storageType: '냉동' }),
    'freezer_top',
  );
});

test('storageType 실온 → pantry', () => {
  assert.equal(
    recommendFridgeSection({ name: '라면', foodCategory: '면·즉석', storageType: '실온' }),
    'pantry',
  );
});

test('키워드 김치 → kimchi_bottom (카테고리보다 우선)', () => {
  assert.equal(
    recommendFridgeSection({ name: '배추김치', foodCategory: '채소·과일', storageType: '냉장' }),
    'kimchi_bottom',
  );
});

test('키워드 버터 → butter', () => {
  assert.equal(
    recommendFridgeSection({ name: '무염 버터', foodCategory: '유제품', storageType: '냉장' }),
    'butter',
  );
});

test('키워드 우유 → main_middle', () => {
  assert.equal(
    recommendFridgeSection({ name: '서울우유', foodCategory: '유제품', storageType: '냉장' }),
    'main_middle',
  );
});

test('키워드 간장 → door_bottom', () => {
  assert.equal(
    recommendFridgeSection({ name: '진간장', foodCategory: '양념·소스', storageType: '냉장' }),
    'door_bottom',
  );
});

test('키워드 음료 → door_middle', () => {
  assert.equal(
    recommendFridgeSection({ name: '오렌지주스', foodCategory: '음료', storageType: '냉장' }),
    'door_middle',
  );
});

test('카테고리 채소·과일 → crisper', () => {
  assert.equal(
    recommendFridgeSection({ name: '양상추', foodCategory: '채소·과일', storageType: '냉장' }),
    'crisper',
  );
});

test('카테고리 정육·계란 (냉장) → main_bottom', () => {
  assert.equal(
    recommendFridgeSection({ name: '닭가슴살', foodCategory: '정육·계란', storageType: '냉장' }),
    'main_bottom',
  );
});

test('groupBySection — fridgeSection이 있으면 그대로 사용', () => {
  const items = [
    baseFood({ id: '1', name: '미정의 항목', fridgeSection: 'butter' }),
    baseFood({ id: '2', name: '양상추', foodCategory: '채소·과일' }),
  ];
  const grouped = groupBySection(items);
  assert.equal(grouped.get('butter')?.length, 1);
  assert.equal(grouped.get('crisper')?.length, 1);
});

test('isSectionCompatible — 냉동 식품을 냉장칸에 두면 false', () => {
  assert.equal(isSectionCompatible('main_middle', '냉동'), false);
  assert.equal(isSectionCompatible('freezer_top', '냉동'), true);
});

test('isSectionCompatible — 실온 식품을 도어 포켓에 두면 false', () => {
  assert.equal(isSectionCompatible('door_top', '실온'), false);
  assert.equal(isSectionCompatible('pantry', '실온'), true);
});

test('FRIDGE_SECTION_META — 모든 섹션이 메타를 가진다', () => {
  const sections = [
    'main_top', 'main_middle', 'main_bottom',
    'door_top', 'door_middle', 'door_bottom',
    'crisper', 'butter',
    'freezer_top', 'freezer_bottom',
    'kimchi_top', 'kimchi_bottom',
    'pantry',
  ] as const;
  for (const s of sections) {
    assert.ok(FRIDGE_SECTION_META[s]);
    assert.ok(FRIDGE_SECTION_META[s].label);
    assert.ok(FRIDGE_SECTION_META[s].emoji);
  }
});
