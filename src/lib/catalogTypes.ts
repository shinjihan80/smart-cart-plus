/**
 * 카탈로그 오버레이 변경분 타입.
 *
 * 정적 RECIPES·SEASONAL_PRODUCE·PARTNERS는 코드에 그대로 두고,
 * 관리자가 추가/수정/삭제한 변경분만 이 타입으로 저장된다.
 */

import type { Recipe } from './recipes';
import type { SeasonalProduce } from './seasonalProduce';
import type { Partner } from './partnerLinks';

export interface RecipeOverlay {
  /** 관리자가 추가한 신규 레시피 — id 자동 생성 (예: 'admin-2026-04-29-xxx') */
  created: Recipe[];
  /** 정적 레시피의 부분 덮어쓰기 — recipe.id → 부분 patch */
  updated: Record<string, Partial<Recipe>>;
  /** 정적 레시피의 비활성화 — id 배열 */
  deleted: string[];
}

export interface SeasonalOverlay {
  created: SeasonalProduce[];
  updated: Record<string, Partial<SeasonalProduce>>;
  deleted: string[]; // name 기준
}

export interface PartnerOverlay {
  /** 정적 PARTNERS의 부분 덮어쓰기 — partner.id → 부분 patch (enabled, buildUrl URL 등록 등) */
  overrides: Record<string, Partial<Omit<Partner, 'buildUrl'>> & { buildUrlTemplate?: string }>;
}

export const EMPTY_RECIPE_OVERLAY:   RecipeOverlay   = { created: [], updated: {}, deleted: [] };
export const EMPTY_SEASONAL_OVERLAY: SeasonalOverlay = { created: [], updated: {}, deleted: [] };
export const EMPTY_PARTNER_OVERLAY:  PartnerOverlay  = { overrides: {} };

/**
 * 관리자 admin-app이 NEMOA로 보내는 CRUD 요청 형태.
 * NEMOA admin API가 이걸 받아 catalogStore에 적용.
 */
export interface CatalogMutation {
  resource: 'recipes' | 'seasonal' | 'partners';
  action:   'create' | 'update' | 'delete' | 'override';
  /** create: 신규 객체 / update: id + patch / delete: id / override: id + patch */
  payload:  unknown;
}
