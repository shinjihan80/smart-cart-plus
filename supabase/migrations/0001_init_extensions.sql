-- Phase 7.0 — extensions + ENUM 타입 정의 (베이스 레이어).
--
-- 적용 순서: 0001 → 0002 → 0003 → 0004 → 0005
-- 모든 마이그레이션은 idempotent하지 않음 — Supabase migrations 시스템(또는 CLI)이
-- 한 번씩만 실행 보장. 수동 실행 시 IF NOT EXISTS 패턴으로 보강.

-- pgcrypto: gen_random_uuid() 제공 (UUID v4 생성)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ───────────────────────────────────────────────────────────────────────────
-- ENUM 타입 — items.domain
-- 'wardrobe' = 옷장 (의류·신발·액세서리)
-- 'fridge'   = 냉장고 (식품)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TYPE item_domain AS ENUM ('wardrobe', 'fridge');

-- ───────────────────────────────────────────────────────────────────────────
-- ENUM 타입 — notifications.urgency (5단계 알림 시스템 색상 매핑)
-- 'red'    = 1단계 critical (D-Day 만료, 기상 이변)
-- 'orange' = 2단계 warn (D-1, 내일 코디)
-- 'green'  = 3단계 info (D-3, 일반 안내)
-- 'system' = 시스템 메시지 (Pro 출시·업데이트 등)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TYPE notification_urgency AS ENUM ('red', 'orange', 'green', 'system');

-- ───────────────────────────────────────────────────────────────────────────
-- ENUM 타입 — notifications.domain (생성 도메인 추적)
-- 'expiry'  = 식품 유통기한 (Phase 6.5)
-- 'weather' = 날씨 기반 코디 (Phase 6.6)
-- 'system'  = 시스템 메시지
-- ───────────────────────────────────────────────────────────────────────────
CREATE TYPE notification_domain AS ENUM ('expiry', 'weather', 'system');

-- updated_at 자동 갱신 트리거 함수 (모든 테이블에서 재사용)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_updated_at() IS
  'updated_at 컬럼을 행 변경 시 자동 갱신 — 모든 테이블 BEFORE UPDATE 트리거에서 호출.';
