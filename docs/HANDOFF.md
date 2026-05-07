# NEMOA 작업 인계 문서

작성일: 2026-05-07
경로: `docs/HANDOFF.md`
다음 채팅 시작 명령어: 아래 **🚀 다음 채팅 시작 명령어** 섹션 참조

---

## 🌐 라이브 시스템

| 시스템 | URL | 인증 |
|--------|-----|------|
| **모바일 앱** | https://nemoa.vercel.app | 없음 (베이직) |
| **관리자 콘솔** | https://nemoa-admin.vercel.app | `admin` / `19ffb1d16255a7d9` |
| **카탈로그 API** | https://nemoa.vercel.app/api/admin/* | GET 공개 / POST·DELETE는 `X-Admin-Token` 필요 |

마지막 production 배포: **재배포 필요** (현재 변경분이 main에 머지되지 않은 워크트리 브랜치)

---

## 🚀 다음 채팅 시작 명령어

새 채팅에 다음 메시지 붙여넣기:

```
이전 작업 인계: docs/HANDOFF.md 읽고 "남은 후속 작업"에서 ___부터 진행해줘
```

또는:

```
docs/HANDOFF.md 의 "🟡 후속 권장 작업"에서 Phase 8.0 Step 5 (AI 보관 위치 에이전트)부터 진행해줘
```

---

## ✅ 이번 세션에서 완료된 작업 (2026-05-07)

| 영역 | 커밋 | 핵심 |
|------|------|------|
| **Phase 8.0 Step 1** | `8280d3c` | `FridgeSection` 13종 타입 + `recommendFridgeSection` 룰 매핑 + 14 테스트 |
| **Phase 8.0 Step 2** | `9d9136d` | 모델 4종 프리셋 (양문형/4도어/1도어/김치) + `useFridgeModel` 훅 + Picker UI + 7 테스트 |
| **Phase 8.0 Step 3** | `34417aa` | `FridgeView` 그리드 + `SectionDetailSheet` 바텀 시트 + fridge 페이지 토글·자동 매핑 |
| **Phase 8.0 Step 4** | `33d16bc` | 마이페이지 "내 냉장고" 아코디언 + 온보딩 step (smart-cart-onboarded-v3) |
| **마이페이지 정리** | `5541a1c` | 14 섹션 → 4그룹 탭 (요약/쇼핑/옷장/요리) — "조잡함" 피드백 반영 |
| **이번 주 통계** | `35932e2` | `WeeklySummarySection` + `?tab=...` URL 라우팅 |
| **Fallback 이미지** | `608db8d` | 카테고리 24종 Unsplash 매핑 + 카드 썸네일 적용 |

상세는 [CHANGELOG.md v1.6](../CHANGELOG.md) 참조.

---

## 📁 새로 추가된 주요 파일

### 라이브러리
- `src/lib/fridgeSection.ts` — 칸 메타·룰 매핑·그루핑 (180줄)
- `src/lib/fridgeModel.ts` — 4 모델 프리셋·셀 좌표·resolveSectionForModel (170줄)
- `src/lib/useFridgeModel.ts` — localStorage 영속화 훅 (`nemoa-fridge-model`)
- `src/lib/categoryImages.ts` — Unsplash stock 24종 + getDisplayImage

### 컴포넌트
- `src/components/fridge/FridgeView.tsx` — 그리드 시각화
- `src/components/fridge/SectionDetailSheet.tsx` — 칸 상세 바텀 시트
- `src/components/fridge/FridgeModelPicker.tsx` — 2열 카드 (compact 옵션)
- `src/components/mypage/MyFridgeSection.tsx` — 마이페이지 "내 냉장고" 아코디언
- `src/components/mypage/WeeklySummarySection.tsx` — 7일 활동 요약

### 테스트
- `tests/fridgeSection.test.mts` — 14 케이스
- `tests/fridgeModel.test.mts` — 7 케이스

---

## 🟡 남은 후속 작업

### 🔥 우선순위 1 — Phase 8.0 Step 5: AI 보관 위치 추천 강화

현재 `recommendFridgeSection`은 룰 기반(키워드 + 카테고리). HANDOFF v1에서 "Pro 단계, 5단계"로 미뤄둔 작업.

**구현 방향**
- `src/app/api/agents/fridge-section-agent/route.ts` 신규 — Gemini 호출
- 입력: `{ name, foodCategory, storageType }` + 사용자 모델
- 출력: `{ section, reason }` — 추천 칸 + 짧은 이유
- 룰 기반은 무료, AI 강화는 Pro 한도 (예: 일 5회)
- 등록 폼에서 룰 결과를 미리 보여주고, "더 정확한 추천" 버튼으로 AI 호출

