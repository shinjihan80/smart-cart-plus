# CHANGELOG

NEMOA 버전별 변경 이력. 최신 → 과거 역순.

관련 문서: [BASIC_SPEC.md](./BASIC_SPEC.md) · [PRO_SPEC.md](./PRO_SPEC.md) · [MONETIZATION.md](./MONETIZATION.md)

---

## v2.0 — 2026-05-27 · 운영 인프라 + 사용자 문서 정비

**테마: 비개발자 운영 환경 완성 + 사용자 도움말·메뉴얼 전면 개편 + 관리자 자동 동기화**

### Added — /manual 웹 가이드 페이지 (신규)
- `src/app/manual/page.tsx` — 10섹션 데스크탑 가이드 사이트
  - 좌측 고정 사이드바 목차 (IntersectionObserver scroll-aware 하이라이트)
  - 사이드바 버튼 클릭 시 fixed 스크롤 컨테이너 기준 부드러운 이동
  - 섹션: 앱 소개 · 시작하기 · 홈 화면 · 냉장고 · 옷장 · AI 자동 등록 · 알림 · 마이페이지 · 설정 · **요금제** · FAQ
- `src/app/manual/layout.tsx` — `fixed inset-0 z-50` 오버레이로 앱 모바일 쉘(하단 탭바·max-w-md) 우회
- `public/help/screen-*.jpg` — Playwright로 캡처한 실제 앱 스크린샷 5종 (홈·냉장고·옷장·마이·설정)
- `PhoneFrame` 컴포넌트: 200×400px 폰 목업 + 각 섹션 우측 배치

### Updated — /help 모바일 도움말 전면 업데이트
- v1.4~v1.9 모든 기능 반영
  - 냉장고 3탭 구조 (🧊/💡/🛒), AI 보관 위치 추천, FridgeModelPicker
  - 옷장 3탭 (👔/👗/🛍️), ClosetCleanupSection 파트너 처분 메뉴
  - 마이페이지 AnnualSummary 연간 히스토그램, 사용자 교체
  - 알림 5종 (D-Day·D-1·D-3·날씨·홈 배너 3종)
- **요금제 섹션 추가**: 베이직(무료) / Pro Lite(₩4,900/월) / Pro Max(₩9,900/월) 3단 카드 + 기능 요약
- **FAQ 9개**: "Pro로 업그레이드하면 뭐가 달라지나요?" 항목 신규 추가

### Added — /api/admin/config 런타임 노출
- `src/app/api/admin/config/route.ts` — TIER_LIMITS·RATE_LIMITS를 JSON으로 노출
  - `Infinity` → `null` 직렬화 (JSON 호환)
  - X-Admin-Token 인증, Cache-Control 1h, CORS 허용
- `src/lib/aiQuotaConstants.ts` — TIER_LIMITS·RATE_LIMITS를 `'use client'` 없이 분리
  - 서버(API 라우트)·클라이언트(aiQuota.ts) 양쪽 임포트 가능

### Updated — nemoa-admin 비개발자 리팩터
- 7개 페이지(settings · storage · categories · users · usage · quota · partners)
  - env var 이름, npm 명령어, 파일 경로, 코드 블록 → 제거
  - 상태 카드(켜짐/꺼짐), 한국어 안내, 넘버드 로드맵으로 교체
- `quota/page.tsx` → async 서버 컴포넌트 + 10분 ISR
  - nemoa `/api/admin/config` 실시간 페칭 → 한도 변경 시 자동 반영
  - API 미응답 시 경고 배너 + 폴백 표시

### Fixed — 문서 수치 오류
- `CLAUDE.md` v1.5 항목: AI 한도 `vision10/parser20` → `vision5/parser10/nutrition2/url2/fridgeSection5`
- `MONETIZATION.md` 현 상태: 동일 수치 수정 + v2.0으로 갱신

### Chore
- `package.json` version: `1.0.0` → `2.0.0`
- `nemoa-admin/CLAUDE.md` 신설: 프로젝트 개요·페이지 구성·API 구조·변경이력

---

