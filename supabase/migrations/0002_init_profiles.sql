-- Phase 7.0 — profiles 테이블 (사용자 프로필).
--
-- 의존: 0001_init_extensions.sql (set_updated_at 함수)
-- 의존: Supabase auth schema (auth.users 테이블 — Supabase가 자체 관리)

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  family_role   TEXT,                                -- '워킹대디' / '1인가구' / '워킹맘' / '학생' 등 자유
  preferences   JSONB NOT NULL DEFAULT '{}'::jsonb,  -- 에이전트 톤·알림 단계 toggle·테마 등
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS
  '사용자 프로필 — auth.users의 1:1 확장. id는 auth.users.id 그대로.';
COMMENT ON COLUMN profiles.preferences IS
  'JSONB — 에이전트 커스텀(톤·persona), 알림 단계별 toggle(stage_1~5), UI 테마 등 유연 저장.';

-- updated_at 자동 갱신
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ───────────────────────────────────────────────────────────────────────────
-- auth.users → profiles 자동 동기화 트리거
--   - 신규 사용자 가입 시 profiles 행 자동 생성 (display_name 기본값 = email local part)
--   - 사용자가 프로필 명시 설정 안 해도 RLS 통과 가능
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

COMMENT ON FUNCTION handle_new_auth_user() IS
  'auth.users INSERT 시 profiles 행 자동 생성. SECURITY DEFINER로 권한 문제 회피.';
