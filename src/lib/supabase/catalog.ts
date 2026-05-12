/**
 * 카탈로그 overlay fetcher — Supabase가 설정돼 있을 때만 호출.
 *
 * 정적 카탈로그(src/lib/recipes.ts, partnerLinks.ts, seasonalProduce.ts) 위에
 * 관리자 콘솔(nemoa-admin.vercel.app)이 편집한 overlay를 병합한다.
 *
 * Phase B-1: 환경변수 없으면 null 반환 → 호출자가 정적 카탈로그만 사용.
 * Phase B-2 후: 환경변수 있으면 5분 SWR 캐시 + overlay 반환.
 */

import { getSupabase } from './client';

export interface PartnerOverride {
  id:                 string;
  enabled?:           boolean | null;
  build_url_template?: string | null;
  label?:             string | null;
}

export interface RecipeOverlay {
  id:     string;
  data:   unknown; // Recipe 형태 — 호출자가 캐스팅
  hidden: boolean;
}

export interface SeasonalOverlay {
  name:   string;
  data:   unknown; // SeasonalProduce 형태
  hidden: boolean;
}

// ─────────────────────────────────────────────
// In-memory cache (5분 TTL) — 클라이언트 사이드
// ─────────────────────────────────────────────

const TTL_MS = 5 * 60 * 1000;
const cache: Record<string, { at: number; value: unknown }> = {};

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T | null> {
  const entry = cache[key];
  if (entry && Date.now() - entry.at < TTL_MS) {
    return entry.value as T;
  }
  try {
    const value = await fetcher();
    cache[key] = { at: Date.now(), value };
    return value;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Supabase fetch failed (${key}):`, err);
    }
    // 캐시 미스 시 호출자가 정적 카탈로그로 폴백
    return entry ? (entry.value as T) : null;
  }
}

// ─────────────────────────────────────────────
// 파트너 overlay
// ─────────────────────────────────────────────

export async function fetchPartnerOverrides(): Promise<Record<string, PartnerOverride> | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  return cachedFetch('partners', async () => {
    const { data, error } = await supabase
      .from('partner_overrides')
      .select('id, enabled, build_url_template, label');
    if (error) throw error;
    const map: Record<string, PartnerOverride> = {};
    for (const row of (data as PartnerOverride[]) ?? []) {
      map[row.id] = row;
    }
    return map;
  });
}

// ─────────────────────────────────────────────
// 레시피 overlay
// ─────────────────────────────────────────────

export async function fetchRecipeOverlay(): Promise<RecipeOverlay[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  return cachedFetch('recipes', async () => {
    const { data, error } = await supabase
      .from('recipe_overlay')
      .select('id, data, hidden');
    if (error) throw error;
    return (data as RecipeOverlay[]) ?? [];
  });
}

// ─────────────────────────────────────────────
// 제철 overlay
// ─────────────────────────────────────────────

export async function fetchSeasonalOverlay(): Promise<SeasonalOverlay[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  return cachedFetch('seasonal', async () => {
    const { data, error } = await supabase
      .from('seasonal_overlay')
      .select('name, data, hidden');
    if (error) throw error;
    return (data as SeasonalOverlay[]) ?? [];
  });
}

/** 테스트·디버그용 — 캐시 강제 비우기 */
export function invalidateCatalogCache() {
  for (const k of Object.keys(cache)) delete cache[k];
}
