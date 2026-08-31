'use client';

import { useEffect, useState } from 'react';
import { RECIPES, type Recipe } from './recipes';
import { SEASONAL_PRODUCE, type SeasonalProduce } from './seasonalProduce';
import { PARTNERS, type Partner } from './partnerLinks';
import type { RecipeOverlay, SeasonalOverlay, PartnerOverlay } from './catalogTypes';

/**
 * 정적 카탈로그 + 관리자 오버레이 merge 훅.
 *
 * 부팅 시 한 번 fetch + 5분 SWR.
 * 오버레이 비활성(미설정) 또는 fetch 실패 시 정적 카탈로그 그대로 반환.
 *
 * Pro 단계: Upstash Redis 활성 + 관리자 콘솔에서 CRUD하면 즉시 반영.
 * 베이직 단계: 정적 카탈로그만 (모든 사용자에게 동일).
 */

const CACHE_TTL_MS   = 5 * 60 * 1000;  // 5분 — 성공 응답 재사용
const RETRY_AFTER_MS = 60 * 1000;      // 실패(네트워크·429) 후 최소 재시도 간격

interface CatalogResponse<T> {
  overlay:    T;
  persistent: boolean;
}

/**
 * 진행 중 요청 dedup + 네거티브 캐싱.
 * - 같은 path 요청이 여러 컴포넌트에서 동시에 나가도 fetch 는 1번 (2× 중복 호출 제거)
 * - 실패하면 실패 시각을 기록해 RETRY_AFTER_MS 동안 재시도 안 함
 *   (이전엔 실패를 캐시 안 해서 마운트마다 재폭주 → /api/admin/* 429 유발)
 */
const inflight = new Map<string, Promise<unknown>>();
const failedAt = new Map<string, number>();

async function fetchOverlayDeduped<T>(path: string): Promise<T | null> {
  const lastFail = failedAt.get(path);
  if (lastFail && Date.now() - lastFail < RETRY_AFTER_MS) return null;

  const existing = inflight.get(path);
  if (existing) return existing as Promise<T | null>;

  const p = (async (): Promise<T | null> => {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) { failedAt.set(path, Date.now()); return null; }
      failedAt.delete(path);
      const data = await res.json() as CatalogResponse<T>;
      return data.overlay ?? null;
    } catch {
      failedAt.set(path, Date.now());
      return null;
    } finally {
      inflight.delete(path);
    }
  })();

  inflight.set(path, p);
  return p;
}

let cachedRecipes:  { merged: Recipe[];          fetchedAt: number } | null = null;
let cachedSeasonal: { merged: SeasonalProduce[]; fetchedAt: number } | null = null;
let cachedPartners: { merged: Record<string, Partner>; fetchedAt: number } | null = null;

/** 정적 RECIPES + 오버레이 merge */
function mergeRecipes(overlay: RecipeOverlay): Recipe[] {
  const deletedSet = new Set(overlay.deleted);
  const result: Recipe[] = [];
  for (const r of RECIPES) {
    if (deletedSet.has(r.id)) continue;
    const patch = overlay.updated[r.id];
    result.push(patch ? { ...r, ...patch } : r);
  }
  for (const r of overlay.created) result.push(r);
  return result;
}

function mergeSeasonal(overlay: SeasonalOverlay): SeasonalProduce[] {
  const deletedSet = new Set(overlay.deleted);
  const result: SeasonalProduce[] = [];
  for (const p of SEASONAL_PRODUCE) {
    if (deletedSet.has(p.name)) continue;
    const patch = overlay.updated[p.name];
    result.push(patch ? { ...p, ...patch } : p);
  }
  for (const p of overlay.created) result.push(p);
  return result;
}

function mergePartners(overlay: PartnerOverlay): Record<string, Partner> {
  const result: Record<string, Partner> = { ...PARTNERS };
  for (const [id, patch] of Object.entries(overlay.overrides ?? {})) {
    const base = result[id];
    if (!base) continue;
    const { buildUrlTemplate, ...rest } = patch;
    const merged: Partner = { ...base, ...rest } as Partner;
    // buildUrlTemplate이 있으면 buildUrl 함수 자동 생성
    // 템플릿 형식: 'https://example.com/search?q={query}' (선택) 또는 'https://example.com/' (고정)
    if (typeof buildUrlTemplate === 'string' && buildUrlTemplate.length > 0) {
      merged.buildUrl = (query?: string) => {
        if (buildUrlTemplate.includes('{query}')) {
          return buildUrlTemplate.replace('{query}', encodeURIComponent(query ?? ''));
        }
        return buildUrlTemplate;
      };
    }
    result[id] = merged;
  }
  return result;
}

/**
 * 모든 카탈로그 오버레이 fetch + merge.
 * 컴포넌트 마운트 시 한 번 fetch, 5분 SWR.
 */
export function useMergedCatalog() {
  const [recipes,   setRecipes]   = useState<readonly Recipe[]>(() => cachedRecipes?.merged ?? RECIPES);
  const [seasonal,  setSeasonal]  = useState<readonly SeasonalProduce[]>(() => cachedSeasonal?.merged ?? SEASONAL_PRODUCE);
  const [partners,  setPartners]  = useState<Record<string, Partner>>(() => cachedPartners?.merged ?? PARTNERS);
  const [loaded,    setLoaded]    = useState(false);

  useEffect(() => {
    let cancelled = false;

    const isStale = (c: { fetchedAt: number } | null) =>
      !c || Date.now() - c.fetchedAt > CACHE_TTL_MS;

    async function refresh() {
      const stamp = Date.now();
      // recipes
      if (isStale(cachedRecipes)) {
        const overlay = await fetchOverlayDeduped<RecipeOverlay>('/api/admin/recipes');
        if (overlay) {
          const merged = mergeRecipes(overlay);
          cachedRecipes = { merged, fetchedAt: stamp };
          if (!cancelled) setRecipes(merged);
        }
      }
      // seasonal
      if (isStale(cachedSeasonal)) {
        const overlay = await fetchOverlayDeduped<SeasonalOverlay>('/api/admin/seasonal');
        if (overlay) {
          const merged = mergeSeasonal(overlay);
          cachedSeasonal = { merged, fetchedAt: stamp };
          if (!cancelled) setSeasonal(merged);
        }
      }
      // partners
      if (isStale(cachedPartners)) {
        const overlay = await fetchOverlayDeduped<PartnerOverlay>('/api/admin/partners');
        if (overlay) {
          const merged = mergePartners(overlay);
          cachedPartners = { merged, fetchedAt: stamp };
          if (!cancelled) setPartners(merged);
        }
      }
      if (!cancelled) setLoaded(true);
    }

    refresh();
    return () => { cancelled = true; };
  }, []);

  return { recipes, seasonal, partners, loaded };
}
