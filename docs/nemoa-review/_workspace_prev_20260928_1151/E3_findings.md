# E3 (박세라 / 20년차 UX·UI 디자이너) — 2026-09-27 밤 재검증

대상: https://nemoa.vercel.app · 375x812, 기본배율, 샘플20건 · 라이브 getComputedStyle/getBoundingClientRect 실측 · 전용 배경 탭(tabId 명시)으로 세션 간섭 없이 진행

## 발견

- screen: 앱 전체 — 소비기한 관련 문자열(8곳)
  observed: `SwipeFoodCard.tsx:128,148,151,232,239,309`, `TextImportModal.tsx:429`, `ShoppingSuggestionsSection.tsx:49`, `NotificationSettings.tsx:84`, `FoodTags.tsx:32`에 각자 다른 템플릿 — "보관 기한"이 날짜와 일수 두 양을 동시에 지칭.
  problem: 용어 문제가 아니라 디자인 렉시콘 자체가 없음. `expiryThresholds.ts`의 `expiryLabel()`(단일소스)이 있는데 채택 안 됨 — 카피를 한 곳 고쳐도(P1-63) 다음 화면에서 다시 갈라짐.
  fix: 3단어 렉시콘 확정 — ①"소비기한"=날짜(~까지, 법정용어와 일치, C9 혼란 해소) ②"N일 남음/오늘까지/내일까지/N일 지남"=`expiryLabel()` 반환값 외 리터럴 금지 ③"보관 가능 기간(일)"=입력값, "보관 기한"을 일수에 쓰지 않음. `expiryThresholds.ts`→`expiryCopy.ts` 확장. 재발방지: 금지어(`기한 종료|보관 기한 임박|보관 일수|D-\$\{`) 스캔 테스트 1개 추가(반나절).
  effort: M
  priority_guess: P1

- screen: 냉장고 > 접힌 카드 — 날짜 6채널 중복 인코딩
  observed: D-0텍스트/빨강색/🗓날짜/오늘까지라벨/진행바길이/진행바색 6채널이 "언제까지"를 반복 — 제품명 clientWidth 105px 고정이라 기본 배율에서도 "친환경 샐러드 믹스"(111px 필요) 잘림. 영양줄도 "· 탄10.5g" 고아 줄바꿈.
  problem: 정보 위계 역전 — P0-52가 날짜 라벨을 추가하며 카드 정보밀도 예산 초과, 이름 소멸 악화.
  fix: 2단 구조로 축약 — 1차(15.75px bold 상태색) "오늘까지"/"내일까지"/"3일 남음", 2차(13.5px gray) "9월 28일(월)". `D-N`·🗓 이모지 삭제. 제목 `text-[15px]`→`text-[0.9375rem]`(확대 시 이름 소멸 P0-51과 동시 해소). 영양줄은 펼침 상세로만.
  effort: S
  priority_guess: P1

- screen: 냉장고 > 장기보관 품목 날짜(P0-52 신규 회귀, E2와 동일 지점 독립 확인)
  observed: 진간장(D-669)·고추장(D-334) 등이 "🗓07/27까지"처럼 연도 없이 표시돼 이미 지난 날짜로 읽힘 — `SwipeFoodCard.tsx:148`의 `slice(5)` 무조건 절삭.
  problem: P0-52로 회복한 "카드 날짜 신뢰"를 같은 줄에서 다시 깨는 자기모순.
  fix: `formatExpiry()` 공용 함수 — 같은 해면 "9월 28일", 다르면 "2027년 7월 27일"(`Intl.DateTimeFormat('ko-KR', {year: sameYear?undefined:'numeric', month:'long', day:'numeric'})`). 추가로 30일 초과 품목은 카운트다운(D-N/N일남음) 자체를 끄고 날짜만 회색으로 — 임박 목록의 시각 소음 제거.
  effort: S
  priority_guess: P1(오케스트레이터 판단: 자기모순 표시라 P0 승급 검토 대상)

