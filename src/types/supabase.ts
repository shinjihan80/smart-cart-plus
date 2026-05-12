/**
 * Phase 7.0 — Supabase 데이터베이스 TypeScript 타입.
 *
 * 사용
 *   import type { Database, ItemRow, isWardrobeItem } from '@/types/supabase';
 *   const supabase = createClient<Database>(...);
 *
 * 자동 생성 vs 수동 정의
 *   - Supabase CLI의 `supabase gen types typescript`로 기본 Row 타입 자동 생성 가능
 *   - 본 파일은 수동 정의 + 도메인별 generic으로 attributes JSONB 타입 안전성 확보
 *   - Phase 7.1+에서 CLI 자동 생성과 병행 (자동 → Database, 수동 → AttributesFor)
 *
 * 베타 단계
 *   현재 NEMOA는 클라이언트 only (localStorage). Supabase 사용 안 함.
 *   본 타입은 Phase A(MAU 1,000) 진입 시 클라우드 동기화 도입 시 활용.
 */

// ─── 도메인 + ENUM ───────────────────────────────────────────────────────────

export type Domain = 'wardrobe' | 'fridge';

export type NotificationUrgency = 'red' | 'orange' | 'green' | 'system';
export type NotificationDomain  = 'expiry' | 'weather' | 'system';

// ─── 도메인별 attributes 스키마 ──────────────────────────────────────────────

/**
 * 옷장 아이템 attributes (items.attributes WHERE domain='wardrobe').
 *
 * 프론트의 ClothingItem 타입과 매핑:
 *   ClothingItem.size           → attributes.size
 *   ClothingItem.thickness      → attributes.thickness
 *   ClothingItem.material       → attributes.material
 *   ClothingItem.weatherTags    → attributes.weather_tags
 *   ClothingItem.category       → attributes.category
 */
export interface WardrobeAttributes {
  size?:         string;                     // 'L' | '32' | '270' | 'FREE'
  thickness?:    'thin' | 'normal' | 'thick';
  material?:     string;
  weather_tags?: ('봄' | '여름' | '가을' | '겨울')[];
  tags?:         string[];                   // ['✨오늘 딱'] 같은 자유 태그
  color?:        string;
  category?:     string;                     // '상의' | '하의' | '신발' 등
  /** Phase 6.6 코디 추천에서 매칭 점수 캐시 (선택) */
  match_hint?:   { season?: string; gap_days?: number };
}

/**
 * 냉장고 아이템 attributes (items.attributes WHERE domain='fridge').
 *
 * 프론트의 FoodItem 타입과 매핑:
 *   FoodItem.purchaseDate          → attributes.purchase_date
 *   FoodItem.baseShelfLifeDays     → attributes.base_shelf_life_days
 *   FoodItem.storageType           → attributes.storage
 *   FoodItem.foodCategory          → attributes.food_category
 *   FoodItem.nutritionFacts        → attributes.nutrition_facts
 *
 *   expiry_date는 purchase_date + base_shelf_life_days로 derived.
 *   서버는 GENERATED COLUMN으로 자동 계산 가능 (Phase 7.1+).
 */
export interface FridgeAttributes {
  purchase_date?:        string;             // ISO 'YYYY-MM-DD'
  expiry_date?:          string;             // ISO — derived 또는 명시
  storage?:              'refrigerated' | 'frozen' | 'pantry';
  base_shelf_life_days?: number;
  food_category?:        string;
  nutrition_facts?: {
    calories?: number;
    protein?:  number;
    fat?:      number;
    carbs?:    number;
  };
  opened_date?:          string;             // 개봉 날짜 (선택)
  memo?:                 string;
}

/**
 * Conditional type — domain에 따라 attributes 타입 자동 결정.
 *   AttributesFor<'wardrobe'> = WardrobeAttributes
 *   AttributesFor<'fridge'>   = FridgeAttributes
 *   AttributesFor<Domain>     = WardrobeAttributes | FridgeAttributes
 */
export type AttributesFor<D extends Domain> =
  D extends 'wardrobe' ? WardrobeAttributes
  : D extends 'fridge' ? FridgeAttributes
  : never;

// ─── Row 타입 (DB 스냅샷) ────────────────────────────────────────────────────

export interface ProfileRow {
  id:           string;
  display_name: string;
  family_role:  string | null;
  preferences:  Record<string, unknown>;     // JSONB — 자유 형태
  created_at:   string;
  updated_at:   string;
}

export interface ItemRow<D extends Domain = Domain> {
  id:         string;
  user_id:    string;
  domain:     D;
  name:       string;
  image_url:  string | null;
  attributes: AttributesFor<D>;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id:          string;
  user_id:     string;
  item_id:     string | null;
  domain:      NotificationDomain;
  step_level:  number;                       // 1~5 (DB CHECK 제약)
  urgency:     NotificationUrgency;
  title:       string;
  message:     string;
  action_url:  string | null;
  trigger_at:  string;                       // ISO timestamp
  sent_at:     string | null;
  is_read:     boolean;
  created_at:  string;
}

// ─── INSERT / UPDATE 타입 ────────────────────────────────────────────────────

export type ProfileInsert = Pick<ProfileRow, 'id' | 'display_name'> &
  Partial<Pick<ProfileRow, 'family_role' | 'preferences'>>;

export type ProfileUpdate = Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>;

export type ItemInsert<D extends Domain = Domain> =
  Pick<ItemRow<D>, 'user_id' | 'domain' | 'name'> &
  Partial<Pick<ItemRow<D>, 'id' | 'image_url' | 'attributes'>>;

export type ItemUpdate<D extends Domain = Domain> = Partial<
  Omit<ItemRow<D>, 'id' | 'user_id' | 'domain' | 'created_at' | 'updated_at'>
>;

export type NotificationInsert =
  Pick<NotificationRow, 'user_id' | 'domain' | 'step_level' | 'urgency' | 'title' | 'message' | 'trigger_at'> &
  Partial<Pick<NotificationRow, 'id' | 'item_id' | 'action_url' | 'sent_at' | 'is_read'>>;

export type NotificationUpdate = Partial<
  Pick<NotificationRow, 'sent_at' | 'is_read'>
>;

// ─── 타입 가드 — domain 좁히기로 attributes 자동 추론 ────────────────────────

export function isWardrobeItem(item: ItemRow): item is ItemRow<'wardrobe'> {
  return item.domain === 'wardrobe';
}

export function isFridgeItem(item: ItemRow): item is ItemRow<'fridge'> {
  return item.domain === 'fridge';
}

// ─── Supabase Database type — supabase-js와 호환 ─────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row:    ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      items: {
        Row:    ItemRow;
        Insert: ItemInsert;
        Update: ItemUpdate;
      };
      notifications: {
        Row:    NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
    };
    Enums: {
      item_domain:          Domain;
      notification_urgency: NotificationUrgency;
      notification_domain:  NotificationDomain;
    };
  };
}