## v1.9 — 2026-05-15 · AI 추천 강화 + Pro 결제 예고 + 익명 텔레메트리

**테마: 사용자 행동 데이터 기반 추천 알고리즘 강화 + Pro 출시 준비 + 익명 집계 인프라**

### Added — 추천 알고리즘 로테이션 신호
- **`outfitMatcher.ts`**: 3일 이내 착용 옷 −1.5 페널티 (연속 노출 회피)
- **`matchRecipes` (recipes.ts)**:
  - 신규 `MatchOptions.daysSinceCook` 옵션
  - 4일 이내 다시 조리 −1.5 (같은 음식 회피)
  - 10일+ 미조리 +0.5 (오랜만에 해볼 만함)
- `useCookLog` 에 `daysSinceCook` 맵 노출 → 3곳(TodayDishCard·RecipeSection·FeelingLuckySection) 자동 적용

### Added — savedOutfits 기반 co-worn 추천
- `MatchOptions.coWornPairs: Map<id, Set<id>>` 신규
- 사용자 저장 코디에서 함께 등장한 페어 자동 추출
- top × bottom 페어 +1.5 / top × shoes, bottom × shoes 각 +0.75
- 라벨 자동 변경: `💞 자주 입는 조합`

### Added — 추천 reasons 배지 (옷장 + 레시피 통일)
- **Outfit 인터페이스**: 신규 `reasons: string[]` 필드
  - 수집: 시즌 매칭 / co-worn / 오랜만에 / 추울 때
  - OutfitCard 우상단(최대 2개 반투명 배지) + OutfitDetailModal 헤더 아래(전체)
- **MatchedRecipe 인터페이스**: 신규 `reasons: string[]` 필드
  - 수집: ⏰ 임박 / 시즌 제철 / ❤️ 자주 / 🌙 오랜만에 / 🥬 균형
  - TodayDishCard 임박/시즌/단골 배지에 🌙 Moon 추가
  - RecipeSection 카드 우상단 아이콘 줄에 🌙 추가

### Added — Pro 미리보기 카드 (`ProPreviewCard`)
- 설정 페이지에 NEMOA Pro 출시 예고 카드
- 핵심 4가지 배지: AI 무제한 · 자동 동기화 · 파트너 할인 · 레시피 142+
- 펼침 시 베이직 vs Pro 8개 항목 비교표
- "출시 알림 받기" → `localStorage.nemoa-pro-interest` 의향 저장
- 가격: 월 ₩4,900 / 연 ₩49,000 (PRO_SPEC.md 일치)
- Phase A 결제 인프라 도입 시 의향 데이터 활용 가능

### Added — 파트너 클릭 추적 + 익명 텔레메트리
- **`partnerClickLog.ts`** — localStorage 기반 클릭 로그
  - `logPartnerClick(entry)` — PartnerChip/ShoppingMallCard 클릭 시 자동 호출
  - 최대 200건, 30일 자동 정리
  - `usePartnerClicks()` — total · topPartners · byDomain · clearAll
- **`PartnerClickInsights.tsx`** (설정) — 사용자 본인의 클릭 패턴 시각화
  - 도메인별 가로 막대 + 자주 가는 곳 TOP 5
- **`/api/admin/telemetry/clicks`** (신규 API)
  - **POST**: opt-in 사용자의 일별 집계 push (rate limited, 인증 없음, 비정상 차단)
  - **GET**: 관리자 콘솔에서 N일치 누적 fetch (X-Admin-Token 필수)
  - KV 키: `telemetry:partner-clicks:YYYY-MM-DD` (사용자 식별자 없음)
- **`flushPartnerClicksIfDue()`** — 홈 마운트 시 1회/일 호출, opt-in 사용자만 어제 데이터 전송

### Added — 홈 알림 배너 (자동 트리거) + dismiss 관리
- **`SeasonChangeAlert.tsx`** — 시즌 진입 후 21일 이내 옷장 정리 알림
  - 보관할 옷 + 꺼낼 옷 합산 → `/mypage?tab=closet#seasonal`
