# CHANGELOG

NEMOA 버전별 변경 이력. 최신 → 과거 역순.

관련 문서: [BASIC_SPEC.md](./BASIC_SPEC.md) · [PRO_SPEC.md](./PRO_SPEC.md) · [MONETIZATION.md](./MONETIZATION.md)

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