**파일 작업 예상 분량**
- 신규: `api/agents/fridge-section-agent/route.ts` (~80줄), `lib/aiQuota.ts`에 `fridgeSection` 추가
- 수정: `TextImportConfirmStep.tsx` (등록 시 추천 호출), `FridgeView.tsx` (추천 사유 툴팁)

### 🟡 우선순위 2 — 자유 등록 폼에도 fridgeSection 노출

현재 빠른 추가·재구매·제철은 자동 매핑되지만, `TextImportConfirmStep`/`+ 직접 등록`은 아직 fridgeSection을 안 받음.
- 등록 확인 화면에 "보관 위치" 드롭다운 (모델의 cells 목록)
- 기본값은 `recommendFridgeSection` 결과
- SwipeFoodCard 편집 모드에 보관 위치 변경 추가

### 🟡 우선순위 3 — 모델별 fridgeSection 마이그레이션

사용자가 마이페이지에서 모델을 변경하면 (예: 양문형 → 김치냉장고), 기존 식품의 `fridgeSection`이 새 모델에 없을 수 있음.
- 현재는 렌더 타임에 fallback (FridgeView 폴백 로직)
- 더 친절하게: 모델 변경 시 confirm 모달 + 자동 재매핑
  "기존 데이터를 새 모델 기준으로 정리할까요? (취소 가능)"

### 🟢 우선순위 4 — `weekly-stats` 앵커 자동 스크롤

`/mypage?tab=overview#weekly-stats`로 진입 시 탭은 전환되지만 해시 스크롤이 자동으로 발동하지 않음 (탭 전환 후 DOM 변경).
- 탭 전환 후 `requestAnimationFrame` + `scrollIntoView` 해시 처리

### ⏸ 외부 결정 필요 (사용자 입력)

| 항목 | 막힌 이유 |
|------|---------|
| **커스텀 도메인** | nemoa.kr 등 구입 + Vercel 연결 — 결제 계정 |
| **Waitlist endpoint** | Google Forms / Tally / Formspree — 사용자 선택 |
| **Vercel 알람 임계값** | 대시보드 직접 설정 |
| **iOS 앱스토어** | Apple Developer Program $99/년 |
| **Android 앱스토어** | Play Console $25 일회성 |
| **PWA 래핑** | PWA Builder vs Capacitor 결정 |

---

## 📊 코드 메트릭 (현재 시점)

| 항목 | 수치 |
|------|------|
| 빌드 | 19 라우트 (0 에러) |
| 테스트 | 57/57 |
| 신규 라인 (이번 세션) | ~1,500 (구현 + 테스트) |
| 마이페이지 섹션 | 4 그룹 탭 + 9개 항상 노출 |
| 냉장고 모델 | 4종 |
| 칸 종류 | 13개 |
| 카테고리 fallback 이미지 | 24개 (Food 11 + Fashion 13) |

### 정량 검증 (마지막)

| 항목 | 결과 |
|------|------|
| typecheck | 0 (사전 .mts 패턴 4건만, 신규 코드 0) |
| tests | 57/57 ✓ |
| lint | 26 (사전 동일, 신규 0) |
| build | 0 에러, 19 라우트 |

---

## 🔑 환경변수 현황 (변경 없음)

이번 세션에서 신규 환경변수 없음. v1.5 상태 유지.

```
✓ GEMINI_API_KEY
✓ ADMIN_API_TOKEN
✓ NEXT_PUBLIC_SITE_URL
✓ KV_REST_API_URL/TOKEN/...
⏳ NEXT_PUBLIC_PAYMENT_PROVIDER (Pro)
⏳ TOSS_SECRET_KEY (Pro)
⏳ NEXT_PUBLIC_TOSS_CLIENT_KEY (Pro)
⏳ BLOB_READ_WRITE_TOKEN (이미지 업로드)
⏳ NEXT_PUBLIC_WAITLIST_ENDPOINT (Pro 사전 등록)
```

---

## 🌿 Git 상태

- 작업 브랜치: `claude/optimistic-pascal-b26910`
- 베이스: `main` + `claude/nice-herschel-15a353` 작업 fast-forward 머지
- 이번 세션 커밋: 7개 (`8280d3c` … `608db8d`)
- main 머지 여부: **아직 PR 미생성** — 다음 세션에서 PR 작성 또는 직접 main 머지 결정 필요

---

## 🎯 다음 세션 권장 시작점

1. 🔥 **Phase 8.0 Step 5** — AI 보관 위치 에이전트 (남은 작업 우선순위 1)
2. 🟡 **자유 등록 폼 fridgeSection 노출** — 우선순위 2
3. 🟢 **PR 생성 + main 머지** — 그 다음 배포

---

**문서 끝.** 다음 채팅에서 이 파일 위치(`docs/HANDOFF.md`) 알려주시면 바로 이어가겠습니다.
