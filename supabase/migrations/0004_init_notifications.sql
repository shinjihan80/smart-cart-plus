-- Phase 7.0 — notifications 테이블 (5단계 알림 큐).
--
-- 의존: 0001 (notification_urgency·notification_domain enum), 0002 (profiles), 0003 (items)
--
-- Phase 6.5/6.6 명세를 DB 형태로 영속화:
--   step_level 1~5 (식품 dDay·날씨 단계)
--   urgency red/orange/green/system (UI 색상 매핑)
--   trigger_at — cron worker가 발송 시점 결정
--   sent_at NULL = 대기, NOT NULL = 발송 완료
--   item_id 옵셔널 — system 메시지는 item 미연결

CREATE TABLE notifications (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES items(id) ON DELETE CASCADE,        -- nullable: system 메시지는 NULL
  domain      notification_domain NOT NULL,                       -- 'expiry' | 'weather' | 'system'
  step_level  SMALLINT NOT NULL CHECK (step_level BETWEEN 1 AND 5),
  urgency     notification_urgency NOT NULL,
  title       TEXT NOT NULL,                                      -- '[네모아] ~~' 헤드라인
  message     TEXT NOT NULL,                                      -- 명사형 본문 (서술어 0)
  action_url  TEXT,                                               -- 클릭 시 이동 (예: /fridge?focus=...)
  trigger_at  TIMESTAMPTZ NOT NULL,                               -- 발송 예정 시각
  sent_at     TIMESTAMPTZ,                                        -- 실제 발송 시각 (NULL = 대기)
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS
  '5단계 알림 큐. cron worker가 trigger_at 도달 시 발송 → sent_at 갱신. 클라이언트가 is_read 갱신.';
COMMENT ON COLUMN notifications.step_level IS
  '1=critical 2=warn 3=info (Phase 6.5/6.6) / 4=주간 요약 / 5=월간 리포트 (Pro)';
COMMENT ON COLUMN notifications.message IS
  '명사형 종결 본문. 예: "수제 햄버거 패티, 오늘 만료." (서술어 0)';

-- ───────────────────────────────────────────────────────────────────────────
-- 인덱스
-- ───────────────────────────────────────────────────────────────────────────

-- cron worker가 발송 대기 큐 조회 — sent_at IS NULL + trigger_at 도달
CREATE INDEX notifications_pending_idx ON notifications (trigger_at)
  WHERE sent_at IS NULL;

-- 사용자별 미읽음 목록 (마이페이지 알림 인박스)
CREATE INDEX notifications_user_unread_idx ON notifications (user_id, created_at DESC)
  WHERE is_read = FALSE;

-- item이 삭제되면 알림도 cascade — item별 알림 모음 조회
CREATE INDEX notifications_item_idx ON notifications (item_id)
  WHERE item_id IS NOT NULL;

-- 중복 발송 차단 — 같은 (user, item, domain, step, 날짜)는 한 번만
-- expiry-{itemId}-{date}-s{stage} 패턴을 DB 제약으로 보강
CREATE UNIQUE INDEX notifications_dedup_idx ON notifications (
  user_id,
  item_id,
  domain,
  step_level,
  (trigger_at::date)
) WHERE item_id IS NOT NULL;
