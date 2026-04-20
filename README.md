# NEMOA v1.4

**일상을 반듯하게 모으다** — 스마트 냉장고와 옷장을 하나로, AI 라이프스타일 비서 네모아

> 사각형 벤토 UI(네모)에 사용자의 식(食)과 의(衣) 데이터를 자동 수집(모아)하고,
> 네모아가 보관 기한·코디·재구매·요리·로테이션까지 챙기는 모바일 퍼스트 앱.

---

## 홈 대시보드

- **NEMOA 브랜드 헤더** + 시간대별 네모아 인사
- **네모아의 오늘 한 마디** — 9종 시그널 큐레이션 (식품 임박 · 날씨 · 영양 · 조리 · 미도전 즐겨찾기 · 미착용 의류 · 시간대)
- **데일리 브리핑** — Open-Meteo 실시간 날씨 · 체감온도 · LIVE 배지 + Top 3 추천 의류 칩
- **오늘 한 그릇** — 보유 식재료 기반 Top 매칭 레시피 원탭
- **옷장 현황** / **이번 달 지출**
- **냉장고 카루셀** — D-Day + 스와이프 소진
- **월별 소비 내역** — 바 차트 + 탭 전환
- **주간 인사이트** + **최근 등록** + **오늘의 팁**
- **전체 상품 검색** — 썸네일 + 실시간 필터

## 스마트 냉장고

- 식품 **11종 카테고리** (채소·과일 / 정육·계란 / 수산·해산 / 유제품 / 음료 / 간식·과자 / 양념·소스 / 면·즉석 / 빵·베이커리 / 건강식품 / 기타)
- D-Day 프로그레스 바 + 영양 정보 + 이미지
- 2단 필터 (보관 타입 + 식품 그룹) + 정렬
- **이번 주 영양 밸런스** — 칼로리/단백/탄수/지방 주간 커버리지 + 네모아 조언
- **오늘 뭐 먹지?** — 랜덤 픽 CTA + 🔀 다시 고르기
- **레시피 추천** 24종 — 소비 임박 가중치 + 즐겨찾기 상단 고정
- **전체 보기 모달** — 검색 · 6종 필터 · 즐겨찾기
- **상세 모달** — 조리 스텝 · 타이머(mm:ss · 비프음) · ♥ 즐겨찾기 · 부족 재료 쇼핑 리스트 담기 · 조리 횟수 기록
- **재구매 추천** — 소진 히스토리 기반

## 스마트 옷장

- 패션 **13종 카테고리** (상의 / 하의 / 아우터 / 원피스 / 신발 / 가방 / 모자 / 스카프 / 안경 / 선글라스 / 시계 / 주얼리 / 기타 액세서리)
- **실 기온 기반 코디 추천** + 로테이션 선호 (오래 안 입은 옷 우선 · 🌙)
- **매칭 뱃지 4단계** — ✨ 오늘 딱 / 👍 오늘 적절 / 🌱 계절 맞음 / 🧊 안 맞아요
- **"오늘 어울림순" 정렬**
- 가상 코디 미리보기 (이미지 슬롯 탭 순환)
- 스와이프 카드 상세 — 사진 · 메타 · 메모 · **👕 오늘 입었어요** 기록

## 마이페이지

- **백업 상태 배너** — 7일 stale 감지 + "지금 백업" CTA
- 종합 통계 + 보관 현황 + 카테고리 분포 (bar chart)
- 최근 소진 내역 + 월별 지출 추이
- **쇼핑 리스트** — 부족 재료 담기 · 모두 담기 · "담았어요" → 냉장고 자동 추가 (카테고리·기한 추론)
- **착용 로그 분석** — 자주 입는 / 오래 안 입은 / 아직 안 입은 TOP 3
- **조리 로그 분석** — 자주 만든 / 오래된 / 미도전 TOP 3
- **즐겨찾기 레시피** (조리 횟수 표시) + 전체 보기 모달
- 아카이브
- 알림 설정 3종
- **설정 메뉴** — 만료 정리 · 지금 백업 · 백업 복원 · JSON/CSV 내보내기 · 데이터 초기화
- 앱 정보

