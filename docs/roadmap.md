# NEMOA — 중장기 고도화 마스터 플랜

> 단순한 쇼핑 내역 통합 뷰어를 넘어,
> 사용자의 **의식주(衣食住) 데이터를 관리하는 지능형 라이프스타일 AI 에이전트**로 진화한다.

---

## 서비스 비전

| 단계 | 목표 |
|------|------|
| 1차 | 파편화된 쇼핑 정보(메일·영수증)의 수집 자동화 및 규격화된 DB 구축 |
| 2차 | 식품 보관 기한 추적 + 패션 아이템 메타데이터(소재·두께) 관리 |
| 최종 | 다중 AI 에이전트(MOAI) 기반 개인화 큐레이션 (요리·영양소 추천, 날씨·바이오리듬 맞춤 코디) + 간편 재구매 유도 |

---

## AI 아키텍처 전략: 하네스(Harness) 기반 다중 에이전트 시스템

`revfactory/harness` 프레임워크 기반으로 단일 AI의 환각(Hallucination)을 방지하고 도메인 특화 에이전트 팀을 구성한다.

```
중앙 통제 (Global Context)
  └─ 모든 에이전트는 UX 라이팅 표준 + 데이터 스키마 규칙을 최우선 준수

역할 분담 (MOAI 구조)
  └─ 데이터 추출 / 식품 영양 분석 / 패션 코디 — 에이전트 모듈화

이중 검토 (Dual-Review)
  └─ 작업자 에이전트 → 검증자 에이전트 교차 검증 → 사용자 컨펌(Human-in-the-loop)
```

---

## 단계별 로드맵

### ✅ Phase 1 — 기반 설계 및 데이터 스키마 (MVP)

**목표:** 확장 가능한 JSON 데이터 스키마 + 모바일 퍼스트 UI 뼈대

- **식품(FoodItem):** `storageType` (냉장/냉동/실온), `baseShelfLifeDays`, `purchaseDate`, `nutritionFacts?`
- **의류(ClothingItem):** `size`, `thickness` (얇음/보통/두꺼움), `material`, `weatherTags?`, `colorFamily?`
- **UI:** 디자인 토큰 적용 (`rounded-2xl`, `gap-y-4`, `indigo-600`), 원클릭 재구매 동선

---

### ✅ Phase 2 — 하네스(Harness) 인프라 및 환경 세팅

**목표:** `.claude/agents/` + `.claude/skills/` 디렉토리 기반 에이전트 근무 환경 조성

- `harness/global-context.md` — 모든 에이전트 공통 규칙 주입
- `harness/system-rules.json` — 기계 가독 스키마 + UX 금지어 규칙
- `src/lib/harness.ts` — 입출력 검증 미들웨어 + 프롬프트 캐시 블록 빌더
- `src/lib/agentPipeline.ts` — 데이터 라우터 + Dual-Review LLM 체인
- API 라우트 3종: `parser-agent`, `nutrition-agent`, `style-agent`

---

### 🔄 Phase 3 — 파서(Parser) 에이전트 팀 (데이터 수집 자동화)

**목표:** 비정형 텍스트 → 구조화 JSON 자동 변환

#### 에이전트 구성 (생성-검증 패턴)

| 에이전트 | 역할 |
|---------|------|
| `receipt-parser` | 텍스트에서 상품명·카테고리·보관 정보 1차 추출 |
| `schema-validator` | Phase 1 스키마 기준 이중 검토·교정 (Dual-Review 포함) |

#### 지식 스킬

| 스킬 | 역할 |
|------|------|
| `food-knowledge` | 식품 카테고리별 보관 기간 도메인 지식 |
| `clothing-knowledge` | 소재→두께 매핑, 브랜드→사이즈 체계 |

#### UI 연동 현황

- [x] 텍스트 입력 모달 (`TextImportModal`) + page.tsx 연결
- [ ] **사용자 최종 컨펌(수정) 화면** — 파싱 결과 검토·편집 후 확정 (Option A: 인라인 2단계 모달)

#### 컨펌 화면 설계 결정: Option A (인라인 2단계 모달)

```
[1단계] 텍스트 입력
   ↓ AI 분석
[2단계] 파싱 결과 카드 목록 (수정 가능)
   ↓ [N개 추가하기] 버튼
[완료] 대시보드 목록에 추가 + 토스트
```

이유:
- 모바일 퍼스트 앱에서 페이지 이동 없는 바텀 시트 패턴이 UX 흐름에 최적
- Phase 4~5 에이전트 결과에도 동일 컨펌 패턴 재사용 가능
- `/confirm` 페이지 방식은 URL 직접 접근 시 상태 관리 복잡