- **`RebuyAlert.tsx`** — 재구매 시점 자동 감지 (구매 주기 기반)
  - `estimateCycles` `dueInDays ≤ 2` + 비보유 식품 → `/mypage?tab=shopping`
- 홈 '지금 바로' 순서: 임박 식품 → 재구매 → 시즌 옷장 정리 → 제철 힌트
- **`useDismissedAlerts.ts`** (신규) — 일일 dismiss + 자동 GC
  - 3개 배너 모두 우상단 ✕ 버튼 → 그날만 안 보이기
  - 시즌 알림은 `season-{봄/여름/가을/겨울}` 키로 시즌별 분리
  - 한 주 이상 지난 항목 자동 정리
- **`NotificationSettings`** 강화 — "🙈 오늘 안 보기" 섹션 추가
  - dismiss한 알림 칩으로 표시 → 단건 / 전체 복원 가능

### Changed — WeeklyInsight 시각화 강화
- 기존: 텍스트 메시지 1~5줄
- 추가: **7일 미니 차트** (cook + wear 스택 막대 × 일자별 라벨)
  - 오늘 라벨 brand-primary 굵게 강조
  - 범례: 조리 amber / 착용 brand-primary
- 텍스트는 가장 임팩트 있는 1~2개만 노출 (압축)

### Changed — AnnualSummary 월별 히스토그램
- 기존: 조리/착용/소진 누적 숫자 3개
- 추가: **월별 12 칸 스택 히스토그램** + 연말 페이스 프로젝션
- 최다 활동 달 인사이트 + 현재 달/최다 달 강조

### Changed — Admin API 강화
- `GET /api/admin/partners` 응답에 추가:
  - `currentUrl`: 각 파트너의 현재 활성 URL (검증용)
  - `supportsSearch`: 검색 쿼리 지원 여부
  - `summary`: { total, enabled, searchable, overridden } 한눈에 보기
- `CatalogResource` 타입 확장: `'telemetry'` 추가 + 동적 operation 키 허용

### Changed — Outdated 파트너 UI 정리
- `PartnerChip.tsx` JSDoc: "전부 비활성" → "18개 enabled 상태"
- `KnowledgeSummary.tsx`: "준비 중" → "Phase 7 활성화 완료"
- `PartnerRoadmapSection.tsx`: "곧 연결될" → "{N}개 연결됨" + 정적 span → 클릭 가능한 PartnerChip

### 정량
- 신규 파일: 6 (`ProPreviewCard.tsx`·`partnerClickLog.ts`·`PartnerClickInsights.tsx`·`telemetry/clicks/route.ts`·`SeasonChangeAlert.tsx`·`RebuyAlert.tsx`)
- 신규 의향 키: `nemoa-pro-interest`
- 자동 트리거 알림: 3종 (Urgent·Rebuy·SeasonChange)
- 추천 신호 통합: 시즌·날씨·로테이션·co-worn·임박·자주·균형 (7종)

---

## v1.8 — 2026-05-15 · 코디 UI 재설계 + 모달 a11y 버그 픽스 + Phase 7 파트너

**테마: 옷장 코디 탭 이미지 콜라주 UI 도입 + 가로 스와이프 캐러셀 + 페이지 스크롤 락 버그 해결 + Phase 7 제휴 파트너 18개 출범**

### Added — 코디 UI 재설계
- **`outfitMatcher.ts`** — 자동 코디 생성기 (시즌·두께·로테이션 점수)
  - `generateOutfits(items, idleByItem, opts)` — 상의/하의/원피스 조합 + 신발 + 액세서리
  - `outfitItemIds()` / `outfitItemList()` 헬퍼
- **`OutfitCard.tsx`** — 2x2 이미지 콜라주 카드 (텍스트 최소, 라벨만 오버레이)
  - 정사각형 카드, 사진 없는 슬롯은 카테고리 톤 + 이모지로 대체
  - 일반 `<button>` + CSS `active:scale-[0.97]` (gesture 캡쳐 회피)
