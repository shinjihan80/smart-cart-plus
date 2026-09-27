# E1 (김태원 / 20년차 서비스 기획자) — 2026-09-27 재검토

대상: https://nemoa.vercel.app · 375x812 · 샘플 41건 · 소스 대조 `src/`
이전 산출물 없음 — 이번이 E1 초판.

## 발견

- screen: 홈 > 두 번째 섹션 "오늘의 나" (`page.tsx:181`)
  observed: `<SectionHeader title="오늘의 나" actionHref="/fridge" actionLabel="전체 레시피">` 아래 카드 4장(제철식탁/오늘 한 그릇/오늘 코디/저장된 코디). "전체 레시피 >" href는 `/fridge`인데 `/fridge?tab=suggest`를 직접 열어도 냉장고 페이지는 탭 딥링크를 무시(아래 F2)해 레시피 탭에 못 감.
  problem: 제목(사람 "나")·액션(레시피)·내용(음식+옷+날씨) 3요소가 서로 다른 것을 가리켜, C9가 5초 안에 이해 못 한 건 어휘가 아니라 구조적 계약 위반. 액션이 약속한 "전체 레시피"도 실제로 안 열림.
  cause: 3존 재편성이 기존 "오늘 추천"+제철 힌트 두 섹션을 물리적으로 합치며 제목만 새로 붙였고, 카드 4장 중 1장의 액션이 섹션 전체 액션으로 잘못 승격됨. `SectionHeader`가 actionLabel↔actionHref의 "섹션 전체 대표" 원칙을 코드/문서 어디에도 강제하지 않음.
  fix: (1) 섹션명을 행동 기준으로 교체(C9 제안 "오늘 뭐 먹고 뭐 입지" 또는 "오늘의 추천"). (2) 섹션 액션 제거, 카드별 액션으로 하향(제철→`/seasonal`, 오늘 한 그릇→`/fridge?tab=suggest`, 코디→`/closet?tab=outfit`). (3) `SectionHeader` JSDoc에 "actionLabel은 섹션 전체 범위" 규칙 명시.
  effort: S(1·2) / M(3, F2 선행 필요)
  priority_guess: P1

- screen: 홈 전역 → `/fridge` 진입점 (`fridge/page.tsx:103`)
  observed: 홈 한 화면에서 `/fridge`(무파라미터)로 가는 링크 6개(히어로 CTA/오늘 할 일 액션/임박 카드/그리드 냉장고 타일/그리드 레시피 타일/전체 레시피/제철식탁 카드). `dailyMessage.ts` CTA 라벨 5종("레시피 찾기"/"제철 보기"/"레시피 열기"/"냉장고 확인"/"냉장고 열기") 전부 href는 `/fridge`. 냉장고 페이지는 `useState<FridgeTab>`만 쓰고 `searchParams` 미반영 — `/fridge?tab=suggest` 무시 확인. `/closet?tab=outfit`, `/mypage?tab=shopping`은 정상.
  problem: 라벨 5종이 서로 다른 목적지를 약속하지만 실제 착지점은 1개(항상 칸 그리드). 그리드 "레시피" 타일은 "냉장고" 타일과 href가 완전히 같아 8칸 중 1칸 중복.
  cause: 냉장고만 탭 딥링크 미구현(v1.7에서 옷장·마이는 받았는데 냉장고는 빠짐) 상태에서 홈 카피가 먼저 4탭 구조를 전제로 작성됨.
  fix: (1) `fridge/page.tsx`에 closet·mypage와 동일한 `useSearchParams` 탭 동기화 추가. (2) 라벨↔목적지 고정 매핑(레시피=`/fridge?tab=suggest`, 장보기=`/fridge?tab=shopping`, 제철=`/seasonal`, 냉장고=`/fridge`) — `dailyMessage.ts` CTA 14곳 교체. (3) 그리드 "레시피" 타일 href를 `/fridge?tab=suggest`로 변경.
  effort: M
  priority_guess: P1

