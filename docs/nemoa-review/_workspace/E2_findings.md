# E2 (이현석 / 20년차 프론트엔드·풀스택) — 2026-10-03 저녁 회차

- 대상: https://nemoa.vercel.app (main `e785def` 기준 소스 대조) + 라이브 CSS 번들 `/_next/static/chunks/0azx02c-.9_um.css` 실측
- 방법: 검토단 C1·C4·C8 finding을 받아 원인 코드를 직접 읽고 확정. ③은 라이브 CSS(루트 `font-size:112.5%`=18px, `.touch-target-44:after{inset:-9px}` 배포 확인)로 UrgentAlert·NotificationOffBanner DOM을 그대로 재현해 격리 Chromium(375x812, 터치)에서 `elementFromPoint`로 히트 테스트.
- 동의 화면(ConsentGate)은 승인 대기 사안이라 라이브 앱 안에서 데이터 조작 재현은 하지 않았다. ①②④는 C4·C8의 라이브 재현과 코드 경로가 정확히 일치한다.

## 이전 E2 항목 중 코드로 해소 확인
| 이전 지적 | 상태 |
|---|---|
| P0-33 회귀 (구매일 수정 시 확정 유통기한 파괴) | 완료 — `expiryDate` 절대값 저장, `expiryDateStr()`가 우선 사용 |
| 구매일 빈값 → 1900-01-01 | 완료 — TextImportModal `if (v)`, SwipeFoodCard onBlur `if (v && …)` 가드 |
| LLM 임시 id(p1, p2) 영속화 | 완료 — vision-parser `crypto.randomUUID()` 재발급 |
| 냉장고 요약 카드 탭별 불일치 | 완료 — P2-42 FoodSummaryStats 단일화 |

---

## 발견

- persona: E2
  screen: 등록 시트 > 결과 확인 > 편집(유통기한) · 냉장고 카드 > 정보 수정(유통기한) — 요청 ①
  observed: C4 재현 — 구매일 10/03, 유통기한 10/03 입력 시 등록 시트는 말없이 이전 값으로 돌아가고 저장 결과 "D-10 · 10/13쯤까지". 카드 편집에서는 토스트 "유통기한이 구매일보다 앞설 수 없어요." 후 D-10 유지. 코드 확인 결과 두 곳 모두 같은 가드가 있다.
    `src/components/TextImportModal.tsx:470-471` → `const days = daysBetween(localMidnight(item.purchaseDate), localMidnight(v)); if (days < 1) return;`
    `src/components/fridge/SwipeFoodCard.tsx:369-370` → `if (days < 1) { showToast('유통기한이 구매일보다 앞설 수 없어요.'); return; }`
    같은 날짜면 `days === 0`이라 거부된다. 그런데 두 input 모두 `min={item.purchaseDate}`라서 날짜 선택기는 같은 날짜를 허용한다. UI 제약과 로직 가드가 서로 다르다.
  problem: 신뢰 훼손. 마감할인 상품처럼 "오늘까지" 식품을 입력할 방법이 없다. 거부된 값은 추정값(D-10)으로 조용히 남아 저장된다. 아이 음식에 열흘 뒤 날짜가 붙는 셈이라 앱의 존재 이유인 "정확한 기한"이 깨진다. 거부 경로 두 곳도 각각 문제가 있다. (a) TextImportModal은 제어 input이 `return`되며 이전 값으로 튕기고 피드백이 없다. (b) SwipeFoodCard는 비제어 input(`defaultValue`)이라 거부 뒤에도 칸에는 10/03이 그대로 보이고, 카드 앞면만 D-10이다. 한 카드 안에서 두 날짜가 동시에 보인다. 토스트 문구도 틀렸다. 같은 날짜는 "앞선" 게 아니다.
  priority_guess: P0
  cause: P0-33(커밋 98cc4c7)에서 예전 "보관 기한(일)" 숫자칸의 `min=1` 제약을 날짜 입력으로 옮기면서 그대로 가져왔다. 의미가 "보관 일수 ≥ 1"에서 "만료일 ≥ 구매일"로 바뀌었는데 경계값을 다시 검토하지 않았다. 다운스트림에서는 `baseShelfLifeDays=0`을 막을 이유가 없다. `calcRemainingDays`는 `expiryDate`를 우선 쓰고, 0으로 나누는 소비처도 없다(grep 확인). 그리고 이 판정이 두 컴포넌트에 복붙돼 있어 한쪽만 고칠 위험이 있다.
  fix: (1) `src/lib/dateMath.ts`에 `validateExpiryInput(purchaseDate, expiryDate): { ok: true; days } | { ok: false; reason: 'before-purchase' | 'invalid' }`를 만들고 `days < 0`일 때만 거부한다. 두 컴포넌트가 이 함수만 호출하게 바꾼다. (2) 거부 시 TextImportModal에도 인라인 에러 문구를 띄운다. SwipeFoodCard는 `e.currentTarget.value = expiryDateStr(item)`로 칸을 원복하거나 제어 input으로 바꾼다. (3) 토스트를 "유통기한은 구매일과 같거나 이후여야 해요"로 바꾼다. (4) `tests/`에 node:test 경계 케이스를 추가한다(같은 날 → ok/days 0, 하루 전 → 거부, 빈값 → invalid). 같은 날 입력 시 D-0으로 표시되고 UrgentAlert에서 "오늘까지"로 잡히는지 확인한다.
  effort: S

