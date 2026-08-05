import { createBrowserClient } from '@supabase/ssr';
import type { CartItem } from '@/types';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// createBrowserClient(쿠키 기반 저장)를 써야 PKCE code_verifier를
// /auth/callback 서버 라우트(createServerClient)에서도 읽을 수 있다.
// 예전엔 supabase-js의 createClient(localStorage 기반)를 써서, 서버가
// 브라우저 localStorage에 접근 못 해 로그인 콜백이 항상 조용히 실패했다.
export const supabase = (supabaseUrl && supabaseKey)
  ? createBrowserClient(supabaseUrl, supabaseKey)
  : null;

// Supabase 활성 여부 — env가 없으면 로컬 전용 모드
export const isSupabaseEnabled = !!supabase;

// ── DB 행 ↔ CartItem 변환 ────────────────────────────────────────────

export interface ItemRow {
  id:         string;
  user_id:    string;
  item_type:  string;
  category:   string;
  name:       string;
  attributes: Record<string, unknown>;
  archived:   boolean;
  updated_at: string;
}

export function cartItemToRow(item: CartItem, userId: string, archived = false): Omit<ItemRow, 'user_id'> & { user_id: string } {
  const { id, category, name, ...rest } = item;
  const item_type = category === '식품' ? 'food' : 'clothing';
  return {
    id,
    user_id:    userId,
    item_type,
    category,
    name,
    attributes: rest as Record<string, unknown>,
    archived,
    updated_at: new Date().toISOString(),
  };
}

export function rowToCartItem(row: ItemRow): CartItem {
  const { id, category, name, attributes } = row;
  return { id, category, name, ...attributes } as unknown as CartItem;
}