- screen: 홈 > 오늘 할 일 임박 카드 ↔ 냉장고 음식 탭 ↔ 마이>쇼핑 (라벨 버킷 설계 — C4/C8 "오늘까지" 불일치 근본원인)
  observed: `expiryThresholds.ts` `EXPIRY_TODAY_DAYS=1` → dDay 0과 1이 같은 'today' 버킷. `UrgentAlert.tsx`가 버킷 길이로 "오늘까지 먹어야 할 식품 N개" 고정 출력. 히어로가 유일한 D-0(감귤주스)를 dedup(P1-51)으로 가져가면 남은 2건(D-1×2)이 "오늘까지"로 표시. 같은 품목이 냉장고/쇼핑탭에선 "1일 남음"/"1일 뒤". C4·C8 독립 확인, C8은 P0 판정.
  problem: 신뢰 훼손 — 같은 품목이 화면마다 "오늘까지"와 "1일 남음"으로 동시에 불림.
  cause: `classifyExpiry`가 버킷(집계용 등급)과 라벨(문장)을 한 개념에 묶음(`EXPIRY_LABEL.today='오늘까지'`가 버킷명에 직결). 버킷 폭(오늘+내일)은 타당하나 라벨 정밀도(0일)가 그보다 좁아, 대표 원소(진짜 D-0)가 dedup으로 빠질 때마다 구조적으로 재발. P1-51은 원인이 아니라 폭로자.
  fix (3단, 순서대로):
    (1) 버킷/라벨 분리 — `classifyExpiry`는 유지(배지·개수 단일소스로 잘 작동 중), 화면 문구는 실제 dDay 기반 `expiryLabel(dDay)` 신설(0="오늘까지", 1="내일까지", 2~3="D-n", 그 외="n일 남음"). `EXPIRY_LABEL`을 사용자 문장에 직접 쓰지 않는다는 원칙 확립.
    (2) 집합 문구를 실제 값에서 파생 — `UrgentAlert` 헤드라인을 `max(dDay)===0`이면 "오늘까지 N개", 아니면 "오늘·내일 안에 N개"로. 품목별 라벨 병기("친환경 샐러드 믹스·노르웨이 생연어 — 내일까지")면 C8이 지적한 잘림도 정보손실이 아닌 개수손실로 완화.
    (3) dedup 정책 교정 — 히어로 문장 끝에 "외 N건" 부기, 아래 카드는 남은 집합의 실제 라벨 사용. "히어로 1 + 카드 N"이 산술적으로 닫히게.
    (참고: EXPIRY_TODAY_DAYS 자체를 0으로 낮추지 말 것 — 내일 상할 것이 임박 목록에서 빠져 낭비방지 효과 저하. 고칠 것은 경계값이 아니라 그 경계의 이름.)
  effort: M (`expiryThresholds.ts`+`UrgentAlert.tsx`+`SwipeFoodCard.tsx`+마이>쇼핑, 4개 파일 공용화)
  priority_guess: P1 (신뢰 훼손 명시 — P0 승급 판단 요청)

