/**
 * Supabase 클라이언트 — 환경변수 미설정 시 null 반환.
 *
 * Phase B-1 (인프라 준비): 환경변수가 없으면 fallback으로 정적 데이터 사용.
 * Phase B-2 (사용자 가입): NEXT_PUBLIC_SUPABASE_URL/ANON_KEY 등록되면 자동 활성.
 *
 * 사용처:
 *   const supabase = getSupabase();
 *   if (!supabase) return staticData;  // localStorage·정적 fallback
 *   const { data } = await supabase.from('...').select('*');
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    cached = null;
    return null;
  }

  try {
    cached = createClient(url, key, {
      auth: { persistSession: false }, // 베이직 단계 — 사용자 인증 없이 공개 데이터만
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase client init failed:', err);
    }
    cached = null;
  }

  return cached;
}

/** 환경변수 등록 여부 — UI에서 "Supabase 연결됨" 같은 표시용 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