---

### ✅ Phase 4 — 영양사 · 레시피 · 요리 (스마트 냉장고)

**구현 완료:**

- D-Day 계산 + 색상 경고 (urgent ≤ 2일 / warning ≤ 5일 / fresh) — `FoodTags`
- 레시피 24종 (`src/lib/recipes.ts`) — keyword 매칭 + 소비 임박 가중치(+2)
- **레시피 상세 모달** — 조리 스텝 · mm:ss 타이머 · Web Audio 비프음
- **즐겨찾기** (♥) — localStorage 영속 + 섹션 상단 고정
- **오늘 뭐 먹지?** — 매칭 Top 12 중 랜덤 픽 + 🔀 셔플
- **전체 보기 모달** — 검색 + 필터 6종(전체/즐겨찾기/간단/아침/점심/간식)
- **주간 영양 밸런스** — 칼로리·단백·탄수·지방 주간 커버리지 + 네모아 조언
- **쇼핑 루프** — 부족 재료 담기 → 마이페 쇼핑 리스트 → "담았어요" 자동 FoodItem 변환
- **조리 로그** — "만들었어요" 클릭 = 기록 · 마이페 TOP 3 분석
- `nutrition-agent`는 구현되어 있으나 미연동 (Phase 외부에서 수동 호출 가능)

---

### ✅ Phase 5 — 스타일리스트 · 날씨 (스마트 옷장)

**구현 완료:**

- **Open-Meteo 실 날씨 연동** (`src/lib/weather.ts`) — 키 불필요 · 30분 캐시 · 6초 타임아웃
- **홈 데일리 브리핑 LIVE 배지** + 체감온도 + Top 3 추천 의류 칩
- **매칭 뱃지 4단계** — ✨ 오늘 딱 / 👍 적절 / 🌱 계절 / 🧊 안 맞아요
- **"오늘 어울림순" 정렬**
- **옷장 OutfitSection** — 실 기온 기반 코디 추천 + 로테이션 선호
- **의류 착용 로그** — "오늘 입었어요" 기록 · N일 전 뱃지 · 마이페 TOP 3
- **로테이션 선호** — 홈 Top 3, 옷장 OutfitSection 모두 오래 안 입은 옷 우선
- **parser/vision weatherTags 자동 부여** — AI 프롬프트 매트릭스 + 서버 폴백
- `style-agent`는 구현되어 있으나 미연동 (Phase 외부에서 수동 호출 가능)

---

### ✅ Phase 5.8 — NEMOA 브랜드 · 개인화 · 백업 · 리팩터링

- **NEMOA 브랜드** — 로고 컴포넌트(겹침 사각형) · 메타 · 화자 "네모아" 통일
- **네모아의 오늘 한 마디** — 홈 배너, 9종 시그널 큐레이션
- **데이터 백업 자동화** — 7일 stale 배너 + JSON 다운로드 + 복원 + 스냅샷 v2 (wearLog + cookLog 포함)
- **4페이지 리팩터링** — page.tsx 3179→1091줄 · 25+ 재사용 컴포넌트 분리

---

### ⏳ Phase 6 — 관리자 대시보드 (별도 프로젝트)

**중요:** 관리자 대시보드는 네모아 모바일 앱 **외부의 별도 Next.js 프로젝트**로 구축한다.
모바일 앱 내부 `/admin` 라우트로 넣지 않는다.

#### 원칙

- **분리 저장소 (또는 `nemoa-admin/` 모노레포 디렉토리)** — 네모아 앱과 독립 배포
- **데스크탑 전용** — 와이드 레이아웃(사이드바 + 콘텐츠), `max-w-md` 제약 없음
- **실 데이터 기반** — localStorage 시뮬레이션이 아닌 Supabase/DB 연동

#### 기술 스택 (확정)

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| UI 컴포넌트 | shadcn/ui |
| 차트 | Recharts |
| DB/Auth | Supabase |
| 결제 | 토스페이먼츠 |

#### 기능 범위

- 사용자 현황 (가입·활성·이탈)
- 통계 대시보드 (데이터 처리량·에이전트 호출·토큰 비용)
- 결제 관리 (Pro 플랜 구독·환불·정산)
- 콘텐츠 관리 (레시피·코디 큐레이션 DB 편집)
- 시스템 관리 (에이전트 규칙 수정·배포 이력·에러 로그)

#### 전제 조건 (착수 시점)

- Supabase 스키마 설계 + 모바일 앱 마이그레이션 (localStorage → Supabase)
- 토스페이먼츠 상점 개설 + 테스트 결제 플로우
- 관리자 인증 (별도 계정 체계 또는 Supabase RLS)

