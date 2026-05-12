-- Phase 7.0 — Row Level Security 정책.
--
-- 모든 테이블에 RLS 활성화. 사용자는 본인 데이터만 접근.
-- Supabase JWT의 auth.uid()가 행의 user_id/id와 일치해야 통과.
--
-- 의존: 0002 (profiles), 0003 (items), 0004 (notifications)

-- ───────────────────────────────────────────────────────────────────────────
-- profiles — 본인 행만
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_owner_select"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT는 트리거(handle_new_auth_user)에서만 일어남 — RLS는 SECURITY DEFINER로 우회됨
-- DELETE는 auth.users CASCADE로 자동 — 별도 정책 불필요

-- ───────────────────────────────────────────────────────────────────────────
-- items — 본인 데이터 전권
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_owner_select"
  ON items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "items_owner_insert"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "items_owner_update"
  ON items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "items_owner_delete"
  ON items FOR DELETE
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- notifications — 본인 알림만 (읽음 처리·조회). 서버 worker는 SERVICE_ROLE로 RLS 우회.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner_select"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_owner_update"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT는 서버 worker만 (SERVICE_ROLE_KEY). 클라이언트는 직접 삽입 불가.
-- DELETE도 같은 이유로 서버 측에서만.

COMMENT ON POLICY "items_owner_select" ON items IS
  '사용자는 본인 items만 조회 — auth.uid() 매칭으로 다른 사용자 데이터 격리.';