- **`OutfitDetailModal.tsx`** — 바텀 시트 상세 모달
  - 각 아이템 사진/카테고리/사이즈 표시 + 오늘 착용 ✓ 뱃지
  - "코디 저장" + "✓ 오늘 입었어요" (`markWorn` 일괄 호출)
- **`OutfitGrid.tsx`** — **가로 스와이프 캐러셀 (1.3장 노출)**
  - native `overflow-x-auto` + `snap-x snap-mandatory`
  - `-mx-5 px-5` 풀 블리드, `scrollPaddingLeft: 1.25rem`
  - 카드 폭 `calc((100% - 0.625rem) / 1.3)` — 다음 카드 30% 미리 보임

### Fixed — 🔴 페이지 스크롤 영구 잠금 버그
- **`OutfitDetailModal` 의 `useModalA11y` 호출에서 `active` 인자 누락**
  - `useModalA11y(outfit ? onClose : () => {})` → `active` 기본값 `true` 활성화
  - 모달이 닫혀있어도 `document.body.style.overflow = 'hidden'` 영구 적용
  - **코디 탭 진입 후 페이지 세로 스크롤 완전히 막힘**
  - 수정: `useModalA11y(onClose, !!outfit)` — 모달 열렸을 때만 잠금

### Changed — 코디 탭 구조 정리
- "오늘 입을 코디" **최상단 이동** (이전: 하단)
- "지금 입기 좋은 옷" 칩 리스트 **제거** (코디 카드에 시즌 매칭 이미 반영)
- 코디 탭 순서: 코디 그리드 → 안 입어본 옷 → 자주 입는 옷 TOP 3 → 저장된 코디 → 코디 만들기

### Docs
- **`useModalA11y` JSDoc 강화** — ✅/❌ 사용 패턴 명시 (조건부 vs 항상 마운트)
- 회귀 방지: 향후 모달 추가 시 동일 실수 방지

### 감사 결과 (회귀 위험 점검)
- `useModalA11y` 5개 사용처 점검:
  - OutfitDetailModal: **수정 완료**
  - CommandPalette: `active=open` 명시 — 안전
  - RecipeDetailModal / RecipeBrowserModal / OnboardingContent: 모두 조건부 마운트 — 안전
- `document.body.style` 조작은 `useModalA11y` 하나뿐 — 다른 영구 잠금 위험 없음

### SW
- v1.5.0 → **v1.5.6** (디버깅 중 6회 bump, 캐시 강제 무효화)

### Added — Phase 7 파트너 확장 (이번 세션 후반)
- **중고 판매 3개사**: 당근마켓 · 번개장터 · KREAM (모두 검색 URL 지원)
- **기부 단체 3개**: 아름다운가게 · 굿윌스토어 · 옷캔
- **짐 보관 2개사**: 세탁특공대 박스 보관 · 다락
- 총 **18개 파트너 enabled + 실제 URL** (이전 disabled stub 제거)
- 중복된 `storage_box` / `storage_svc` stub 제거 → 실제 파트너로 대체

### Added — 아이템별 처분 옵션 메뉴 (`ClosetCleanupSection`)
- 정리 후보 옷마다 🔗 토글 — 펼치면 카테고리별 파트너 칩
- 💰 팔기: 당근·번개장터·KREAM — **옷 이름으로 자동 검색** (PartnerChip `query` 활용)
- ❤️ 기부: 아름다운가게·굿윌·옷캔
- 📦 보관: 세탁특공대·다락
- `SeasonalStorageSection`: "준비 중" disabled 버튼 → 세탁특공대 실연결

### 정량 (v1.8 단독)
- 신규 파일: 4 (`outfitMatcher.ts`·`OutfitCard.tsx`·`OutfitDetailModal.tsx`·`OutfitGrid.tsx`)
- 신규 자동 코디 알고리즘: 시즌(+2) · 두께(+1) · 14일+ 미착용(+0.5~2) 점수
- 파트너: 9 enabled → **18 enabled** (중고 3 · 기부 3 · 보관 2 신규 + URL)
- 중복된 `storage_box` / `storage_svc` stub 제거
- 디버깅 커밋 12개 끝에 진짜 원인(`useModalA11y` 잘못된 활성화) 발견