**실 데이터 인프라가 준비된 시점에 착수** — 시뮬 UI를 먼저 만들지 않는다.

---

## 절대 규칙 (Absolute Rules)

### UX 라이팅 표준

| 사용 (O) | 금지 (X) |
|---------|---------|
| 주문 내역 | 구매 내역, 결제 내역 |
| 배송 현황 | 배송 조회, 택배 추적 |
| 보관 가능 기한 | 유통기한, 소비기한 |
| 재구매하기 | 다시 주문, 재주문 |

**주문 상태 4단계만 허용:** 결제완료 → 상품준비 → 배송중 → 배송완료

### 디자인 시스템

| 토큰 | 값 |
|------|---|
| 레이아웃 | `max-w-md mx-auto` (최대 480px, 모바일 퍼스트) |
| 컴포넌트 반경 | `rounded-2xl` |
| 그림자 | `shadow-sm` |
| 주 색상 | `indigo-600` |
| 간격 | `gap-y-4` |
| 폰트 베이스 | `html { font-size: 17px }` (한국어 SUIT 가독성 보강, Tailwind 1rem = 17px) |
| 폰트 계층 | Title (`text-lg font-bold` ≈ 19px) / Body (`text-sm` ≈ 15px) / Caption (`text-xs text-gray-400` ≈ 13px) |
| 보조 라벨 | `text-[10px]` ~ `text-[11px]` (사용 시 정보가 보조적·반복적인지 검토 필수) |
| 줄 간격 | 본문 1.55 (`body { line-height: 1.55 }`), 제목·라벨은 `leading-tight` |
| 자간 | `letter-spacing: -0.005em` (한글), 제목은 `tracking-tight` |
| 접근성 | viewport `maximumScale·userScalable` 미설정 → 사용자 줌·시스템 글자 크기 허용 (WCAG 1.4.4) |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router), React 19, TypeScript strict |
| 스타일 | Tailwind CSS v4 |
| AI SDK | `@anthropic-ai/sdk`, `claude-opus-4-6` |
| 에이전트 프레임워크 | `revfactory/harness` (`.claude/agents/` + `.claude/skills/`) |
| AI 전략 | `thinking: {type: 'adaptive'}`, Dual-Review Chain, Prompt Caching |
| 차트 (예정) | Recharts |

---

---

### ⏳ Phase 7 — 파트너 연결 & 수익화

**목표:** 사용자 행동 데이터(소진·정리·재구매)가 쌓인 시점에 파트너 서비스로 연결, 유료화·제휴 수수료로 수익 창출.

#### 옷장 쪽 연결

| 행동 | 파트너 | UI 위치 |
|------|-------|--------|
| 정리 (미착용 · 장기 보관) | 아름다운가게 · 굿윌스토어 · 옷캔 등 **기부 단체** | `ClosetCleanupSection` 행별 버튼 |
| 중고 판매 | 당근마켓 · 번개장터 · 크림 딥링크 | 같은 위치 |
| 짐 보관 (시즌 보관) | 세탁특공대 · 다락 등 **이사·보관 업체** | `SeasonalStorageSection` 보관 옵션 |

#### 냉장고 쪽 연결

| 행동 | 파트너 | UI 위치 |
|------|-------|--------|
| 재구매 (소진 후) | 쿠팡 · 네이버쇼핑 · 마켓컬리 제휴 API | `RebuySection` · `ShoppingListSection` |
| 이메일 자동 파싱 | 주문 확인 메일 → 자동 수집 | 마이페 쇼핑몰 연동 섹션 |
| 장 보기 | 쇼핑 리스트 → 원탭 쿠팡 장바구니 등록 | 쇼핑 리스트 하단 |

#### 수익 모델

1. **제휴 수수료(Affiliate)** — 파트너 링크 주문의 %.
2. **Pro 구독** — 멀티 디바이스 동기화 (Supabase) · AI 무제한 · PDF 리포트.
3. **파트너 광고비** — 짐 보관·기부 단체 노출 수수료.

#### 착수 전제조건

- Supabase 회원/결제 (Phase 6 관리자 프로젝트와 동시 인프라 준비)
- 토스페이먼츠 상점 개설
- 파트너사 각 API 계약 (제휴사 등록)

**Phase 5.9 placeholder**: `ClosetCleanupSection` · `RebuySection`에 "준비 중" 파트너 버튼으로 자리 확보 — Phase 7에 실 연결.

---

*최종 업데이트: 2026-04-20 — v1.4 Phase 4·5 완성, Phase 7 수익화 로드맵 추가 (Phase 6은 별도 프로젝트 대기)*