- screen: 홈 전체 — 임박 정보의 존 배치
  observed: 홈 한 화면에 임박이 5번 등장(히어로1/오늘할일2/그리드배지7/하단탭배지7/둘러보기 "⚠️식품 7개 만료임박"—`WeeklyInsight.tsx:76`). 숫자 자체는 전부 `selectExpiring()` 단일 소스로 **정확**(7=today+soon, 2=dedup후 today, 냉장고 필터칩도 7 일치).
  problem: 숫자는 맞는데 모수가 3종(dedup후today/today/today+soon)인데 라벨에 모수 표기가 없어 "오늘 처리할 게 몇 개"의 답이 1·2·7로 갈림. 더 나쁜 건 배치 — 가장 급한 문장이 가장 한가로운 이름 "둘러보기"에 들어있음(C9: "구경거리인 줄 알고 넘겼다").
  cause: 3존은 시급도 축으로 이름 지었는데 카드 배치는 여전히 기능 축(알림/추천/통계 컴포넌트) — `WeeklyInsight`가 "통계"라는 이유로 둘러보기에 남았고 그 안에 시급 문구가 하드코딩. 재편성이 컨테이너만 바꾸고 내용물 재분류를 안 함.
  fix: (1) `WeeklyInsight.tsx:76`의 "⚠️식품 N개 만료임박" 줄 제거(이미 오늘할일+배지 2곳에 있음), 둘러보기는 "지난 7일 기록"만 담당. (2) 홈에서 임박을 말하는 자리를 2곳(행동유도 1: 오늘 할 일 카드 / 위치표시 1: 배지)으로 고정, 히어로는 F3-(3) "외 N건"으로 카드와 연결. (3) `QuickLinks` 배지에 `aria-label="임박 식품 7개"` + 타일 아래 "냉장고 · 임박 7"로. (4) 존 배치 규칙 주석화: "시급→오늘 할 일 / 제안→오늘의 나 / 기록·회고→둘러보기. 경고 문구는 둘러보기에 두지 않는다."
  effort: S(1·3·4) / M(2, F3와 함께)
  priority_guess: P1

- screen: 등록(FAB) > 상품 정보 등록 시트 > URL 탭 (`TextImportModal.tsx:981`)
  observed: `isPro ? <UrlTab/> : <ProLockedTab feature="URL 분석 (AI)"/>` — `PAYMENTS_ENABLED` 체크 없음. `PAYMENTS_ENABLED=false`인 현재, `ProLockedTab`은 "플랜 업그레이드 →"(`/settings`)를 안내하나 `/settings`의 `ProPreviewCard.tsx`는 "결제 연동 출시 예정"만 제공(해제 경로 없음). 반면 `PlanGate.tsx:22`는 `if (!PAYMENTS_ENABLED) return <>{children}</>`로 같은 상황을 명시적으로 우회(주석 있음).
  problem: 현재 모든 사용자가 free이므로 등록 시트 4탭 중 URL 탭은 100% 잠겨 있고 해제 경로가 없음. 프로젝트 자신이 코드로 문서화한 원칙("결제 연동 전엔 잠금 금지")을 가장 중요한 첫 등록 플로우에서 위반.
  cause: `PAYMENTS_ENABLED` killswitch가 정책이 아니라 `PlanGate` 컴포넌트 내부 옵션으로만 구현돼, 다른 호출부(`usePlan().isPro` 직접 참조)는 이를 우회.
  fix: (1) `usePlan`에 `isProEffective = !PAYMENTS_ENABLED || isPro` 추가, tier 분기 전부 이걸로 통일(최소: 981행 `(!PAYMENTS_ENABLED || isPro)`). (2) 결제 전까지 URL 탭을 탭 목록에서 숨김(4→3칸, 선택부담도 감소). (3) 린트/리뷰 체크로 "isPro 직접 분기 금지" 강제.
  effort: S
  priority_guess: P1
  (재현 메모: 코드 경로는 확정, 라이브 재현은 공유 pane 제약으로 미완 — 단독 세션 1회 육안 확인 권장)