## 상품 등록 (4가지 방법)

| 방법 | 이미지 | 설명 |
|------|--------|------|
| 사진 분석 | 자동 첨부 | 네모아 Vision이 식품/패션 자동 분류, weatherTags 자동 부여 |
| URL 분석 | og:image 자동 | 쇼핑몰 페이지에서 상품 정보 추출 |
| 빠른 추가 | Unsplash 자동 | 자주 구매하는 아이템 원탭 등록 |
| 텍스트 입력 | 수동 | 영수증/이메일 텍스트 네모아 파싱 (weatherTags 폴백 포함) |

## 개인화 데이터 로그

- **의류 착용 로그** (`nemoa-wear-log`) — 옷 ID → 착용 날짜[] · 최대 365일 보관
- **레시피 조리 로그** (`nemoa-cook-log`) — 레시피 ID → 조리 날짜[]
- **레시피 즐겨찾기** (`nemoa-recipe-favorites`)
- **쇼핑 리스트** (`nemoa-shopping-list`) — 부족 재료 누적

모두 백업 스냅샷 v2에 포함되어 새 기기 복원 시 완전 이전.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16.2.4 (App Router · Turbopack) |
| 언어 | TypeScript (strict) |
| 스타일 | Tailwind CSS v4 + SUIT 폰트 |
| 애니메이션 | Framer Motion (spring) |
| 아이콘 | Lucide React |
| AI | Anthropic Claude API (Opus 4.6 / Haiku 4.5) + Dual-Review |
| 날씨 API | Open-Meteo (키 불필요 · 30분 캐시) |
| 상태 관리 | React Context + localStorage (8+ 도메인 키) |
| PWA | manifest.json + standalone · icon.svg NEMOA 로고 |

## 시작하기

```bash
npm install
npm run dev
# http://localhost:3000
```

## 프로젝트 구조

```
src/
├── app/              # 4 페이지 + 7 API 라우트
│   ├── page.tsx      # 홈 대시보드 (142줄 · 11 위젯 분리)
│   ├── fridge/       # 냉장고 (306줄 · 5 섹션 분리)
│   ├── closet/       # 옷장 (306줄 · 3 섹션 분리)
│   ├── mypage/       # 마이페이지 (~370줄 · 7 섹션 분리)
│   └── api/agents/   # 6 AI 에이전트 (parser · vision · url · image · nutrition · style)
├── components/
│   ├── home/         # 11개 홈 위젯 + DailyMessage + shared
│   ├── fridge/       # SwipeFoodCard · Nutrition · FeelingLucky · Recipe · Rebuy
│   ├── closet/       # SwipeClothingCard · OutfitPreview · OutfitSection
│   ├── mypage/       # Stats · Spending · Shopping · Favorites · Wear · Cook · Notif · AppInfo
│   ├── layout/       # NemoaLogo · BottomNav · FloatingAdd · OnboardingModal · ScrollToTop
│   ├── RecipeDetailModal.tsx   # 조리 스텝 · 타이머 · 담기 · 즐겨찾기 · 조리 기록
│   └── RecipeBrowserModal.tsx  # 24종 레시피 검색 + 필터
├── context/          # CartContext (restoreAll · archiveExpired 등) + ToastContext
├── types/            # 24종 카테고리 타입 시스템
├── lib/              # weather · recipes · nutritionAnalysis · wearLog · recipeCookLog
│                     # recipeFavorites · shoppingList · ingredientInference · backup
│                     # dailyMessage · agentLogger · agentPipeline · harness · exportUtils · imageUtils
└── data/             # mockData (22개) + monthlySpending (4개월)
```

## 브랜드

- **로고:** 두 개의 부드러운 사각형이 겹친 아이콘 = "네모 속 네모" → 모이는 데이터
- **컬러:** `brand-primary` #4F46E5 (indigo-600)
- **폰트:** SUIT (워드마크는 `font-extrabold tracking-tight`)
- **화자:** 사용자에게 말을 걸 때 자신을 "네모아"라고 지칭