- screen: 냉장고 > 카드 신선도 바 — 라이브 실측표
  observed: 감귤주스(D-0)4.0%, 샐러드믹스(D-1)20%, 생연어(D-1)**33.3%**, 고등어(D-2)40%, 통밀식빵/한돈안심(D-2)50%, 서울우유(D-3)**30%·앰버**(D배지는 빨강), 두부(D-4)57.1%·앰버.
  problem: 분모(baseShelfLifeDays)가 품목마다 달라 "남은 비율"로 읽어도 순서가 틀림 — D-3(30%)이 D-1(33.3%)보다 짧게 그려짐. 색(급할수록 진함)과 길이(급할수록 짧음)가 반대 방향. 임계값도 3종 혼재(배지 dDay≤3, 바빨강 ≤2, 바앰버 ≤5)라 서울우유 D-3이 "빨간 숫자 위 앰버 바"로 자기모순 렌더.
  cause: 품목별 정규화 게이지를 목록 비교용 지표 자리에 그대로 사용, 색 임계값이 `classifyExpiry()` 안 거치고 인라인 하드코딩.
  fix: 급함 게이지로 전환 — `fill = Math.max(0, Math.min(1, (7-dDay)/7))` (D-0=100%, D-1=86%, D-7+=0%·바 숨김). 색은 바·배지·텍스트 전부 `classifyExpiry(dDay)` 하나에서 파생. 대안B(권장 병행검토): 접힌 카드에서 바를 아예 빼고 펼침 상세로.
  effort: S
  priority_guess: P1(C1이 P2로 제기했으나 척도 오류로 상향 권고)

- screen: 홈 > 히어로 아이콘(C1·C9 문구-아이콘 불일치 근본원인)
  observed: `HeroMessage.tsx:105-109`의 `HeroIcon`이 `priority` 3값에서만 파생돼 urgent 4종(제철임박/기한초과/오늘소비/비예보)이 전부 같은 AlertTriangle. `globals.css:25`의 `--color-brand-accent`가 `--color-brand-primary`와 동일 색이라 urgent와 insight가 같은 인디고로 렌더 — 지금 유일한 구별 요소가 그 경고 삼각형.
  problem: 아이콘 채널=심각도, 카피=주제라 축이 달라 카피를 다듬어도(P1-63) 아이콘은 계속 어긋남. seasonalExpiring만 예외처리하면 나머지 3종에 같은 버그 잔존.
  fix: `DailyMessage.icon?: LucideIcon` 추가(메시지 생성 지점에서 주제별 지정 — expired→Trash2, expiringToday→Clock, seasonalExpiring→Leaf, 비/눈→CloudRain/Snowflake). `AlertTriangle`은 expired 전용 예약. **색도 같이 고쳐야 함**(안 그러면 urgent=insight 시각적 구별 불가) — `TONE.urgent`를 `--color-caution`으로, expired만 `--color-danger`로. 우상단 워터마크(좌상단 칩과 동일 글리프 반복)는 삭제하거나 브랜드 장식으로.
  effort: S(아이콘) / M(색 포함)
  priority_guess: P1(C9은 P2로 제기했으나 색 구조 문제와 결합돼 있어 상향 권고)