- persona: E2
  screen: 등록 시트 > "누구 것으로 등록할까요?" > + 가족 추가 ↔ 마이페이지 > 프로필 관리 — 요청 ②
  observed: C4 재현 — 마이페이지에서 3/3 도달 후 추가 버튼이 사라졌는데, 등록 시트 인라인 폼에서는 4번째가 추가되고 마이페이지에 "4/3명"으로 나온다. 코드 확인 결과 한도 판정이 화면 컴포넌트에만 있다.
    `src/components/settings/ProfilesSection.tsx:547` → `const atFreeLimit = isFree && profiles.length >= FREE_PROFILE_LIMIT;` (handleAdd 가드는 551-554행)
    `src/lib/profile.ts:122-132` → `add()`는 무조건 `store.setState(prev => [...prev, p])`
    `src/components/TextImportModal.tsx:712-715`("+ 가족 추가" 칩은 항상 노출), `:748` → `const created = addProfile(trimmed, newFamilyRelation);` 이 파일은 `usePlan`을 import하지만(10행) StepConfirm에서 `isFree`를 쓰지 않는다.
  problem: 신뢰 훼손. 요금제 규칙(무료 3명)이 진입점에 따라 다르게 집행된다. "4/3명"은 버그라는 사실을 사용자에게 그대로 보여주는 표시다. 사용자는 "나중에 막내 데이터가 막히거나 지워지나?"를 걱정하게 된다(C4). 유료화 단계에서 한도를 뒤늦게 막으면 이미 초과한 사용자를 어떻게 다룰지 정책 부채가 생긴다. P1-72① 커밋의 검증 시나리오가 "프로필 1명 상태"만 확인해서 한도 경계를 테스트하지 않았다.
  priority_guess: P0
  cause: 비즈니스 규칙(플랜별 프로필 상한)을 도메인 계층(`useProfiles().add`)이 아니라 첫 소비 화면(ProfilesSection)의 UI 가드로 구현했다. 그래서 두 번째 진입점이 생기는 순간 규칙이 우회된다. 정책이 데이터 계층에 없는 구조적 문제다.
  fix: (1) `src/lib/profile.ts`에 `canAddProfile(count, tier)`를 만들고, `add()`가 tier를 받아 `{ ok: false, reason: 'free-limit' }`을 반환하게 시그니처를 바꾼다. 상한 판정은 이 한 곳에서만 한다. ProfilesSection과 TextImportModal 둘 다 결과를 분기 처리한다. (2) TextImportModal은 한도에 닿으면 "+ 가족 추가" 칩을 "+ 가족 추가 (무료 3명까지)"로 비활성 표시하고, 탭하면 ProfilesSection과 같은 업그레이드 시트를 연다. (3) 이미 초과한 사용자는 데이터를 지우거나 막지 않는다. "무료 한도(3명)를 넘었어요 — 기존 프로필은 그대로 유지돼요"를 1회 안내하고 추가만 막는다. ProfilesSection의 `{n}/{3}명`은 초과 시 `n명 (무료 3명)` 형태로 렌더해 "4/3"을 없앤다. (4) Supabase 동기화(Phase B) 때 profiles 테이블에 같은 상한을 RLS/트리거로 이중화한다. (5) 업그레이드 시트 혜택 목록에 가족 프로필 항목이 없는 것은 E1 영역과 연계가 필요하다.
  effort: S (1~3) / M (4 포함)

