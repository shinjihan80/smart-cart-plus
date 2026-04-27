# NEMOA v1.5

**일상을 반듯하게 모으다** — 스마트 냉장고와 옷장을 하나로, AI 라이프스타일 비서 네모아

> 사각형 벤토 UI(네모)에 사용자의 식(食)과 의(衣) 데이터를 자동 수집(모아)하고,
> 네모아가 보관 기한·코디·재구매·요리·로테이션·계절·제철까지 챙기는 모바일 퍼스트 앱.

| 문서 | 내용 |
|------|------|
| [BASIC_SPEC.md](./BASIC_SPEC.md) | v1.5 베이직 전체 기능·한도·체크리스트 |
| [PRO_SPEC.md](./PRO_SPEC.md) | Pro 출시 시 추가될 기능·가격·차등화 |
| [MONETIZATION.md](./MONETIZATION.md) | MAU 임계치·전환 타이밍·3-Phase 롤아웃 |
| [CHANGELOG.md](./CHANGELOG.md) | v0.1 → v1.5 시간순 변경 이력 |
| [DEPLOY.md](./DEPLOY.md) | 환경변수·Vercel/Netlify·체크리스트 |

## v1.5 출시 준비 (베이직 무료)

- **법적 고지** — `/legal` 약관·개인정보, `ConsentGate` 첫 실행 동의 모달
- **AI 일일 한도** — vision 10·parser 20·nutrition 5·url 5, 자정 리셋, 설정에 잔여 카드
- **Service Worker** — 페이지 network-first · 정적 자산 SWR · `/offline.html` 폴백
- **로컬 에러 로깅** — `window.onerror` + React 바운더리, 설정에서 복사·삭제 (원격 전송 X)
- **익명 사용 통계** — opt-in 전용, day-level 토큰
- **SEO** — openGraph/twitter/canonical + robots.txt + sitemap.xml + apple-icon + opengraph-image
- **테스트 36개** — Node 네이티브 `node:test` (`npm test`)
- **CI** — GitHub Actions: test → lint → build

---

## 홈 대시보드

- **NEMOA 브랜드 헤더** + 시간대별 네모아 인사 + **⌘K 빠른 탐색 버튼**
- **전체 검색** — 상품/레시피/제철 재료 동시 매칭, ⌘K · `/` · Esc 단축키
  - 제철 재료 매칭 시 "🌸 제철 딸기 냉장고에 담기" 원탭 액션
  - 레시피 매칭 시 "📖 검색어 레시피 N개 보기" GlobalRecipeModal 바로
  - 최근 검색어 5개 자동 저장 + 칩 재선택
- **퀵 링크 4개** — 제철 달력·레시피·쇼핑 리스트·프로필 (각 동적 배지)
- **제철 퀵 칩** — 현재 계절 재료 원탭 쇼핑 리스트 담기 + 📖 레시피 바로가기
- **네모아의 오늘 한 마디** — 11+종 시그널 큐레이션
  - 식품 임박 · 제철+임박(최우선) · 날씨(비/눈/온도) · 계절 꺼내기 알림
  - 영양(단백/채소 부족) · 주간 자주 만든 레시피 · 미도전 즐겨찾기
  - 쇼핑 리스트(주말 아침/5개+) · 제철 피크 장보기 · 제철 먹기 유도 · 자주 같이 만든 메뉴 조합
  - 미착용 의류 · 시간대 인사
  - **CTA → 팔레트 사전 검색 prefill**: 임박 시 재료명으로 팔레트 바로 열림
- **제철 힌트 위젯** (col-span-2) — 보유/미보유 상태 자동 분기
- **제철 체크리스트 위젯** — 이번 계절 N/M 진행 바, 놓친 N종 CTA
- **데일리 브리핑** — Open-Meteo 실시간 날씨 · 체감온도 · LIVE 배지 + Top 3 추천 의류 칩
- **오늘 한 그릇** — 보유 식재료 기반 Top 매칭 레시피 + 제철/단골 뱃지
- **옷장 현황** — 보관/소유자 배지 / **이번 달 지출**
- **냉장고 카루셀** — D-Day + 스와이프 소진
- **월별 소비 내역** · **주간 인사이트** · **최근 등록** · **오늘의 팁**

## 스마트 냉장고