- screen: 앱 전체 — 상태색 토큰 채택률
  observed: `globals.css:33-36`에 3단 토큰(danger/caution/info) 정의돼 있으나 실사용 2회뿐(`mypage/page.tsx:278,280`), `brand-warning`(#EF4444 순빨강)은 66회/20파일. 냉장고 D-3도, 홈 알림도, 결제실패도, 오류로그도 전부 같은 빨강.
  problem: P2-4 설계가 선언만 되고 미채택 — "3일 남음"과 "결제 실패"가 같은 강도로 외쳐 진짜 급한 것(기한초과)이 묻힘. 히어로 카피 순화(P1-63)가 색 시스템 때문에 무력화되는 구조.
  fix: `classifyExpiry()`→색 매핑 함수 하나로 통일(expired→danger, today→caution, soon→caution약, fresh→무채색). 비-소비기한 사용처도 파괴적액션→danger/미백업·한도소진→caution/추천→info로 재분류. `--color-brand-accent`는 primary와 동일해 제거 또는 caution 재바인딩. 실행순서: 냉장고카드+홈알림3종+히어로(~15곳) 먼저, 나머지 점진.
  effort: M
  priority_guess: P1

- screen: 냉장고 > 카드 — 대비(접근성) 실측
  observed: 날짜줄 `#9CA3AF` 13.5px → 흰배경 대비 **2.54:1**. 임박라벨·D배지 `#EF4444` → **3.77:1**. WCAG AA 4.5:1 양쪽 미달(C8 육안 보고 2.6:1/3.7:1과 일치). 제품명(#1F1F2E)은 15.5:1로 또렷 — 위계와 대비가 정반대.
  problem: 카드에서 가장 중요한 정보(언제까지)가 가장 안 보이는 텍스트 — P0-52로 새로 넣은 날짜줄의 수정 효과가 저시력 사용자에게 도달 안 함.
  fix: 보조텍스트 최저단계를 gray-500(4.83:1)로 상향, gray-400 이하는 비텍스트(구분선·아이콘)에만 허용 규칙화. 상태빨강은 텍스트용(#DC2626, 4.83:1)과 배경·바용(#EF4444)을 분리. 위 색토큰 정리와 같은 커밋 권장. 대비비 계산을 단위테스트에 추가해 회귀 방지.
  effort: S
  priority_guess: P1

- screen: 등록 > 직접입력 2단계 폼 — 소비기한 입력 배치안(C1·C4·C8 요청에 대한 답)
  observed: `TextImportModal.tsx:406-455` grid-cols-2에 카테고리/보관방법/보관기한(일)/구매일/보관위치가 균등 배치, 실제 유통기한 입력칸 없음. 카드 편집 폼과 폼 언어 자체도 다름.
  problem: "구매일"과 "보관 기한(일)"이 나란히 같은 크기로 앉아 "어느 쪽이 기한인가" 폼에서부터 모호 — P0-52로 고친 문제의 씨앗이 등록 폼에 남음.
  fix: 병치 금지, 세그먼트 토글("날짜로 입력"✓/"일수로 입력") + 선택된 쪽만 노출되는 단일 입력 + **반대쪽 값 실시간 환산 보조문**("9월27일부터 7일") — 두 입력이 하나의 값의 두 표현임을 시각으로 증명. 기본선택은 "날짜로 입력"(3인 공통 요청). 구매일은 "자세히" 접이식으로 분리. 추정값엔 `예상` 고스트칩(gray-100/gray-500, 경고 아닌 사실표시) + 날짜 톤다운("약 10월4일까지"). 사용자가 고치면 칩 소멸=확인 완료 신호. 데이터모델엔 `expirySource:'user'|'estimated'` 1필드만 추가. **E1의 등록 구조안 확정 후 착수**.
  effort: M
  priority_guess: P1

- screen: 등록 2단계 폼 ↔ 카드 편집 폼 — 컴포넌트 불일치
  observed: 등록(2열/text-[10px]라벨/rounded-lg)과 편집(1열/text-xs라벨/포커스링)이 다른 디자인 언어, 필드 구성도 다름(등록엔 소유자·메모 없음, 편집엔 카테고리·보관방법 없음). 등록 라벨 10px 절대px(확대 비추종, P0-51 동일 메커니즘), 터치타깃 `py-1.5`(~30px, 44px 미달).
  problem: 같은 데이터에 폼 컴포넌트가 둘이라 필드 추가 시 양쪽이 어긋날 위험 — 소비기한 입력 추가가 정확히 그 위험에 놓임.
  fix: 공용 `Field.tsx`+`FoodAttributeFields.tsx` 신설, 등록/편집이 `compact` prop만 다르게 같은 컴포넌트 렌더. 절대px 라벨 전부 제거. **소비기한 입력 추가 직전에** 하는 게 가장 쌈(나중이면 필드를 두 번 만들게 됨).
  effort: M
  priority_guess: P2

## E1/E2 연계
- finding "소비기한 입력 배치안"은 E1의 등록 구조 해법에 종속 — 필수필드·AI추정 정책 확정 후 최종안.
- 절대px(`text-[15px]`,`text-[10px]`)→rem 전환은 E2의 P0-51과 동일 원인, 한 커밋 권장.
- 연도 포맷·문구 단일화는 E2가 만들 공용 포맷 유틸에 얹는 게 맞음.

## 상충 가능 지점
finding 2·4에서 접힌 카드의 정보를 "빼자"(영양줄 제거, 진행바 강등, D-N 삭제)고 제안 — E1이 "임박 판단 근거를 더 보여주자"로 갈 경우 충돌. 근거: 제품명이 기본 배율에서도 잘리는 상태라 카드 밀도 예산이 이미 초과, 무엇을 더할지 논하기 전에 빼는 결정이 선행돼야 함.

## 검토 조건 메모
전용 배경 탭(tabId 명시)으로 세션 간섭 없이 진행. 색·폭·대비는 육안이 아니라 라이브 실측값(getComputedStyle/getBoundingClientRect), 대비비는 WCAG 2.x 공식 직접 계산. 데이터 변경 동작은 클릭 안 함.
