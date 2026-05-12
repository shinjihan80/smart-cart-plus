# NEMOA 작업 인계 문서

작성일: 2026-05-12
경로: `docs/HANDOFF.md`
이전 버전: v1.6 (2026-05-07) — 같은 파일 git 이력 참조

---

## 🌐 라이브 시스템

| 시스템 | URL | 인증 | 상태 |
|--------|-----|------|------|
| **모바일 앱** | https://nemoa.vercel.app | 없음 (베이직) | ✅ 운영 |
| **관리자 콘솔** | https://nemoa-admin.vercel.app | Basic Auth (`admin` / `19ffb1d16255a7d9`) | ✅ 운영 |
| **카탈로그 API** | https://nemoa.vercel.app/api/admin/* | GET 공개 / POST·PUT·DELETE `X-Admin-Token` 필요 | ✅ 운영 |

마지막 production 배포 (nemoa): **`7sf55nd86`** (2026-05-12, useMergedCatalog 통합 시점)
마지막 production 배포 (admin): 13일 전 (별도 워크트리에서 작업, main 미머지)

---

## ✅ 이번 세션(2026-05-12) 누적 완료

### 핵심: 관리자 ↔ 모바일 데이터 연결 복구
- `/api/admin/{catalog,partners,recipes,seasonal,views}` 5종 라우트 신설 — Vercel KV(Upstash) 영속화
- `src/lib/{catalogStore,catalogTypes,rateLimit,rateLimitStore}.ts` — 인프라
- `src/lib/useMergedCatalog.ts` — 5분 SWR 정적+overlay 병합 훅
- 모바일 6개 컴포넌트 통합: TodayDishCard / RecipeBrowserModal / RecipeSection / SeasonalProduceSection / ShoppingListSection / ClosetCleanupSection
- `matchRecipes`·`currentSeasonalProduce` 시그니처 확장 (옵셔널 source)

### UI 일관화 (3탭/4탭 통일)
- 냉장고: 🧊 냉장고 / 💡 추천 / 🛒 장보기
- 옷장: 👔 옷장 / 👗 코디 / 🛍️ 쇼핑
- 마이페이지: 4탭 + URL 라우팅 + 해시 자동 스크롤
- 시각화 우선 위계 (사용자 요청: "냉장고 이미지가 위로 가야 위계상 맞지 않나?")
- 필터 칩 정리 (카드 칩에 이미 있는 정보 중복 제거)

### 카드 UX
- drag-to-delete 제거 → 펼침 영역 하단 명시적 🗑️ 버튼
- 한 번에 하나만 펼침 (아코디언, 부모가 `expandedId` 관리)
- 펼침 전 핵심 정보 + 펼침 후 상세 칩
- 카드 편집 모드에 보관 위치 select (현재 모델의 cells 옵션)

### 그 외
- 카테고리 fallback 톤 (Unsplash 사진 ID 환상 사고 재발 방지)
- 옷장 데모 데이터 21개로 확장
- DailyBriefing "오늘 코디"로 명칭 단축 + 착용 체크 시각화
- 옷장 코디 탭 빈 상태 안내
- TodayActivity 제거 (홈 중복)

상세는 [CHANGELOG.md v1.7](../CHANGELOG.md) 참조.

---

## 📁 주요 파일 위치

### 카탈로그 동기화 인프라 (이번 세션 신규)
- `src/app/api/admin/*/route.ts` — admin CRUD API 5종
- `src/lib/catalogStore.ts` — KV 어댑터
- `src/lib/catalogTypes.ts` — Recipe/Seasonal/Partner overlay 타입
- `src/lib/useMergedCatalog.ts` — 클라이언트 병합 훅

### 냉장고 시각화 (이전 세션, v1.6)
- `src/lib/fridgeSection.ts` · `fridgeModel.ts` · `useFridgeModel.ts`
- `src/components/fridge/FridgeView.tsx` · `SectionDetailSheet.tsx` · `FridgeModelPicker.tsx`

### 페이지
- `src/app/fridge/page.tsx` — 3탭 (FridgeTab)
- `src/app/closet/page.tsx` — 3탭 (ClosetTab)
- `src/app/mypage/page.tsx` — 4탭 + URL 라우팅

