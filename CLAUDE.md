@AGENTS.md

# Harness 포인터

## 트리거 규칙

다음 요청이 들어오면 해당 스킬을 즉시 호출한다:

| 트리거 키워드 | 호출 스킬 |
|-------------|---------|
| 텍스트 파싱, 쇼핑 정보 추가, 영수증 분석, 구매 내역 입력 | `/parse-orchestrator` |
| 하네스 구성, 에이전트 추가, 스킬 추가 | `/harness` |

## 에이전트 팀 구성

| 에이전트 | 파일 | 역할 |
|---------|------|------|
| receipt-parser | `.claude/agents/receipt-parser.md` | 텍스트 → FoodItem/ClothingItem 추출 |
| schema-validator | `.claude/agents/schema-validator.md` | 스키마 검증 + 듀얼 리뷰 |

## 스킬 목록

| 스킬 | 경로 | 설명 |
|------|------|------|
| parse-orchestrator | `.claude/skills/parse-orchestrator/` | 파서 팀 파이프라인 조율 |
| food-knowledge | `.claude/skills/food-knowledge/` | 식품 보관 기간 도메인 지식 |
| clothing-knowledge | `.claude/skills/clothing-knowledge/` | 의류 소재·사이즈 도메인 지식 |

## 변경 이력

| 날짜 | 변경 내용 | 버전 |
|------|---------|------|
| 2026-04-16 | 파서 에이전트 팀 초기 구축 (receipt-parser, schema-validator, parse-orchestrator) | v0.1 |
| 2026-04-17 | 통합 Vision 파서, 벤토 대시보드, 컬러 시스템, App Router 라우팅 | v0.5 |
| 2026-04-17 | 전역 상태(CartContext), localStorage, 검색/필터/정렬, 되돌리기, PWA | v0.8 |
| 2026-04-17 | 레시피/코디 추천, 온보딩, 알림 설정, hydration 수정, 최종 정리 | v1.0 |
| 2026-04-20 | 카테고리 세분화(식품11/패션13), 이미지 시스템, 데이터 내보내기, 재구매 추천 | v1.1 |
| 2026-04-20 | NEMOA 브랜드 확정 — 로고·헤더·메타·화자 "네모아" 통일 (Phase 5.8) | v1.3 |
| 2026-04-20 | 관리자 대시보드 철회 — 모바일 앱 내부 `/admin` 제거, 별도 데스크탑 프로젝트로 분리 대기 | v1.3 |
| 2026-04-20 | Phase 5 날씨 완성 — Open-Meteo 실시간 · 매칭 뱃지 · 어울림순 · 홈 추천 칩 · parser/vision weatherTags 폴백 | v1.4 |
| 2026-04-20 | Phase 4 냉장고 완성 — 레시피 24종 · 상세 모달 · 타이머 · 즐겨찾기 · 영양 밸런스 · 오늘 뭐 먹지 · 쇼핑 루프 | v1.4 |
| 2026-04-20 | 개인화 로그 — 의류 착용(wearLog) + 레시피 조리(cookLog) + 마이페이지 분석 3 bucket TOP 3 × 2 | v1.4 |
| 2026-04-20 | 네모아의 오늘 한 마디 — 9종 멀티시그널 큐레이션 배너 (홈) | v1.4 |
| 2026-04-20 | 데이터 백업 자동화 — 7일 stale 배너 + JSON 다운로드/복원 + 스냅샷 v2 | v1.4 |
| 2026-04-20 | 4페이지 전체 리팩터링 — 3179→1091줄 · 25+ 재사용 컴포넌트 분리 (홈 11 · 냉장고 5 · 옷장 3 · 마이 7) | v1.4 |
