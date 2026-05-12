/**
 * 카탈로그 통계 API — 관리자 콘솔(admin-app)이 fetch해 자동 동기화.
 *
 * 보안:
 *   - X-Admin-Token 헤더로 인증 (ADMIN_API_TOKEN 환경변수와 일치)
 *   - rate limit (parser 한도 적용)
 *   - production에선 admin-app origin만 허용 (CORS)
 *
 * 응답:
 *   - admin-app/src/lib/data.ts CatalogStats 인터페이스와 동일 구조
 *   - 빌드 타임에 캐시 권장 (10분 revalidate)
 */
import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { RECIPES } from '@/lib/recipes';
import { SEASONAL_PRODUCE } from '@/lib/seasonalProduce';
import { PARTNERS } from '@/lib/partnerLinks';
import { FOOD_GROUP, FASHION_GROUP, type FoodCategory, type FashionCategory } from '@/types';

export const runtime = 'nodejs';
export const revalidate = 600; // 10분 캐시 — 카탈로그는 자주 변하지 않음

function buildStats() {
  const chefRecipes    = RECIPES.filter((r) => r.tags?.includes('셰프'));
  const varietyRecipes = RECIPES.filter((r) => r.tags?.includes('예능'));

  const byDifficulty = { 간단: 0, 보통: 0, 도전: 0 } as Record<'간단' | '보통' | '도전', number>;
  for (const r of RECIPES) byDifficulty[r.difficulty] += 1;

  const bySeason = { 봄: 0, 여름: 0, 가을: 0, 겨울: 0 } as Record<'봄' | '여름' | '가을' | '겨울', number>;
  for (const r of RECIPES) for (const s of r.seasons ?? []) bySeason[s] += 1;

  const chefCounts = new Map<string, number>();
  for (const r of RECIPES) if (r.chef) chefCounts.set(r.chef, (chefCounts.get(r.chef) ?? 0) + 1);

  const sourceCounts = new Map<string, number>();
  for (const r of RECIPES) if (r.source) sourceCounts.set(r.source, (sourceCounts.get(r.source) ?? 0) + 1);

  const seasonalBySeason = { 봄: 0, 여름: 0, 가을: 0, 겨울: 0 } as Record<'봄' | '여름' | '가을' | '겨울', number>;
  for (const p of SEASONAL_PRODUCE) for (const s of p.seasons) seasonalBySeason[s] += 1;

  const partnerArr   = Object.values(PARTNERS);
  const partnerKinds = new Map<string, number>();
  for (const p of partnerArr) partnerKinds.set(p.domain, (partnerKinds.get(p.domain) ?? 0) + 1);

  const foodGroupCounts: Record<string, number> = {};
  for (const cat of Object.keys(FOOD_GROUP) as FoodCategory[]) {
    const g = FOOD_GROUP[cat];
    foodGroupCounts[g] = (foodGroupCounts[g] ?? 0) + 1;
  }
  const fashionGroupCounts: Record<string, number> = {};
  for (const cat of Object.keys(FASHION_GROUP) as FashionCategory[]) {
    const g = FASHION_GROUP[cat];
    fashionGroupCounts[g] = (fashionGroupCounts[g] ?? 0) + 1;
  }

  return {
    catalogVersion: '1.5.0',
    syncedAt:       new Date().toISOString(),
    recipes: {
      total:        RECIPES.length,
      chefCount:    chefRecipes.length,
      varietyCount: varietyRecipes.length,
      byDifficulty,
      bySeason,
      byChef:    [...chefCounts.entries()].map(([chef, count]) => ({ chef, count })).sort((a, b) => b.count - a.count),
      bySource:  [...sourceCounts.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      untagged:  RECIPES.filter((r) => !r.seasons || r.seasons.length === 0).length,
    },
    seasonal: {
      total:    SEASONAL_PRODUCE.length,
      bySeason: seasonalBySeason,
      peakOnly: SEASONAL_PRODUCE.filter((p) => p.peak).length,
    },
    partners: {
      total:   partnerArr.length,
      enabled: partnerArr.filter((p) => p.enabled).length,
      pending: partnerArr.filter((p) => !p.enabled).length,
      byKind:  [...partnerKinds.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
    },
    categories: {
      food:    { total: Object.keys(FOOD_GROUP).length,    byGroup: foodGroupCounts },
      fashion: { total: Object.keys(FASHION_GROUP).length, byGroup: fashionGroupCounts },
    },
  };
}

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'parser');
  if (limited) return limited;

  // 토큰 검증 — 환경변수 미설정 시 제한 없이 응답 (개발 편의)
  const expected = process.env.ADMIN_API_TOKEN;
  if (expected) {
    const provided = req.headers.get('x-admin-token');
    if (provided !== expected) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const stats = buildStats();
  return NextResponse.json(stats, {
    headers: {
      // CDN 10분 캐시 + admin-app가 stale-while-revalidate
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
      // admin-app만 호출 가능 — production에서 좁힐 것
      'Access-Control-Allow-Origin': process.env.ADMIN_ORIGIN ?? '*',
      'Access-Control-Allow-Headers': 'X-Admin-Token, Content-Type',
    },
  });
}