- 식품 **11종 카테고리** · D-Day 프로그레스 + 영양 + 이미지
- **🌸 제철 뱃지** — 제철 재료 카드에 자동 표시, D-2 이내면 ⚠️ 강화 경고
- 2단 필터 (보관 · 식품 그룹) + **🌸 제철 필터** + **3-way 정렬**(임박·이름·제철)
- **제철 재료 섹션** — 칩에 📖 레시피 카운트, 팔레트 경유 모달 오픈
- **검색 시 제철 자동완성** — 현재 계절 미보유 재료를 칩으로 제안
- **이번 주 영양 밸런스** — 4대 영양소 커버리지 + 네모아 조언
- **오늘 뭐 먹지?** — 랜덤 + 🔀 다시 고르기, 단골/제철 뱃지
- **레시피 추천 107종** (한식·양식·일식·중식 + 셰프 스타일·예능 출연 셰프 영감) — 계절(+1.5)·임박(+2)·단골(+최대3)·**영양 힌트(+1)**·**난이도 힌트(±1)** 가중치
- **전체 보기 모달** — 검색 · 11종 필터(전체/이번 계절/즐겨찾기/셰프/예능/간단/보통/도전/아침/점심/간식)
- **상세 모달** — 조리 스텝 · 타이머 · ♥ 즐겨찾기 · 🌸 제철 재료 하이라이트 · 조리 기록 · 🍳 같이 만들었던 메뉴
- **재구매 추천** — 소진 히스토리 기반
- **카드 확장에 📖 이 재료 레시피 버튼** — 재료별 바로 레시피 탐색

## 스마트 옷장

- 패션 **13종 카테고리** · 실기온 기반 코디 추천 + 로테이션 선호(🌙)
- **매칭 뱃지 4단계** — ✨ 오늘 딱 / 👍 오늘 적절 / 🌱 계절 맞음 / 🧊 안 맞아요
- **5-way 정렬** — 이름 · 두께 · 오늘 어울림 · **🔥 자주 입는 순** · **🌙 오래 안 입은 순**
- **계절 꺼내기 배너** — 보관 중 + 현재 계절 맞는 옷 N벌 일괄 꺼내기
- **가상 코디 미리보기** — ownership 필터(전체/개별/공용), 슬롯별 아이템 순환
- 스와이프 카드 상세 — 사진 · 메타 · 메모 · **👕 오늘 입었어요** 기록
  - **"같이 자주 입는 조합"** — wearLog 같은 날짜 기반 TOP 3 자동 학습

## 마이페이지

- **백업 상태 배너** — 7일 stale 감지 + "지금 백업" CTA
- 종합 통계 + 보관 현황 + 카테고리 분포
- 최근 소진 내역 + 월별 지출 추이
- **📅 올해 활동 요약** — 조리·착용·소진 누적 + 올해 N일째
- **🪄 장볼 거 추천** — 임박/🔁주기/소진/🌸제철 4신호 자동 추천, 원탭 쇼핑 담기
- **🛒 쇼핑 리스트** — source별 그룹화(임박·소진·제철·놓친·직접), 5개+ 인라인 검색(⌘K)
  - "담았어요" → 냉장고 자동 추가 (카테고리·기한 추론)
  - 파트너 스텁 — 쿠팡 · 마켓컬리 · 네이버 · 대형마트 (Phase 7)
- **착용 로그 분석** — 자주 입는 / 오래 안 입은 / 아직 안 입은 TOP 3 + 🔄 로테이션 밸런스 스코어 + 🗓️ 요일별 착용 패턴(최근 4주)
- **🌸 계절 보관** — 계절 맞는 옷 꺼내기 · 안 맞는 옷 위탁 보관 스텁
- **🧹 옷장 정리 제안** — 60일+ 미착용 · 한 번도 안 입은 옷
  - 정리 경로별 파트너 추천 (중고 판매 · 기부 · 짐 보관)
  - 카테고리별 분포 칩 (접힌 상태에서도 확인)
- **조리 로그 분석** — 자주 만든 / 오래된 / 미도전 TOP 3 + 🗓️ 요일별 조리 패턴(최근 4주)
- **🌸 제철 식탁 히스토리** — 올계절 드신 제철 재료 랭킹 · 못 드신 재료 "모두 담기"
- **즐겨찾기 레시피** (조리 횟수 표시) + 전체 보기 모달
- **🚀 파트너 로드맵** — Phase 7 연결 예정 9개 파트너, 도메인별 설명
- 아카이브 · 알림 설정 · 설정 진입

