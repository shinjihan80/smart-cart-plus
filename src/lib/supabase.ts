import { createClient } from '@supabase/supabase-js';
import type { CartItem } from '@/types';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
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