---

## v1.7 — 2026-05-12 · 3탭 일관화 + admin 데이터 연결

**테마: 페이지 구조 일관화(3탭) + 관리자 콘솔 ↔ 모바일 양방향 데이터 흐름**

### Changed — UI 구조 일관화
- **냉장고**: 3탭(🧊 냉장고 / 💡 추천 / 🛒 장보기) + 시각화 위계 1순위
- **옷장**: 3탭(👔 옷장 / 👗 코디 / 🛍️ 쇼핑) — 냉장고와 동일 패턴
- **마이페이지**: 4탭(요약/쇼핑/옷장/요리), 외부 진입 URL 라우팅(`?tab=...`)
- **카드 시각화**:
  - drag-to-delete 제거 → 펼침 영역 하단의 빨간 "🗑️ 소진/삭제" 버튼
  - 한 번에 하나만 펼침 (아코디언 패턴)
  - 펼침 전: 핵심 정보만, 펼침 후: 상세 칩
- **필터 정리**: 카드 칩에 이미 표시되는 정보(❄️ 냉장 / 🥬 신선 등)는 별도 필터 행 제거 (시각/리스트 모두)

### Added — 관리자 데이터 연결 (옵션 A: KV 기반)
- `src/app/api/admin/{catalog,partners,recipes,seasonal,views}/route.ts`
  - X-Admin-Token 인증 + rate limit
  - Vercel KV (Upstash) 영속화
- `src/lib/catalogStore.ts` — KV 어댑터 + 인메모리 fallback
- `src/lib/catalogTypes.ts` — Recipe/Seasonal/Partner overlay 타입
- `src/lib/rateLimit.ts` + `rateLimitStore.ts` — 토큰 버킷 rate limit
- `src/lib/useMergedCatalog.ts` — 정적 카탈로그 + admin overlay 병합 훅 (5분 SWR)
- 모바일 6개 컴포넌트 통합:
  - 홈 TodayDishCard, 냉장고 RecipeSection / SeasonalProduceSection,
    마이페이지 ShoppingListSection / ClosetCleanupSection, RecipeBrowserModal
- `matchRecipes`, `currentSeasonalProduce` 시그니처 확장 (옵셔널 source 인자)

### Added — 그 외
- **카테고리 fallback 톤** (`src/lib/categoryImages.ts`): 검증 안 된 Unsplash 사진 ID
  제거 → 카테고리별 색 배경 + 이모지로 통일 (FOOD 11종 + FASHION 13종)
- **옷장 코디 탭 빈 상태 안내**: 옷이 3벌 미만일 때 "쇼핑 탭으로 가기" CTA
- **DailyBriefing**: "네모아의 오늘 브리핑" → "오늘 코디" + 착용 체크 시각화
- **TodayActivity 제거**: 홈 화면 중복 정보 정리

### Phase 8.0 Step 5 (별도 PR로 main 진입)
- AI 보관 위치 에이전트 (Gemini 호출)
- 모델별 fridgeSection 마이그레이션 모달
- `weekly-stats` 앵커 자동 스크롤

### 정량
- 라우트 24개 빌드 성공 (0 에러)
- 신규 admin 라우트: 5개 (catalog/partners/recipes/seasonal/views)
- 신규 라이브러리: useMergedCatalog · catalogStore · catalogTypes · rateLimit · rateLimitStore
- 컴포넌트 수정: 6개

### 알려진 다음 단계
- 자유 등록 폼(TextImportConfirmStep)에 fridgeSection 드롭다운
- 카탈로그 동기화 round-trip 검증
- admin-app도 main에 머지 (현재 별도 워크트리에 머무름)

---

## v1.6 — 2026-05-07 · 냉장고 시각화 + 마이페이지 정리

**테마: Phase 8.0 냉장고 시각화 + UX 정리 (사용자 피드백 반영)**