- screen: 알림함(/notifications) ↔ 홈 — 핵심 가치 활성화 퍼널
  observed: 임박 7건(오늘 처리 대상 포함)인데 `/notifications`는 빈 상태+"차단됐어요" 배너, 홈 어디에도 알림 꺼짐 표시 없음(`page.tsx:41-46` 주석대로 벨 점=안읽은알림 기준, 0건이면 미표시). C1·C4·C9 3인 독립 확인.
  problem: 신뢰 훼손 — 알림 꺼진 사용자는 알림함까지 직접 들어가야만 그 사실을 안다. 리텐션 관점에서 단일 최대 누수 지점으로 판단.
  cause: 벨 점 의미 변경(권한꺼짐→안읽은알림) 자체는 옳았으나, 권한꺼짐 신호를 알림함 안쪽으로만 옮겨 도달률이 0에 수렴. "알림 허용"이 활성화 지표로 정의되지 않아 온보딩에서 추적·유도되지 않음.
  fix: (1) 즉시조치 — `selectExpiring(items).today.length>0 && Notification.permission!=='granted'`면 "오늘 할 일" 존 최상단에 조건부 배너("알림이 꺼져 있어 이 건을 못 알려드려요·켜기"), `useDismissedAlerts`로 하루 1회 닫기. (2) 활성화 퍼널 재정의(설치→첫 등록→알림 허용 3단), 첫 등록 직후 맥락 있는 권한 요청. (3) iOS PWA 권한·백그라운드 제약 E2 연계 필요.
  effort: S(1) / M(2)
  priority_guess: P1

- screen: 홈 > 카테고리 8칸 그리드 (`QuickLinks.tsx`)
  observed: 8칸(냉장고·옷장·제철·레시피·쇼핑·활동·프로필·설정) 중 냉장고·옷장은 하단탭 중복, 활동은 하단 "내 정보"와 동일 URL, 레시피는 냉장고와 href 완전 동일, 프로필은 `/settings#profiles`인데 실제 가족 추가 UI 없음(마이>내정보>프로필관리에 있음, C4 확인). C1 실측 첫 화면 탭 가능 요소 20개+.
  problem: 8칸 중 고유 가치는 제철·쇼핑 2칸뿐 — 나머지는 하단탭중복(3)/URL중복(1)/목적지오도(1)/저빈도(1). 3존 재편성으로 순서는 고쳤지만 밀도는 그대로.
  cause: 그리드가 "모든 기능을 한눈에"식 디렉터리 관성으로 설계돼 하단탭과 역할분담 규칙이 없음.
  fix: "하단탭에 없는 것만" 원칙으로 4칸 1행 축소(제철/레시피(`/fridge?tab=suggest`)/쇼핑/활동). 냉장고·옷장 제거, 프로필은 마이로 이관, 설정은 마이 상단 아이콘으로.
  effort: S(그리드 축소) / M(프로필·설정 재배치 포함)
  priority_guess: P2

## 오케스트레이터 참고 (finding 아님)

- **P1-51/52 사후 판정**: 3존 순서·히어로-카드 dedup 모두 의도대로 동작, 회귀 없음. 다만 F1·F4처럼 "컨테이너만 바꾸고 내용물을 재분류하지 않아" 효과가 부분 상쇄 — 후속으로 "카드의 존 소속 재판정"을 P1-52 2단계로 제안.
- **E3와 상충 가능**: F7-(1) "오늘 할 일 최상단 조건부 배너"가 E3의 "경고색·배너 남용" 지적과 부딪칠 수 있음. E1 입장: 조용한 낭비 발생 비용 > 조건부+1일1회 배너 비용. 두 안 병기 권장.
- **숫자 정합성은 정상**: C1이 "임박 개수가 화면마다 다름—미해소"로 적었으나 소스·실측 모두 단일소스(`selectExpiring()`) 7 일치 확인. C1이 본 건 개수 불일치가 아니라 **모수 미표기**(1/2/7의 모수가 각각 다름) — 병합 시 "수치 회귀"가 아니라 "라벨 설계"(F3·F4)로 분류할 것.
- E1_findings.md 이전 파일 없음 — 이번이 초판, 해소 대조 미수행.
- C4가 P0로 제기한 "전역 자동 전환"은 이번 세션에서도 URL이 임의로 `/`로 되돌아가는 형태 관측됐으나, C8과 동일하게 공유 pane 아티팩트로 판단(앱 버그 근거 아님).