## 설정

- **🧠 네모아가 알고 있는 것** — 레시피 107·제철 48·식품11·패션13·저장코디·파트너 9
- **🌸 제철 달력** 링크 — /seasonal 4계절 × 48종 풀 카탈로그
- **👥 프로필 관리** — 본인 + 가족 (베이직 최대 2명, 신체·식습관·아바타·권장 사이즈)
- **✨ 피드백 토글** — 햅틱 · 알림음 · **익명 사용 통계 (opt-in)**
- **🤖 AI 오늘 남은 횟수** — 4 agent × 잔여/총량 + 자정 리셋
- **🩺 오류 기록** — 최근 10건 표시 · 복사/삭제 (로컬 50건, 원격 전송 X)
- **📦 저장 용량** — localStorage 사용량 시각화
- 만료 정리 · 지금 백업 · 백업 복원 · JSON/CSV 내보내기 · 샘플 데이터 추가
- **🛡️ 백업 후 초기화** — 2단 안전 액션 (다운로드 → 확인 → 초기화)
- **🧹 검색어·필터 초기화** — `nemoa-*` 런타임 스캔 (아이템·로그 보호)
- **전체 데이터 초기화** · 알림 · 앱 정보

## /seasonal 제철 달력

- 4계절 × **48종** 식재료 풀 카탈로그
- **계절별 / 월별 뷰 토글** — 12개월 타임라인, 현재 월 하이라이트
- 재료 검색(이름·blurb) + 피크 우선 정렬
- **URL 쿼리 동기화** — `?view=month&season=가을` 공유/북마크
- 쇼핑 리스트 담기 + 📖 레시피 팔레트 연결

## ⌘K 명령 팔레트 (전역)

- **단축키** — ⌘K/Ctrl+K, `/` (입력 중이 아닐 때), Esc (비우기+블러)
- **모바일** — 헤더 🔍 버튼 또는 'nemoa:open-palette' 이벤트
- **검색 범위** — 레시피 8 · 제철 6 · 보유 아이템 5 · 페이지 8 · 액션 5
- **Fuzzy 매칭** — 공백 제거 정규화로 오타·붙여쓰기 허용
- **Prefix 모드** — `>` 액션만 · `#` 페이지만 · `?` 레시피만
- **최근 실행 5개** LRU + 빈 상태 추천 칩 (레시피만/액션만/이번 계절)
- **그룹 헤더** — 최근 / 레시피 / 제철 재료 / 이동 / 액션 섹션 분리
- **이벤트 기반 모달** — 레시피 선택 시 GlobalRecipeModal 즉시 오픈, 페이지 이동 없이

## 상품 등록 (4가지 방법)

| 방법 | 이미지 | 설명 |
|------|--------|------|
| 사진 분석 | 자동 첨부 | 네모아 Vision이 식품/패션 자동 분류, weatherTags 자동 부여 |
| URL 분석 | og:image 자동 | 쇼핑몰 페이지에서 상품 정보 추출 |
| 빠른 추가 | Unsplash 자동 | 자주 구매하는 아이템 원탭 등록 |
| 텍스트 입력 | 수동 | 영수증/이메일 텍스트 네모아 파싱 (weatherTags 폴백 포함) |

## 개인화 데이터 로그

- **의류 착용 로그** (`nemoa-wear-log`) — 옷 ID → 날짜[] · 동일일 공동 착용으로 조합 학습
- **레시피 조리 로그** (`nemoa-cook-log`) — 3회+ 단골 뱃지, matchRecipes 가중치
- **레시피 즐겨찾기** (`nemoa-recipe-favorites`)
- **쇼핑 리스트** (`nemoa-shopping-list`) — source 기반 그룹화
- **최근 검색어 5개** (`nemoa-home-recent-search`) — 온보딩 시 샘플 시드
- **명령 팔레트 최근 5개** (`nemoa-palette-recent`)
- **필터/정렬 상태** (`nemoa-fridge-*`, `nemoa-closet-*`, `nemoa-outfit-owner`)
- **섹션 접기 상태** (`nemoa-mypage-*`) — 자주 보는 섹션 유지