### Added — 냉장고 시각화 (Phase 8.0)
- **`FridgeSection` 13종 칸 타입** (본체/도어/야채/버터/냉동/김치/실온) + `FoodItem.fridgeSection?` 필드
- **`recommendFridgeSection`** — 룰 기반 보관 위치 추천 (storageType → 키워드 → 카테고리)
- **냉장고 모델 4종 프리셋** — 양문형 / 4도어 / 1도어 / 김치냉장고
  - 각 모델은 그리드(cols × rows) + cells 좌표를 명시 → 시각화 컴포넌트가 그대로 렌더
  - `resolveSectionForModel`: 추천 칸이 모델에 없으면 zone fallback
- **`FridgeView`** — 냉장고 모양 그리드 시각화. 칸별 라벨·이모지·아이템 수·임박 강조
- **`SectionDetailSheet`** — 칸 탭 시 바텀 시트, SwipeFoodCard 리스트 재사용
- **헤더 시각화/리스트 토글** (LayoutGrid/List 아이콘) — 선택 영속화
- **빠른 추가/재구매/제철 등록 시 자동 칸 매핑** (모델에 없으면 fallback)
- **마이페이지 "내 냉장고" 아코디언** — 모델 변경 + 현재 모델 라벨/칸 수 노출
- **온보딩 4번째 step** — 첫 진입 시 냉장고 모델 선택 (`smart-cart-onboarded-v3` 1회 재노출)
- **단위 테스트 21개 추가** — `fridgeSection.test.mts` 14 + `fridgeModel.test.mts` 7

### Changed — 마이페이지 정리 (사용자 "조잡함" 피드백)
- **헤더 점프 칩(5개) → 4그룹 탭**: 요약 / 쇼핑 / 옷장 / 요리 (활성 탭은 `nemoa-mypage-tab` 영속화)
- **그룹별 섹션 매핑**:
  - 요약: 내 냉장고 · 이번 주 · 이번 달 · 자주 구매 · 올해 요약
  - 쇼핑: 쇼핑몰 자동 연동 · 장볼 거 추천 · 쇼핑 리스트
  - 옷장: 착용 로그 · 계절 보관 · 옷장 정리
  - 요리: 조리 로그 · 제철 히스토리 · 즐겨찾기 레시피
- **항상 노출**: 프로필 · 백업 배너 · 핵심 통계 · 지출 · 소진 히스토리 · 파트너 로드맵 · WaitlistBanner · 아카이브 · 설정 링크
- **`?tab=overview` URL 쿼리**로 탭 초기 진입 가능 (외부 진입용)

### Added — 그 외
- **`WeeklySummarySection`** — 7일 윈도우 조리/착용/소진 카운트 (마이페이지 요약 탭, id="weekly-stats")
- **홈 "이번 주" 더보기** → `/mypage?tab=overview#weekly-stats`로 정확히 라우팅
- **카테고리별 fallback 이미지** (`src/lib/categoryImages.ts`) — Unsplash stock 24종 (Food 11 + Fashion 13)
  - 적용처: SwipeFoodCard / SwipeClothingCard 썸네일 · ClosetCleanupSection
  - 사용자 업로드 imageUrl이 있으면 우선, 없으면 카테고리 fallback (저장 데이터는 그대로)

### 정량
- 라우트 19개 빌드 성공 (0 에러)
- 테스트 57/57 (기존 36 + 신규 21)
- 신규 라이브러리 5: fridgeSection · fridgeModel · useFridgeModel · categoryImages · weeklySummary
- 신규 컴포넌트 4: FridgeView · SectionDetailSheet · FridgeModelPicker · MyFridgeSection

---

## v1.5.1 — 2026-04-22 · AI 백엔드 Gemini 전환

**테마: Anthropic Claude → Google Gemini 백엔드 교체 (사용자 요청, 무료 티어 활용)**

