'use client';

import { useCallback } from 'react';
import { createSharedStore } from './sharedStore';

const STORAGE_KEY = 'nemoa-profiles';

export type Relation = '본인' | '배우자' | '자녀' | '부모' | '기타';

/** 식습관 선호 — 레시피 추천 필터 */
export type Dietary = 'none' | 'vegetarian' | 'vegan' | 'pescatarian';

/** 성별 — BMR 계산에 사용 */
export type Gender = 'female' | 'male' | 'other';

/** 활동량 — TDEE 계산용 */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

/** 활동량 계수 (Harris-Benedict 기준) */
export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary:  1.2,   // 거의 운동 안함
  light:      1.375, // 가벼운 운동 (주 1-3회)
  moderate:   1.55,  // 보통 운동 (주 3-5회)
  active:     1.725, // 활발한 운동 (주 6-7회)
  veryActive: 1.9,   // 매우 활발 (육체 노동 또는 매일 강도 높은 운동)
};

export interface BodyInfo {
  heightCm?:   number;          // 키
  weightKg?:   number;          // 몸무게
  age?:        number;          // 나이 — BMR 계산용
  gender?:     Gender;          // 성별 — BMR 공식 분기
  activity?:   ActivityLevel;   // 활동량 — TDEE = BMR × factor
  /** 일일 칼로리 목표 (kcal) — 수동 입력. 없으면 키·몸무게·나이·성별·활동량으로 자동 계산 */
  dailyCalorieTarget?: number;
  /** 알레르기 (자유 입력 태그) — 예: ['갑각류', '땅콩'] */
  allergies?:  string[];
  topSize?:    string;          // 상의 사이즈 (덮어쓰기 가능, 빈 값이면 권장값 사용)
  bottomSize?: string;          // 하의 사이즈
  shoeSize?:   number;          // 신발 사이즈 (mm)
}

/**
 * BMR(기초대사량) 계산 — Mifflin-St Jeor 공식.
 * 키/몸무게/나이/성별이 모두 있어야 계산 가능. 하나라도 없으면 null.
 */
export function calcBMR(body: BodyInfo): number | null {
  const { heightCm, weightKg, age, gender } = body;
  if (!heightCm || !weightKg || !age || !gender) return null;
  // female: BMR = 10W + 6.25H - 5A - 161
  // male:   BMR = 10W + 6.25H - 5A + 5
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male')  return Math.round(base + 5);
  if (gender === 'female') return Math.round(base - 161);
  // other — 두 공식 평균
  return Math.round(base - 78);
}

/**
 * TDEE(일일 총 소비 칼로리) = BMR × 활동 계수.
 * BMR 계산 불가하거나 activity 없으면 null.
 */
export function calcTDEE(body: BodyInfo): number | null {
  const bmr = calcBMR(body);
  if (bmr === null) return null;
  const factor = ACTIVITY_FACTOR[body.activity ?? 'sedentary'];
  return Math.round(bmr * factor);
}

/** 최종 일일 칼로리 목표 — 수동 입력 우선, 없으면 TDEE, 그것도 없으면 일반 평균 2000 */
export function resolveDailyCalorieTarget(body: BodyInfo): number {
  if (body.dailyCalorieTarget) return body.dailyCalorieTarget;
  const tdee = calcTDEE(body);
  return tdee ?? 2000;
}

export interface Profile {
  id:        string;
  name:      string;
  relation:  Relation;
  body:      BodyInfo;
  dietary?:  Dietary;  // 채식·비건 등 (기본: 'none')
  avatar?:   string;   // 사용자 정의 이모지 (없으면 relation 기본 이모지)
  isMain?:   boolean;  // 본인 표시 (최초 1명)
  createdAt: number;
}

// ─── 기본 프로필 시드 ────────────────────────────────────────────────────────
function createDefaultProfile(): Profile {
  return {
    id:        `p-${Date.now()}`,
    name:      '나',
    relation:  '본인',
    body:      {},
    isMain:    true,
    createdAt: Date.now(),
  };
}

const store = createSharedStore<Profile[]>({
  storageKey: STORAGE_KEY,
  initial:    [createDefaultProfile()],
  validate:   (raw) => {
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const cleaned = raw.filter((p): p is Profile =>
      !!p && typeof p === 'object'
      && typeof (p as Record<string, unknown>).id === 'string'
      && typeof (p as Record<string, unknown>).name === 'string',
    );
    return cleaned.length > 0 ? cleaned : null;
  },
});

// ─── 훅 ──────────────────────────────────────────────────────────────────────
export function useProfiles() {
  const profiles = store.useStore();
  const main = profiles.find((p) => p.isMain) ?? profiles[0];

  const add = useCallback((name: string, relation: Relation) => {
    const p: Profile = {
      id:        `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name:      name.trim(),
      relation,
      body:      {},
      createdAt: Date.now(),
    };
    store.setState((prev) => [...prev, p]);
    return p;
  }, []);

  const remove = useCallback((id: string) => {
    store.setState((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target || target.isMain) return prev; // 본인 프로필은 삭제 불가
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<Profile, 'id'>>) => {
    store.setState((prev) => prev.map((p) =>
      p.id === id ? { ...p, ...patch, body: { ...p.body, ...patch.body } } : p,
    ));
  }, []);

  return { profiles, main, add, remove, update };
}