모두 백업 스냅샷 v2에 포함 · 새 기기 복원 시 완전 이전.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16.2.4 (App Router · Turbopack) |
| 언어 | TypeScript (strict) |
| 스타일 | Tailwind CSS v4 + SUIT 폰트 |
| 애니메이션 | Framer Motion (spring) |
| 아이콘 | Lucide React |
| AI | Google Gemini API (gemini-2.0-flash) + Dual-Review |
| 날씨 API | Open-Meteo (키 불필요 · 30분 캐시) |
| 상태 관리 | React Context + localStorage (15+ 도메인 키) + `createSharedStore` |
| PWA | manifest.json + standalone · shortcuts 3개 · icon maskable + apple-icon |
| 오프라인 | Service Worker (network-first HTML · SWR 자산 · `/offline.html`) |
| SEO | metadataBase + openGraph + twitter card + robots.ts + sitemap.ts |
| 테스트 | Node 25+ 네이티브 `node:test` (`.mts`) — 36 passes, 외부 deps 0 |
| 에러 추적 | 로컬 50건 (`errorLog`) — Pro에서 opt-in 원격 전송 예정 |
| 분석 | 익명 day-token (`analytics`, opt-in) — 엔드포인트 미설정 시 no-op |
| CI | GitHub Actions (Node 24 · test · lint · build) |

## 시작하기

```bash
npm install
npm run dev
# http://localhost:3000
```

## 프로젝트 구조

```
src/
├── app/              # 5 페이지 + 7 API 라우트
│   ├── page.tsx      # 홈 (13 위젯)
│   ├── fridge/       # 냉장고 (6 섹션)
│   ├── closet/       # 옷장 (4 섹션)
│   ├── mypage/       # 마이페이지 (9 섹션)
│   ├── seasonal/     # 제철 달력 (2 뷰 토글)
│   ├── settings/     # 설정 + KnowledgeSummary
│   └── api/agents/   # 6 AI 에이전트
├── components/
│   ├── CommandPalette.tsx      # ⌘K 전역 오버레이 (fuzzy · prefix · 최근 · 그룹)
│   ├── PaletteButton.tsx       # 페이지 헤더 공용 트리거
│   ├── GlobalRecipeModal.tsx   # 이벤트 기반 전역 레시피 모달
│   ├── PartnerChip.tsx         # Phase 7 enabled/disabled 분기
│   ├── home/                   # 13 위젯 (SeasonalHint/Checklist/ChipRow/QuickLinks 포함)
│   ├── fridge/                 # Swipe · Nutrition · FeelingLucky · Recipe · Rebuy · SeasonalProduce
│   ├── closet/                 # Swipe · OutfitPreview · SeasonalUnstowBanner
│   ├── mypage/                 # 9 섹션 (ShoppingSuggestions · SeasonalHistory · PartnerRoadmap 포함)
│   └── layout/                 # BottomNav · Logo · OnboardingModal · ScrollToTop
├── context/          # CartContext · ToastContext
├── lib/              # 18개 도메인 모듈
│   ├── recipes.ts              # 30종 레시피 + matchRecipes (4종 가중치)
│   ├── seasonalProduce.ts      # 48종 식재료 × 4계절
│   ├── season.ts               # Season 타입 · currentSeasonByMonth · seasonStart
│   ├── partnerLinks.ts         # 9개 파트너 레지스트리 (Phase 7)
│   ├── haptics.ts              # tap/toggle/action/success 공용
│   ├── useSearchShortcut.ts    # 공용 검색 단축키 훅
│   ├── usePersistedState.ts    # localStorage 동기화 훅
│   └── ...                     # weather · nutritionAnalysis · wearLog · cookLog · backup 등
└── data/             # mockData (22개) + monthlySpending (4개월)
```

## 브랜드

- **로고:** 두 개의 부드러운 사각형이 겹친 아이콘 = "네모 속 네모" → 모이는 데이터
- **컬러:** `brand-primary` #4F46E5 (indigo-600)
- **폰트:** SUIT (워드마크는 `font-extrabold tracking-tight`)
- **화자:** 사용자에게 말을 걸 때 자신을 "네모아"라고 지칭