### Changed
- 의존성 `@anthropic-ai/sdk` → `@google/generative-ai` 교체
- `lib/agentPipeline.ts` Gemini SDK로 재작성 — `GoogleGenerativeAI` 클라이언트, `gemini-2.0-flash` 모델
- `lib/harness.ts` — Anthropic 캐시 블록 → Gemini `systemInstruction` 단일 문자열 빌더
- 6개 API 라우트 (`vision-parser`, `image-agent`, `parser-agent`, `nutrition-agent`, `style-agent`, `url-agent`) 명시적 Claude 모델명 제거
- Vision 입력 형식 자체 추상 타입 (`UserContentBlock`) 도입 — 추후 LLM 교체 시 라우트 변경 불필요
- 환경변수 `ANTHROPIC_API_KEY` → `GEMINI_API_KEY`
- 약관·동의 모달·설정·에러 로깅 텍스트의 "Anthropic Claude" → "Google Gemini"
- Dual-Review 파이프라인 유지 (Gemini multi-turn chat으로 동등 구현)
- `responseMimeType: 'application/json'`로 응답 형식 강제 + `extractJSON` 안전망 유지

### Why
- 무료 티어 RPM 15·RPD 1,500로 베이직 단계 출시 비용 ₩0
- 향후 모델 변경 (예: Gemini 2.5 Pro) 시 모델명 한 곳만 수정

---

## v1.5 — 2026-04-22 · 베이직 출시 준비

**테마: 무료 공개 전 법적·운영·배포 정비**

### Added
- **법적 고지**: `/legal` 약관·개인정보 페이지, `AppInfo` 푸터 링크
- **첫 실행 동의 모달** (`ConsentGate`) — 데이터 로컬 저장·AI 호출 동의, 샘플 22개 or 빈 상태 선택
- **AI 일일 한도** (`aiQuota.ts`) — vision 10 · parser 20 · nutrition 5 · url 5, 자정 리셋
  - 설정 > **AI 오늘 남은 횟수** 카드 (4 agent × 잔여/총량 + 프로그레스 바)
  - `TextImportModal` 에이전트별 호출 전 quota 체크 + 소진 시 안내 메시지
- **Service Worker** (`public/sw.js`) — 페이지 network-first · 정적 자산 SWR · `/offline.html` 폴백
  - `/api/*` 우회 (AI 스트리밍 무손실)
  - `next.config.ts` — `/sw.js`에 `no-store` + `Service-Worker-Allowed: /`
- **로컬 에러 로깅** (`errorLog.ts`) — `window.onerror` + `unhandledrejection` + React 바운더리 수집
  - 설정 > **오류 기록** 카드 — 최근 10건 · 복사 · 지우기 (최대 50건)
  - 원격 전송 없음, Pro 단계에서 opt-in 예정
- **핵심 함수 단위 테스트 36개** — Node 네이티브 `.mts` + `node:test`
  - `season`, `purchaseCycle`, `seasonalProduce`, `aiQuota` 상수 회귀
  - `npm test` 실행
- **SEO 메타 확장** — openGraph · twitter card · canonical · metadataBase
  - `app/robots.ts` + `app/sitemap.ts` — 7개 라우트 자동 생성
  - `app/apple-icon.tsx` (180×180) + `app/opengraph-image.tsx` (1200×630) — ImageResponse 동적 생성
- **익명 사용 통계** (`analytics.ts`) — opt-in 전용, day-level 랜덤 토큰
  - 엔드포인트 미설정 시 no-op · 설정 > 피드백에 토글
  - 홈 진입 시 하루 1회 세션 핑
- **Pro 사전 등록 배너** (`WaitlistBanner`) — 마이페이지 하단, 엔드포인트 설정 시만 노출
- **CI 파이프라인** — `.github/workflows/ci.yml` (Node 24, test + lint + build)
- **MONETIZATION.md · BASIC_SPEC.md · PRO_SPEC.md · CHANGELOG.md** — 베이직/Pro 분리 문서화
- **DEPLOY.md · .env.example** — 환경 변수 · Vercel/Netlify · Capacitor · 배포 체크리스트
- **404 not-found** — 네모아 로고 모티프 리디자인

### Changed
- **빈 시드**: 신규 사용자는 `mockCartItems` 대신 `[]`로 시작 (필요 시 설정에서 샘플 22개 추가)
- `CartContext`에 `loadSampleData()` 노출 + 설정 메뉴 "📋 샘플 데이터 추가"
- `README.md` 버전 표기 v1.5
- `app/error.tsx` — `logError`로 Next.js 렌더 에러 수집 + `digest` 표시

