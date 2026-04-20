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

### ⏳ Phase 4 — 영양사(Nutrition) 에이전트 (스마트 냉장고)

**목표:** 식품 데이터의 시간 경과 추적 + 영양 분석

#### 주요 기능

- 보관 방법별 D-Day 계산 + 임박 알림 (urgent ≤ 2일 / warning ≤ 5일 / fresh)
- 냉장고 남은 식재료 조합 레시피 제안
- 최근 소비 패턴 기반 부족 영양소 분석 + 맞춤 식품 재구매 유도

#### 에이전트 계획

- `nutrition-agent` (기존): D-Day 계산 + 식단 추천 JSON 반환
- `recipe-suggester` (신규): 보유 식재료 조합 → 레시피 카드 생성
- `nutrition-analyzer` (신규): 소비 이력 기반 영양소 갭 분석

#### UI 계획

- 식품 카드에 D-Day 뱃지 + 색상 경고 (이미 Phase 1에서 `FoodTags` 구현)
- "오늘 뭐 해먹지?" 레시피 추천 섹션
- 주간 영양소 섭취 현황 바 차트 (Recharts)

---

### ⏳ Phase 5 — 스타일리스트(Style) 에이전트 (스마트 옷장)

**목표:** 외부 Context(날씨·개인화 데이터) + 보유 의류 메타데이터 결합

#### 주요 기능

- 기상청 API (온도·날씨 상태) 연동 + 의류 두께/소재 매핑
- 운세·바이오리듬 등 사용자 개인화 데이터 결합
- "오늘 날씨 및 상황에 맞는 최적 코디" 큐레이션 제공

#### 에이전트 계획

- `style-agent` (기존): 날씨 + 의류 메타데이터 → 코디 추천 JSON
- `weather-fetcher` (신규): 기상청 API 연동 + 날씨 데이터 정규화
- `outfit-ranker` (신규): 추천 코디 후보 우선순위 랭킹

#### UI 계획

- "오늘의 코디" 위젯 (홈 상단 고정)
- 의류 카드에 날씨 매칭 뱃지
- 코디 조합 갤러리 (아이템 이미지 그리드)

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
| 폰트 계층 | Title (`text-lg font-bold`) / Body (`text-sm`) / Caption (`text-xs text-gray-400`) |

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

*최종 업데이트: 2026-04-20 — Phase 5.8 NEMOA 브랜드 확정 v1.3 (Phase 6은 별도 프로젝트 대기)*
