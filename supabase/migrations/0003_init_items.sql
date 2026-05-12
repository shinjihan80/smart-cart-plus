-- Phase 7.0 — items 테이블 (하이브리드 옷장/냉장고).
--
-- 의존: 0001 (item_domain enum, set_updated_at), 0002 (profiles)
--
-- 설계 원칙
--   - 옷장과 냉장고를 단일 테이블에서 관리 (domain으로 분기)
--   - 도메인별 다른 속성은 attributes JSONB에 저장 (스키마 진화에 유연)
--   - 자주 조회하는 키(expiry_date 등)는 expression index
--   - 일반 JSONB 필터는 GIN 인덱스로 커버

CREATE TABLE items (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain      item_domain NOT NULL,
  name        TEXT NOT NULL,
  image_url   TEXT,
  attributes  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE items IS
  '하이브리드 아이템 — wardrobe(옷장) / fridge(냉장고)를 domain으로 분기. attributes는 도메인별 스키마.';
COMMENT ON COLUMN items.attributes IS
  $$도메인별 속성 JSONB.
    wardrobe: { size, thickness, material, weather_tags, tags, color, category }
    fridge:   { expiry_date, storage, base_shelf_life_days, food_category, nutrition_facts }
    런타임 검증은 앱 측 TypeScript discriminated union + (Pro 단계) zod로 보강.$$;

-- updated_at 자동 갱신
CREATE TRIGGER items_set_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ───────────────────────────────────────────────────────────────────────────
-- 인덱스
-- ───────────────────────────────────────────────────────────────────────────

-- 사용자별 도메인 필터 — 가장 빈번 (홈/옷장/냉장고 진입 시)
CREATE INDEX items_user_domain_idx ON items (user_id, domain);

-- 냉장고 임박 정렬 — fridge 도메인의 expiry_date를 정렬·필터에 자주 사용
CREATE INDEX items_expiry_idx ON items ((attributes->>'expiry_date'))
  WHERE domain = 'fridge';

-- JSONB 일반 검색 (tag includes, weather_tags 등) — GIN 인덱스
CREATE INDEX items_attributes_gin ON items USING GIN (attributes);

-- 최신순 정렬 — 신규 등록 항목이 상단으로
CREATE INDEX items_user_created_idx ON items (user_id, created_at DESC);