### Fixed
- (직전 작업에서) 홈 제철 칩 `?재료명` prefix 모드 제거 — 레시피 개수 N개 노출되는데 1개만 보이던 이슈
- `CommandPalette` `useModalA11y`에 `active` 플래그 — 닫혀 있을 때 body 스크롤 잠금 해제

---

## v1.4 — 2026-04-20 · 4페이지 완성

**테마: 날씨·냉장고·개인화 완전체 + 리팩터링**

### Added
- **Phase 5 날씨 완성** — Open-Meteo 실시간 · 매칭 뱃지(✨/👍/🌱/🧊) · 어울림순 정렬 · 홈 추천 칩 · parser/vision weatherTags 폴백
- **Phase 4 냉장고 완성** — 레시피 24종 · 상세 모달 · 타이머 · 즐겨찾기 · 영양 밸런스 · 오늘 뭐 먹지 · 쇼핑 루프
- **개인화 로그** — `wearLog` + `cookLog` + 마이페이지 3 bucket × 2 TOP 3 분석
- **네모아의 오늘 한 마디** — 9+종 멀티시그널 큐레이션 (홈)
- **데이터 백업 자동화** — 7일 stale 배너 + JSON 다운로드/복원 + 스냅샷 v2
- **제철 시스템 확장** — 48종 × 4계절 + `/seasonal` 페이지 (월별/계절별 토글)
- **레시피 42종**으로 확장 + matchRecipes 6축 가중치 (매칭·임박·계절·단골·영양·난이도)

### Refactored
- 4페이지 전체 컴포넌트 분리 — **3,179줄 → 1,091줄** (25+ 재사용 컴포넌트)
  - 홈 11 · 냉장고 5 · 옷장 3 · 마이 7

---

## v1.3 — 2026-04-20 · 브랜드 확정

### Added
- **NEMOA 브랜드** 확정 — 로고 · 헤더 · 메타 · 화자 "네모아" 통일 (Phase 5.8)

### Removed
- **관리자 대시보드 철회** — 모바일 앱 내부 `/admin` 제거, 데스크탑 별도 프로젝트로 분리 대기

---

## v1.1 — 2026-04-20 · 카테고리 세분화

### Added
- **카테고리 세분화** — 식품 11종 / 패션 13종
- **이미지 시스템** — Unsplash 기반 빠른 추가 + URL og:image
- **데이터 내보내기** — JSON / CSV
- **재구매 추천** — 소진 히스토리(`discardHistory`) 기반 주기 추정

---

## v1.0 — 2026-04-17 · 정식 출시

### Added
- 레시피/코디 추천, 온보딩 7단계, 알림 설정
- hydration 이슈 수정, 최종 정리

---

## v0.8 — 2026-04-17 · 상태 관리

### Added
- 전역 상태 `CartContext`
- `localStorage` 영속화
- 검색/필터/정렬, 되돌리기(Undo), PWA manifest

---

## v0.5 — 2026-04-17 · UI 기반

### Added
- 통합 Vision 파서 (AI 에이전트)
- 벤토 대시보드 UI
- 컬러 시스템 (brand-primary/warning/success)
- App Router 라우팅

---

## v0.1 — 2026-04-16 · 에이전트 팀

### Added
- 파서 에이전트 팀 초기 구축 — `receipt-parser`, `schema-validator`, `parse-orchestrator` 스킬
- 하네스 디렉터리 구조 (`.claude/agents`, `.claude/skills`)

---

## 버전 체계

- **메이저 (x.0)**: 사용자 인터페이스 전반 변경 또는 데이터 스키마 breaking change
- **마이너 (0.x)**: 신규 기능 · 비파괴적 확장
- **패치**: 버그 수정 · 문구·스타일 변경 (별도 버전 번호 없이 커밋으로만)

v2.0은 Pro 출시 시점 예정 — [PRO_SPEC.md](./PRO_SPEC.md) 참조.
