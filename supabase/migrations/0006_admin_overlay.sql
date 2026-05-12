-- ────────────────────────────────────────────────────────────────────────────
-- 0006_admin_overlay.sql — 관리자 콘솔이 편집하는 카탈로그 오버라이드 테이블
-- ────────────────────────────────────────────────────────────────────────────
-- 모바일 앱은 정적 카탈로그(src/lib/recipes.ts 등)를 기본으로 쓰되,
-- 이 테이블에 행이 있으면 그것을 우선 적용(overlay)한다.
-- 관리자(nemoa-admin.vercel.app)가 CRUD를 담당.
-- ────────────────────────────────────────────────────────────────────────────

-- 파트너 오버라이드 — 제휴사 활성/링크 변경
CREATE TABLE IF NOT EXISTS partner_overrides (
  id                  text PRIMARY KEY,            -- partnerLinks.ts의 PARTNER id와 1:1
  enabled             boolean,                     -- null = 기본값 유지, true/false = 강제
  build_url_template  text,                        -- null이면 기본 템플릿 사용
  label               text,                        -- null이면 기본 라벨
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_partner_overrides_updated_at
  BEFORE UPDATE ON partner_overrides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 레시피 오버라이드 — 정적 카탈로그에 추가/수정/숨김
CREATE TABLE IF NOT EXISTS recipe_overlay (
  id           text PRIMARY KEY,                   -- 정적 id 충돌 시 덮어쓰기 / 신규는 자체 id
  data         jsonb NOT NULL,                     -- Recipe 형태 전체
  hidden       boolean NOT NULL DEFAULT false,     -- 기본 카탈로그에서 숨길 때
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recipe_overlay_hidden_idx ON recipe_overlay (hidden);
CREATE TRIGGER trg_recipe_overlay_updated_at
  BEFORE UPDATE ON recipe_overlay
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 제철 식품 오버라이드 — 같은 패턴
CREATE TABLE IF NOT EXISTS seasonal_overlay (
  name         text PRIMARY KEY,                   -- 제철 식품 이름이 자연 키
  data         jsonb NOT NULL,                     -- SeasonalProduce 형태
  hidden       boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seasonal_overlay_hidden_idx ON seasonal_overlay (hidden);
CREATE TRIGGER trg_seasonal_overlay_updated_at
  BEFORE UPDATE ON seasonal_overlay
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- RLS — 모두 읽기 가능, 쓰기는 service_role 만
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE partner_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_overlay    ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_overlay  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read partners"  ON partner_overrides FOR SELECT USING (true);
CREATE POLICY "public read recipes"   ON recipe_overlay    FOR SELECT USING (true);
CREATE POLICY "public read seasonal"  ON seasonal_overlay  FOR SELECT USING (true);

-- 쓰기 정책 없음 → anon/auth 사용자는 쓰기 불가
-- 관리자 콘솔은 service_role 키로 직접 호출 (RLS 우회)