- persona: E2
  screen: 홈 > 오늘 할 일 > UrgentAlert · SeasonChangeAlert · RebuyAlert · NotificationOffBanner — 요청 ③
  observed: 라이브 CSS로 격리 재현(375px, 루트 18px). UrgentAlert의 ✕ 버튼은 (317,54) 27x27이다. `::after inset:-9px` 히트존은 (308~353, 45~90)으로, 같은 카드의 › 아이콘 (320,76) 14x14를 전부 덮는다. `elementFromPoint(›중심)` 결과는 ✕ 버튼이다. C8이 좌표 탭으로 "›를 눌렀는데 배너가 하루 숨겨짐"을 실제 재현했다. 히트존 확장 이전에도 ✕ 본체(54~81)와 ›(76~90)는 5px 겹쳐 있었다. NotificationOffBanner에서는 같은 히트존이 "켜기" 버튼(283,168 50x31)의 상단 21%를 덮는다. 중심 탭은 "켜기"로 가지만 상단을 누르면 알림을 켜는 대신 안내가 하루 숨겨진다.
    원인 위치: `src/app/globals.css:176-180` `.touch-target-44::after{position:absolute;inset:-9px}`. 사용처는 `UrgentAlert.tsx:83`, `SeasonChangeAlert.tsx:113`, `RebuyAlert.tsx:91`, `NotificationOffBanner.tsx:91`이고, 4곳 모두 `absolute top-2 right-2` ✕가 카드 오른쪽 세로 중앙의 다른 타깃(›, 또는 "켜기")과 같은 열에 있다.
  problem: 오늘 넣은 접근성 수정이 정반대 결과를 냈다. 가장 급한 알림(임박 식품)으로 들어가려던 탭이 그 알림을 하루 숨긴다. 되돌리기 토스트가 있지만 8초짜리이고 대비가 낮아(아래 별도 항목) 복구 경로로 기능하지 못한다. WCAG 2.5.8은 타깃 간 간격을 요구한다. 히트존만 키우고 이웃 타깃을 덮는 것은 2.5.5를 맞추면서 2.5.8을 깨는 것이다. 알림 꺼짐 배너에서는 알림 켜기 전환율을 직접 깎는다.
  priority_guess: P1
  cause: 히트존을 "버튼 단위"로만 키우고 "카드 단위 타깃 배치"는 보지 않았다. 레이아웃 원래 구조가 [아이콘][본문 pr-6][› 또는 켜기] 위에 ✕를 absolute로 덮어 띄우는 방식이라, 오른쪽 열에 타깃 두 개가 세로로 붙어 있다. 그 상태에서 대칭 inset으로 확장하니 겹침이 생길 수밖에 없다. globals.css 주석이 position 충돌은 경고하지만 이웃 타깃 겹침에 대한 가드나 검증은 없다.
  fix: (1) 오른쪽 열을 재배치한다. 카드 전체가 Link라 ›는 중복 어포던스이므로 4개 배너에서 ›를 제거한다(E3와 연계). 대안은 ✕를 카드 밖 우상단 독립 44x44 셀로 빼고 ›는 본문 줄 끝으로 옮기는 것이다. (2) NotificationOffBanner는 "켜기"와 ✕가 같은 열에 있으면 안 된다. ✕를 제목 줄 오른쪽 끝(`flex items-start` 상단 행)으로 옮기고 "켜기"를 본문 아래 줄로 내리거나, 카드 레이아웃을 `grid-cols-[auto_1fr_auto]` + 상단 행 ✕로 바꾼다. (3) 당장 막는 핫픽스로는 4곳의 확장을 비대칭으로 한다(`inset: -9px -9px 0 -9px`, 아래쪽 확장 제거). › 중심(y 83)이 ✕ 하단(81)보다 아래라 히트가 Link로 돌아간다. 다만 ✕ 본체와의 5px 겹침은 남으므로 (1)이 근본 해결이다. (4) 회귀 방지로 Playwright 스모크를 추가한다. 홈 배너마다 `elementFromPoint(›/켜기 중심과 네 모서리)`가 자기 자신을 반환하는지 검사한다(스크래치패드에서 쓴 측정 스크립트를 그대로 테스트로 옮길 수 있다).
  effort: S