### admin-app (별도 워크트리)
- 위치: `/Users/sinji/smart-cart-plus/.claude/worktrees/nice-herschel-15a353/admin-app/`
- 별도 Next.js 프로젝트, Vercel `nemoa-admin` 프로젝트로 배포 중
- 호출: `${NEMOA_ORIGIN}/api/admin/*` + `X-Admin-Token`
- **main에 머지되지 않은 상태** — 추후 별도 PR 권장

---

## 🟡 남은 후속 작업

### 우선순위 1 — 자유 등록 폼 fridgeSection (자율 가능, 30분)
현재 `TextImportConfirmStep`/`+ 직접 등록`은 fridgeSection 미입력.
- 등록 확인 화면에 "보관 위치" 드롭다운 (현재 모델의 cells)
- 기본값은 `recommendFridgeSection` 결과
- 카드 편집 모드는 이미 작동 중 (이번 세션 완료)

### 우선순위 2 — 카탈로그 동기화 round-trip 검증 (자율 가능, 20분)
- admin에서 더미 레시피 1개 추가
- 모바일에서 5분 캐시 만료 또는 강제 fetch 후 노출 확인
- 캐시 invalidate 정책 검토 (현재: 5분 TTL, 페이지 reload 시도 새로 fetch)

### 우선순위 3 — admin-app 자체를 main에 머지 (자율 가능, 1시간)
현재 admin-app은 `nice-herschel-15a353` 워크트리에만. git에서 추적 안 됨.
- 모노레포 구조 결정: 같은 저장소 sub-package vs 별도 저장소
- 같은 저장소면 `admin-app/` 서브디렉토리 또는 `apps/admin` (Turborepo 구조)

### ⏸ 외부 결정·계정 필요
| 항목 | 막힌 이유 |
|------|---------|
| 커스텀 도메인 | nemoa.kr 등 구입 + Vercel 연결 |
| iOS 앱스토어 | Apple Developer Program $99/년 |
| Android Play Console | $25 일회성 |
| 토스페이먼츠 | 사업자 등록 + 상점 개설 |
| Waitlist endpoint | Google Forms / Tally / Formspree 중 선택 |
| Supabase Pro 마이그레이션 | 현재 KV로 충분 — 사용자 인증 필요 시점에 검토 |

---

## 🔑 환경변수 현황

### NEMOA 모바일 (`nemoa.vercel.app`)
```
✓ GEMINI_API_KEY               (AI 에이전트)
✓ ADMIN_API_TOKEN              (admin write 보호)
✓ NEXT_PUBLIC_SITE_URL         (SEO)
✓ KV_REST_API_URL              (Upstash, admin overlay 저장)
✓ KV_REST_API_TOKEN
✓ KV_REST_API_READ_ONLY_TOKEN
✓ KV_URL · REDIS_URL
```

### 관리자 콘솔 (`nemoa-admin.vercel.app`)
```
✓ ADMIN_USER                   (Basic Auth)
✓ ADMIN_PASSWORD
✓ NEXT_PUBLIC_NEMOA_ORIGIN     (https://nemoa.vercel.app)
✓ NEXT_PUBLIC_ADMIN_API_TOKEN  (NEMOA의 ADMIN_API_TOKEN과 동일 값)
```

---

## 🌿 Git 상태

- 작업 브랜치 (이 워크트리): `claude/optimistic-pascal-b26910` — 일부 commits이 main과 분기됨
- main: 최신 — 이번 세션 모든 변경 반영
- 머지된 PR 번호: #5~#19 (19개)
- 미머지: admin-app 자체 (nice-herschel 워크트리)

---

## 🎯 다음 세션 권장 시작점

```
이전 작업 인계: docs/HANDOFF.md 읽고 "우선순위 1 (자유 등록 폼 fridgeSection)"부터 진행해줘
```

또는 외부 결정 후:
```
도메인 nemoa.kr 구입 완료. Vercel 연결 진행해줘
```

---

**문서 끝.** 다음 채팅에서 이 파일 위치(`docs/HANDOFF.md`) 알려주시면 바로 이어갈 수 있습니다.
