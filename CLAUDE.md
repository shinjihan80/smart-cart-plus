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
| 2026-04-22 | 베이직 출시 준비 — /legal 약관·ConsentGate 동의·DEPLOY.md·빈 시드(mockCartItems→[])·설정 "샘플 데이터 추가" | v1.5 |
| 2026-04-22 | AI 일일 한도 시스템 — aiQuota.ts(vision10/parser20/nutrition5/url5) + 설정 Quota 카드 + 모달 enforcement | v1.5 |
| 2026-04-22 | Service Worker 오프라인 — public/sw.js(network-first HTML·SWR 자산·/api/* 우회) + /offline.html + next.config 헤더 | v1.5 |
| 2026-04-22 | 로컬 에러 로깅 — errorLog.ts 50건 localStorage · window.onerror + React 바운더리 · 설정 > 오류 기록 카드 | v1.5 |
| 2026-04-22 | 단위 테스트 36개 (Node 25 네이티브 .mts + node:test) — season·purchaseCycle·seasonalProduce·aiQuota · npm test | v1.5 |
| 2026-04-22 | 문서 정비 — CHANGELOG·BASIC_SPEC·PRO_SPEC 분리 + MONETIZATION.md 전환 타이밍 중심 슬림화 | v1.5 |
| 2026-05-07 | Phase 8.0 냉장고 시각화 — FridgeModelPicker(양문형/4도어/1도어/김치) + FridgeView SVG 칸 + 룰 기반 recommendFridgeSection + 마이페이지 위계 재배치 | v1.6 |
| 2026-05-07 | Phase 6.x UI 시스템 — Family.co 매트 클레이 카드 + MoaiOrb 4 persona + InquirySheet 바텀시트 + 5단계 알림 + 날씨 알림 + ScanningOrb yoyo glow | v1.6 |
| 2026-05-12 | 관리자↔모바일 연결 — KV 기반 admin API 5종(recipes/seasonal/partners/views/catalog) + useMergedCatalog 5분 SWR 훅 + Pro 단계 자동 반영 인프라 | v1.7 |
| 2026-05-12 | 냉장고·옷장 3탭 일관화 — 🧊냉장고/💡추천/🛒장보기 · 👔옷장/👗코디/🛍️쇼핑 + 마이페이지 4탭 URL 라우팅 + Phase 8.0 Step 5 AI 보관 위치 | v1.7 |
| 2026-05-12 | 카드 UX 통일 — drag-to-delete 제거 → 펼침 하단 🗑️ + 아코디언(한 번에 하나) + 명시적 '상세 보기' 버튼 + 카드 편집 모드 보관 위치 select | v1.7 |
| 2026-05-12 | Supabase Phase B-1 — 마이그레이션 5종(profiles/items/notifications/RLS) + 하이브리드 JSONB attributes + Database 타입 + Generic AttributesFor | v1.7 |
| 2026-05-15 | 코디 UI 재설계 — outfitMatcher 자동 코디 생성 + OutfitCard 2x2 이미지 콜라주 + OutfitDetailModal 바텀시트 + 가로 스와이프 캐러셀(1.3장 노출, snap-mandatory) | v1.8 |
| 2026-05-15 | 🔴 페이지 스크롤 영구 잠금 버그 픽스 — OutfitDetailModal 의 useModalA11y(onClose) 에 active 인자 누락으로 body.overflow=hidden 영구 적용 → useModalA11y(onClose, !!outfit) 로 수정 + JSDoc 에 ✅/❌ 패턴 명시 (회귀 방지) | v1.8 |
| 2026-05-15 | Phase 7 파트너 18개 enabled — 중고 3(당근·번개장터·KREAM) · 기부 3(아름다운가게·굿윌·옷캔) · 보관 2(세탁특공대·다락) + ClosetCleanupSection 아이템별 처분 메뉴 (옷 이름 자동 검색) | v1.8 |
| 2026-05-15 | ProPreviewCard — Pro 출시 예고(₩4,900/월) + 베이직 vs Pro 비교표 + 알림 의향 수집(`nemoa-pro-interest`) | v1.9 |
| 2026-05-15 | 파트너 클릭 추적 + 익명 텔레메트리 — `partnerClickLog.ts` localStorage 200건/30일 + opt-in 일별 집계 `/api/admin/telemetry/clicks` POST/GET + 설정 PartnerClickInsights 카드 | v1.9 |
| 2026-05-15 | 홈 알림 배너 3종 — UrgentAlert(D-Day≤1) · RebuyAlert(구매 주기 dueInDays≤2) · SeasonChangeAlert(시즌 진입 21일 + 옷장 정리 필요) | v1.9 |
| 2026-05-15 | AnnualSummary 월별 히스토그램 — 조리/착용/소진 12 칸 스택 막대 + 연말 페이스 프로젝션 + 최다 활동 달 강조 | v1.9 |
| 2026-05-15 | 추천 알고리즘 로테이션 — outfit: 3일 이내 착용 −1.5 / matchRecipes: daysSinceCook 4일 −1.5, 10일+ +0.5 | v1.9 |
| 2026-05-15 | savedOutfits 기반 co-worn 추천 — 사용자 저장 코디 페어 +1.5 / +0.75 보너스 + 라벨 자동 `💞 자주 입는 조합` | v1.9 |
| 2026-05-15 | 추천 reasons 배지 (옷장 + 레시피 통일) — Outfit/MatchedRecipe 에 reasons[] 추가 + OutfitCard/Modal/TodayDishCard/RecipeSection UI 배지 | v1.9 |
| 2026-05-15 | Admin API 강화 — GET /api/admin/partners 에 currentUrl·supportsSearch·summary 추가 + CatalogResource 'telemetry' 확장 | v1.9 |