- persona: E2
  screen: (전역) 되돌리기 토스트 — ③의 복구 경로
  observed: `src/context/ToastContext.tsx:61,66` — 토스트 배경 `bg-gray-900`(#111827) 위에 되돌리기 글자 `text-brand-primary`(#4F46E5) + `bg-white/10`이다. 계산한 대비는 약 2.6~2.8:1이다(C8 실측 약 2.2:1). 노출 시간은 8초(27행).
  problem: 오탭(③), 실수로 누른 "다 먹었어요", 배너 숨김의 유일한 복구 수단이 앱에서 가장 안 보이는 버튼이다. 4.5:1에 미달한다. 저시력 사용자(C8)는 되돌리기가 있다는 사실 자체를 놓친다.
  priority_guess: P1
  cause: 브랜드 컬러를 다크 표면 위 텍스트에 그대로 썼다. 다크 표면용 브랜드 토큰(밝은 변형)이 없다.
  fix: 토스트 액션을 `text-indigo-300`(#A5B4FC, gray-900 대비 약 9:1) 또는 흰 글자에 `bg-white/20` + 밑줄로 바꾼다. `--brand-primary-on-dark` 토큰을 만들어 다크 표면 텍스트에는 그것만 쓰게 한다. 되돌리기 토스트에는 진행 바를 넣고, 탭하면 멈추게 한다(E3와 연계).
  effort: S

- persona: E2
  screen: 홈 히어로("오늘 한 마디") · NotificationOffBanner · 웹 알림 — 요청 ④ (P0-53 재발)
  observed: 유통기한 내일(D-1) 품목 1개로 C4·C8 모두 같은 화면에서 재현 — 히어로 "서울우유 1L가 오늘 내로 소비가 필요해요." / "제주 감귤 주스, 오늘까지 드세요.", 알림 꺼짐 배너 "오늘 임박 식품 1개를 못 알려드려요.", UrgentAlert "내일까지 먹어야 할 식품 1개", 카드 "D-1 · 1일 남음". 코드상 `classifyExpiry()==='today'` 버킷(dDay 0과 1 모두)을 받아 "오늘" 문구를 고정 출력하는 곳이 4군데 남아 있다.
    `src/lib/dailyMessage.ts:72-74` 버킷 필터 → `:86` `` `${f.name}, 오늘까지 드세요. …` `` (제철+임박 분기)
    `src/lib/dailyMessage.ts:98` `` `… 오늘 내로 소비가 필요해요. …` ``
    `src/components/home/NotificationOffBanner.tsx:45,78` `selectExpiring(items).today.length` → "오늘 임박 식품 {n}개"
    `src/lib/notificationScheduler.ts:75,81` 웹 알림 제목 `` `⏰ 오늘 소비해야 할 식품 ${n}개` ``
    올바르게 처리한 곳은 `UrgentAlert.tsx:35-36`(maxDay로 오늘까지/내일까지/오늘·내일 분기)뿐이다. `expiryThresholds.ts:46-60`의 `expiryLabel(dDay)` 주석이 "EXPIRY_LABEL.today를 직접 사용자 문장에 쓰지 않는다"고 경고하지만, 위 4곳은 상수가 아니라 리터럴 "오늘"을 써서 이 규칙을 우회한다.
  problem: 신뢰 훼손. 한 화면 안에서 같은 품목이 "오늘 내로"와 "내일까지"로 동시에 나온다. 가장 크게 보이는 히어로가 틀린 쪽이다. P0-53은 UrgentAlert 한 곳만 고쳤고 같은 패턴의 다른 소비처를 전수 조사하지 않아 재발했다(3번째 회차). 웹 알림 제목도 D-1을 "오늘 소비해야"라고 말한다.
  priority_guess: P0
  cause: 버킷 이름이 의미와 다르다. `classifyExpiry`의 `'today'`는 실제로는 "오늘 또는 내일(dDay ≤ 1)"인데 이름이 "today"라서, 소비처가 버킷명을 그대로 문구로 옮긴다. 집합 문구를 만드는 함수(UrgentAlert의 maxDay 분기)가 컴포넌트 안에 지역 구현돼 있어 재사용되지 않는다. ESLint 룰(`no-restricted-imports`)은 `calcRemainingDays` import만 막고, 문구 생성은 통제하지 않는다.
  fix: (1) `src/lib/expiryThresholds.ts`에 집합 문구 함수 `groupExpiryPhrase(dDays: number[]): '오늘까지' | '내일까지' | '오늘·내일'`을 만들고 UrgentAlert 35-36행 로직을 이리로 옮긴다. 4곳 모두 이 함수로 문장을 만든다. 예: 히어로 `` `${name}, ${phrase} 드세요` ``, 배너 `` `${phrase} 먹어야 할 식품 ${n}개를 못 알려드려요` ``, 알림 `` `⏰ ${phrase} 먹어야 할 식품 ${n}개` ``. 단일 품목은 기존 `expiryLabel(dDay)`를 쓴다. (2) 재발의 근본을 막도록 버킷을 `'today'` → `'imminent'`(또는 `'dueBy1'`)로 이름을 바꾼다. 리네임하면 모든 소비처가 컴파일 에러로 드러나 전수 조사가 강제된다. `ExpirySelection.today`도 `imminent`로 바꾼다. (3) `tests/`에 회귀 테스트를 추가한다. D-1 품목 1개로 `pickDailyMessage()` 결과 text에 "오늘"이 없는지, 웹 알림 제목 생성 함수(순수 함수로 분리)가 "내일까지"를 내는지 확인한다. (4) 선택적으로 ESLint `no-restricted-syntax`로 `src/` 안의 `/오늘\s*(까지|내로|소비|임박)/` 리터럴을 expiryThresholds.ts 밖에서 금지한다.
  effort: S (1·3) / M (2 리네임 포함)

- persona: E2
  screen: (Android 1.0.1 네이티브) 기기 로컬 유통기한 알림 — ④와 같은 계열, 신규
  observed: `src/lib/native/localNotifications.ts:80-92`
    - `if (bucket !== 'today' && bucket !== 'soon') return null; // 임박 창 밖 — 나중에 재계산됨` → 예약 시점에 D-4 이상인 품목은 예약 자체를 하지 않는다. "재계산"은 `NotificationScheduler.tsx:33-41`의 effect에서만 일어나고, 그 effect는 품목 데이터가 바뀌거나(key=`id:purchaseDate:baseShelfLifeDays`) 앱이 다시 마운트될 때만 돈다.
    - `fireAt = 오늘 + max(dDay-1, 0)일 09:00`인데 본문은 예약 시점의 dDay로 고정된다(`` `D-${dDay} — 오늘 안에 확인해보세요.` ``). D-3 품목은 2일 뒤(실제 D-1)에 "D-3"이라고 울린다.
    - `title: dDay <= 0 ? '… 보관 기한이 지났어요'` → D-0(오늘까지) 품목에 "지났어요"라고 보낸다.
  problem: 신뢰 훼손. 네이티브 알림의 존재 이유는 "앱을 안 열어도 알려준다"인데, 10일짜리 우유를 넣고 앱을 안 열면 알림이 영원히 오지 않는다. 앱을 열지 않은 채 울린 알림은 남은 일수가 틀린 채로 오고, 당일 품목에는 이미 지났다고 말한다. 웹 쪽의 ④와 같은 계열이지만 OS 알림이라 사용자가 앱 안 화면과 대조하기도 어렵다.
  priority_guess: P0
  cause: 알림 예약을 "현재 dDay 스냅샷" 기준으로 설계했다. 예약은 미래 시점에 울리는데, 문구와 대상 선정은 예약 시점 상태로 고정된다. 재예약 트리거가 날짜 변경을 포함하지 않는다.
  fix: (1) 상대값이 아니라 절대 만료일 기준으로 모든 식품을 예약한다. `expiry = localMidnight(expiryDateStr(item))`, 알림 A는 `expiry-1일 09:00`에 "내일까지예요", 알림 B는 `expiry 당일 09:00`에 "오늘까지예요". 이미 지난 시각은 건너뛴다. 본문 문구를 "울리는 날 기준"으로 고정하면 스냅샷 문제가 사라진다. (2) "지났어요"는 dDay < 0에만 쓴다. (3) Android 예약 상한(앱당 약 500건)을 고려해 가장 가까운 N건(예: 60)만 예약하고, 앱 resume(`App.addListener('appStateChange')`) 시 재예약한다. (4) `NotificationScheduler` key에 `expiryDate`를 포함한다(현재는 baseShelfLifeDays 동반 변경에 우연히 기대고 있다).
  effort: M

- persona: E2
  screen: 냉장고 > 🍽️음식 탭 격자 보기 · 목록 카드 · 등록폼 배지 (C8 "같은 D-2가 화면마다 다른 색"의 코드 원인)
  observed: 임박 판정과 색 체계가 3개 이상 공존한다.
    `src/app/fridge/page.tsx:675-678, 699-702` (격자 2벌 복붙) → `item.dDay <= 3 &&` 배지, `item.dDay <= 0 ? 'D-day' : …`, 색 `<=0 red-500 / 나머지 orange-400` + `text-[10px] text-white`. **기한이 5일 지난 품목도 격자에서는 "D-day"로 표시된다**(목록은 "기한 초과").
    `src/components/fridge/SwipeFoodCard.tsx:58` `isUrgent = dDay <= 3` → 날짜 텍스트 `#DC2626`(빨강). 같은 카드의 진행바는 `:72` `classifyExpiry`(today→warning, soon→amber)를 쓴다. 그래서 D-2가 글자는 빨강, 막대는 노랑으로 나온다.
    `src/components/FoodTags.tsx:30-35` `getStatus`는 또 다른 경계(urgent ≤2, warning ≤5)를 쓴다. 현재 import하는 곳이 없는 죽은 컴포넌트지만, ESLint 예외 경로(calcRemainingDays 정의 파일)라 재사용되면 4번째 체계가 된다.
  problem: 신뢰 훼손(기한 지난 음식을 "D-day"로 표시하는 것은 P0-30 계열 재발). 색으로 급한 정도를 판단하는 사용자(C8)가 화면마다 다른 신호를 받는다. 격자 배지는 10px 흰 글자 + orange-400이라 대비 약 2.8:1이다.
  priority_guess: P0 (격자 "D-day" 오표시) / P1 (색 체계 불일치)
  cause: P1-76 "D배지 classifyExpiry 통일"이 등록폼과 진행바만 바꿨다. 격자·목록 텍스트는 하드코딩 경계(`<= 3`, `<= 0`)를 그대로 둔 채 남았다. 판정(`classifyExpiry`)은 단일화했지만 판정 → 표현(색·라벨) 매핑은 단일화하지 않아, 컴포넌트마다 다시 매핑한다.
  fix: (1) `src/lib/expiryThresholds.ts`에 `EXPIRY_TONE: Record<ExpiryBucket, { text; bg; badge; bar }>`과 `expiryBadgeText(dDay)`(= `expiryLabel` 축약형: 기한 초과 / D-day / D-n)를 둔다. 격자·목록·등록폼·진행바가 모두 이것만 쓴다. (2) fridge/page.tsx 격자 카드 2벌을 `CompactFoodTile` 컴포넌트 하나로 추출한다(지금 복붙이라 한쪽만 고칠 위험이 있다). (3) `FoodTags.tsx`의 기본 export와 `getStatus`/`STATUS_BADGE`를 삭제하고, `calcRemainingDays`는 dateMath로 옮긴다. (4) ESLint `no-restricted-syntax`로 `dDay <= <숫자>`/`dDay < <숫자>` 비교를 expiryThresholds.ts 밖에서 금지한다(③④와 같은 "규칙을 데이터 계층에" 원칙). 격자 배지 대비는 E3와 연계한다.
  effort: S (격자 D-day 오표시) / M (톤 매핑 단일화)

- persona: E2
  screen: (웹) 유통기한 알림 — `scheduleExpiryNotification`
  observed: `src/lib/notificationScheduler.ts:69-77` — `CHECKED_KEY`(오늘 날짜)를 **권한 확인과 대상 판정 이전에** 먼저 기록한다. 그날 처음 앱을 열었을 때 임박 품목이 0개였거나 권한이 아직 없었다면, 같은 날 나중에 임박 품목을 등록하거나 알림을 켜도 그날은 다시 검사하지 않는다. 호출도 `NotificationScheduler.tsx` 마운트 시 3초 뒤 1회뿐이다(웹은 OS 예약이 없어 앱이 열려 있을 때만 의미가 있다).
  problem: C4처럼 퇴근 후 장 본 걸 등록하고 "알림 켜기"를 누른 사용자는 그날 아무 알림도 받지 못한다. 설정에서 켠 직후에도 안 오니 "알림이 고장 났다"로 인식된다.
  priority_guess: P2
  cause: 하루 1회 throttle 플래그를 "검사 시도"에 걸었다. "발송 성공"에 걸어야 한다.
  fix: `CHECKED_KEY`를 실제 `showNotification` 성공 후에만 기록한다. 알림 설정에서 켰을 때(`NotificationSettings.tsx:79` 경로)와 품목이 추가됐을 때도 `scheduleExpiryNotification`을 다시 호출한다. 웹 알림이 "앱이 열려 있을 때만" 온다는 점은 설정 화면에 1줄로 고지한다(iOS PWA 제약 포함, E1 연계).
  effort: S
