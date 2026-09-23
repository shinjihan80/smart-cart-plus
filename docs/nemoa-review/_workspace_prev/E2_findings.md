# E2 — 이현석 / 20년차 프론트엔드·풀스택 — finding

- 검토 대상: https://nemoa.vercel.app (라이브, 2026-09-17 접속) + 소스 코드 직접 확인
- 범위: 홈 · 냉장고 · 옷장 · 마이 · 등록 · 요금제
- 재현 데이터: `localStorage['nemoa-items']` 22건 (식품 22 / 냉장 14 · 냉동 2 · 실온 6), 오늘 2026-09-17
- 참고 입력: C1 / C4 / C8 / C9 findings
- 이전 산출물: 없음 (최초 기록)

---

- persona: E2 (이현석 / 프론트엔드·풀스택 20년차)
  screen: 냉장고 > 🧊냉장고 탭 · 🍽️음식 탭 요약 카드 ↔ 내 정보 > 요약 > 보관 현황
  observed: 라이브 요약 카드가 `22 전체 / 14 냉장 / 2 냉동 / 8 임박`. 14+2=16 ≠ 22. 실제 저장값은 냉장 14 · 냉동 2 · **실온 6**. 같은 데이터를 내 정보 > 요약은 `❄️냉장 14 · 🧊냉동 2 · 📦실온 6` 3칸으로 정확히 보여준다. 코드: `src/app/fridge/page.tsx:157-158`이 `coldCount`/`frozenCount` 두 개만 손으로 세고 `roomCount`가 아예 없다. `src/components/mypage/StatsSection.tsx:90-92`는 독립적으로 3-bucket을 센다. 심지어 `StorageFilter` 타입(`fridge/page.tsx:39,75`)은 '실온'을 이미 지원하고 persist까지 되는데, 그 값을 만들어내는 진입 버튼이 요약 카드에 없다.
  problem: **신뢰 훼손** — 냉장고 첫 화면의 네 숫자가 자기들끼리 산수가 안 맞는다. 사용자는 "6개가 어디로 샜나"를 물을 수밖에 없고(C8·C9가 그대로 물었다), 한 화면에서 합계가 틀리면 같은 화면의 "임박 8"도 못 믿는다. 구조적 원인은 UI 버그가 아니라 **집계 셀렉터가 화면마다 손으로 복제돼 있다**는 것 — fridge 2칸, mypage 3칸, BottomNav 1칸이 서로를 모른다.
  lens: 화면 간 수치 불일치의 코드적 원인(집계 셀렉터 분리)
  priority_guess: P0
  cause: `storageType` 집계를 공유 셀렉터 없이 화면별 인라인 `.filter().length`로 중복 구현. fridge는 StorageType 3종 중 2종만 하드코딩해 세므로 나머지가 통계에서 증발한다. `FOOD_GROUP` 기반 분류 합계(`foodGroupCounts`, L160-163)는 전체를 다 덮어 22로 맞는데, 바로 위 보관 방법 합계만 안 맞아 불일치가 더 도드라진다.
  fix: `src/lib/foodStats.ts` 신설 — `summarizeFoods(foods: (FoodItem & {dDay:number})[])` 가 `{ total, cold, frozen, room, soon, expired }`를 한 번에 반환. fridge 요약 카드(`page.tsx:381-400`, `465-484`)와 `StatsSection`(`:90-92`), `BottomNav`가 전부 이 함수만 호출하게 교체. 요약 카드는 4칸 → **5칸(전체·냉장·냉동·실온·임박)**, 실온 칸은 `scrollToStorage('실온')`에 연결(타입·persist는 이미 준비돼 있어 추가 작업 없음). 단위 테스트로 `cold+frozen+room === total` 불변식을 고정(`npm test`에 추가).
  effort: S

- persona: E2 (이현석 / 프론트엔드·풀스택 20년차)
  screen: 홈 > 히어로 배너 · "지금 바로" 알림 · 주간 인사이트
  observed: 라이브에서 히어로가 `가을철 "제주 감귤 주스"가 곧 만료예요`, 그 아래가 `오늘까지 먹어야 할 식품 6개 — 친환경 샐러드 믹스, 노르웨이 생연어, 제주 감귤 주스, 통밀 식빵, 국내산 한돈 안심, 고등어 자반`. 실제 dDay를 계산해보면 **제주 감귤 주스 = D-1(이미 하루 지남)**, 샐러드·연어 = D0, 식빵·한돈·자반 = D+1. 같은 항목을 냉장고 카드는 `기한 초과 / 만료됨`으로 표시한다. 코드: `src/lib/dailyMessage.ts:45-47`이 `calcRemainingDays(...) <= 1`, `src/components/home/UrgentAlert.tsx:18`이 `.filter((f) => f.dDay <= 1)`. **둘 다 하한이 없어 음수(=이미 만료)를 포함**하고, 둘 다 `expiryThresholds.ts`의 `EXPIRY_TODAY_DAYS`/`EXPIRY_LABEL`을 import하지 않고 리터럴 `1`을 쓴다. 같은 하드코딩이 `WeeklyInsight.tsx:31`(`<= 3`), `FridgeView.tsx:45`(`dDay <= 3`), `fridge/page.tsx:142,156`(`dDay <= 3`)에도 있다.
  problem: **신뢰 훼손** — 앱이 상한 음식을 "곧 만료니 지금 먹어라"고 홈 최상단에서 권한다. 식품 안전 도메인에서 이건 단순 카피 오류가 아니라 사실과 반대되는 지시다(C4·C8이 "아이한테 먹일 뻔했다" 톤으로 지적). 더해 D+1 항목 3개가 "오늘까지"에 섞여 개수 6도 거짓이다. 시스템 레벨 원인은 **임계값 단일 소스(`src/lib/expiryThresholds.ts`)가 이미 존재하는데 소비처 6곳 중 2곳(BottomNav·QuickLinks)만 쓰고 나머지는 리터럴을 다시 적었다**는 것. 그래서 홈 6 / 인사이트 8 / 탭 배지 8이 동시에 돌아다닌다.
  lens: 화면 간 수치 불일치 / 한국어 문자열·시간대 처리 / 카피↔동작 모순
  priority_guess: P0
  cause: 임계값과 **버킷 구분**이 분리돼 있지 않다. `expiryThresholds.ts`는 상수(SOON=3, TODAY=1)와 라벨(over/today/soon)만 내보내고, "dDay → 어느 버킷인가"를 판정하는 함수가 없다. 그래서 각 소비처가 `<= n` 비교를 직접 쓰게 되고, 아무도 `dDay < 0`(초과)을 today/soon에서 빼야 한다는 걸 표현하지 못한다. `FoodTags.tsx:24-29`의 `getStatus()`가 사실상 그 함수인데 컴포넌트 안에 갇혀 있어 재사용이 안 된다.
  fix: `expiryThresholds.ts`에 `getStatus`를 끌어올려 `export type ExpiryBucket = 'expired'|'today'|'soon'|'fresh'` + `classifyExpiry(dDay): ExpiryBucket` + `bucketCounts(foods)` 추가. `FoodTags.tsx`의 로컬 `getStatus`는 이 함수를 재export하도록 대체. 그 다음 (a) `UrgentAlert`는 `bucket === 'today'`만 담고 라벨을 `오늘까지 먹어야 할 식품 N개` 그대로 유지, (b) `expired`가 1건 이상이면 **별도의 빨간 "기한 지난 식품 N개 — 확인해주세요" 줄**을 위에 띄우고 CTA는 '레시피 찾기'가 아니라 '확인하기'(폐기/소진 처리)로 보낸다, (c) `dailyMessage.ts:45`의 `expiringToday`도 `bucket==='today'`로 바꾸고, `expired` 전용 우선 메시지(`"제주 감귤 주스"는 보관 기한이 지났어요. 상태를 확인해주세요.`)를 seasonalExpiring보다 **앞**에 둔다 — 만료 항목에는 레시피를 절대 권하지 않는다. (d) `WeeklyInsight:31`·`FridgeView:45`·`fridge/page.tsx:142,156`의 리터럴 3을 `EXPIRY_SOON_DAYS`로 교체. lint 규칙(`no-magic-numbers` 대신 간단한 grep 테스트)으로 `dDay <= \d` 리터럴 재발을 막는다.
  effort: M

- persona: E2 (이현석 / 프론트엔드·풀스택 20년차)
  screen: 냉장고 > 🧊냉장고 탭 (칸 그림) — 냉동실 위칸
  observed: 라이브에서 `🧊 1 냉동실 위칸 — 종가집 맛김치`. 저장값은 `{name:'종가집 맛김치', storageType:'냉장', fridgeSection:null, dDay:24}`. 재현 경로를 코드로 추적하면 정확히 이렇다 — `recommendFridgeSection`(`src/lib/fridgeSection.ts:105-108`)이 KEYWORD_OVERRIDES 첫 규칙 `/김치|깍두기|총각|동치미|장아찌/`로 `kimchi_bottom` 반환 → `effectiveFridgeSection`(`:152-159`)이 zone `'kimchi'`로 `resolveSectionForModel` 호출 → `fridgeModel.ts:181` 기본 모델 `side_by_side`에 `kimchi_bottom` 없음 → `:183` FALLBACK_BY_ZONE['kimchi'] = `kimchi_top`도 side_by_side에 없음 → `:185` **최종 폴백 `FRIDGE_MODELS['side_by_side'].cells[0].section` = `freezer_top`**. `one_door`도 cells[0]이 `freezer_top`이라 동일하게 깨진다. 같은 경로로 `four_door`(pantry 셀 없음)에서는 실온 식품 전부가 cells[0] = `main_top`(냉장실 위칸)으로 떨어진다.
  problem: **신뢰 훼손 + 잘못된 도메인 조언** — 앱이 냉장 보관 김치를 냉동실에 넣으라고 그려준다(C8: "주부 22년에 김치를 얼린 적 없다"). 동시에 요약은 그 항목을 '냉장'으로 세므로 그림(냉동 3)과 숫자(냉동 2)가 어긋나 C4가 "둘 다 못 믿겠다"고 했다. 코드에는 이미 `isSectionCompatible(section, storageType)`(`fridgeSection.ts:177-183`)이라는 정합성 검사기가 있는데 **폴백 경로에서 한 번도 호출되지 않는다** — 안전장치를 만들어 놓고 연결을 안 한 형태다.
  lens: 데이터 무결성 / 화면 간 수치 불일치
  priority_guess: P0
  cause: `resolveSectionForModel`의 최종 폴백이 "모델의 첫 셀"이라는 **레이아웃 순서 의존** 값이다. 도메인 의미(이 식품이 얼어도 되는가)와 무관하게 배열 인덱스 0을 집으므로, cells 배열 순서를 바꾸면 추천 결과가 바뀐다. zone 폴백 테이블(`FALLBACK_BY_ZONE`)도 zone→zone 1:1 매핑이라 "kimchi zone이 없는 모델"에 대한 대안(냉장 본체)이 표현돼 있지 않다.
  fix: 세 단계로 고친다. (1) `FALLBACK_BY_ZONE`을 체인으로 바꾼다 — `kimchi: ['kimchi_bottom','kimchi_top','crisper','main_bottom','main_middle']`, `pantry: ['pantry','door_bottom','main_top']`, `freezer: ['freezer_bottom','freezer_top']` 식으로 후보 배열을 두고 모델이 가진 첫 후보를 고른다. (2) 그래도 못 찾으면 `cells[0]`이 아니라 **`isSectionCompatible(cell.section, storageType)`을 통과하는 첫 셀**을 고르도록 `resolveSectionForModel`에 `storageType` 인자를 추가한다(`effectiveFridgeSection`이 이미 item 전체를 받으므로 전달만 하면 된다). (3) `groupByEffectiveSection` 결과에 대해 개발 모드 assert — 한 칸의 아이템 중 `isSectionCompatible`이 false인 게 있으면 `errorLog`에 남긴다. 단위 테스트: 4개 모델 × 13개 섹션 전수로 "반환 칸이 항상 storageType과 호환"임을 검증(`npm test`, 기존 fridgeSection 테스트 파일에 추가). 부수 효과로 four_door의 실온 6건이 냉장실로 떨어지는 문제도 같이 닫힌다.
  effort: M

- persona: E2 (이현석 / 프론트엔드·풀스택 20년차)
  screen: 등록(+) 모달 > 직접입력 > 2단계 "결과 확인 및 수정"
  observed: 직접입력으로 들어가면 안내문이 `네모아가 추출한 목록입니다. 각 카드를 탭하면…`(`src/components/TextImportModal.tsx:592-594`), 그 아래 `💡 사진 영역을 탭하면 이미지를 추가할 수 있어요. 이름 옆 ✕로 항목을 빼고…`(`:748`) — 실제 ✕는 이름 옆이 아니라 카드 우측 하단 '편집' 버튼 아래(`:723-729`). 게다가 아무것도 입력하지 않은 초기 상태에서 `이름이 빈 항목이 있어요 — 위에서 입력해주세요.`(`:759`) 경고가 이미 떠 있다. 코드상 `handleManualPick`(`:890-913`)은 빈 아이템을 만들고 `setStep('confirm')`만 할 뿐, **어느 탭에서 왔는지를 `StepConfirm`에 전혀 넘기지 않는다** — `StepConfirm`의 props(`:517-525`)에 origin/mode가 없다.
  problem: 카피↔동작 모순. 사용자가 AI를 쓴 적이 없는데 앱이 "추출했다"고 주장하고(C1·C8·C9 세 명이 독립 지적), 안내가 가리키는 ✕ 위치도 틀리며, 입력 전부터 빨간 에러가 떠서 "내가 뭘 잘못했나" 하게 만든다. 이건 문구 3줄 수정이 아니라 **컴포넌트가 자기 입력 출처를 모른 채 렌더링되는 구조** 문제다 — 앞으로 탭이 늘 때마다 같은 오류가 반복된다.
  lens: 에러 상태 처리 / 한국어 문자열 처리 / 카피↔동작 모순
  priority_guess: P1
  cause: `StepConfirm`이 상태 비의존적으로 설계돼 origin을 받지 않는다. 빈 이름 경고도 `touched`/`submitAttempted` 상태 없이 값만 보고 즉시 렌더링하는 uncontrolled-validation 패턴.
  fix: `StepConfirm`에 `origin: InputTab` prop 추가하고 `handleManualPick`/각 AI 핸들러가 `activeTab`을 넘긴다. (a) 헤더 문구를 `origin === 'manual' ? '직접 입력한 항목이에요. 카드를 눌러 카테고리·보관·사이즈를 채워주세요.' : '네모아가 추출한 목록입니다. …'`로 분기. (b) 2단계 제목도 manual이면 `결과 확인 및 수정` → `항목 입력`. (c) `:748` 안내의 "이름 옆 ✕"를 실제 위치대로 `카드 오른쪽 ✕`로 고치거나 ✕ 버튼을 이름 행 오른쪽으로 옮긴다 — 후자가 낫다(AI 경로에서도 문구가 맞아진다). (d) `submitAttempted` state를 추가해 `:759` 경고는 '추가하기'를 한 번 누른 뒤에만 렌더링하고, 그 전엔 버튼만 disabled + `aria-describedby`로 사유를 연결. (e) 이름 입력란에 테두리(`border border-gray-200 rounded-xl`)를 줘 입력 가능 영역을 보이게 한다(C9 지적).
  effort: S

- persona: E2 (이현석 / 프론트엔드·풀스택 20년차)
  screen: 등록 모달 > 직접입력 > 식품 (저장 결과)
  observed: `handleManualPick('food')`(`TextImportModal.tsx:892-901`)이 만드는 빈 아이템이 `foodCategory: '기타 식품', storageType: '냉장', baseShelfLifeDays: 7` 고정. 사용자가 이름에 "우유"를 넣어도 그대로 저장돼 `기타 식품 · 냉장 · 7일`이 된다(C1 재현). 그런데 `src/lib/ingredientInference.ts`에 **이미** `inferFoodCategory(name)`(`:20`)와 카테고리별 기본 보관값 `defaultsFor()`(`:40-54`, 유제품=냉장 10일)가 있고 `createFoodItemFromIngredient(name)`(`:57-69`)이 정확히 이 일을 한다 — `ShoppingListSection`에서만 쓰이고 등록 모달에서는 안 쓴다.
  problem: 무료 사용자의 유일한 무한 등록 경로(직접입력)가 앱이 이미 가진 도메인 지식을 하나도 적용하지 않는다. 그 결과 모든 수동 등록 항목의 D-day가 7일 고정이라, 위의 '임박 8개' 같은 숫자가 사용자 데이터가 쌓일수록 점점 더 허구가 된다. 즉 이건 편의 기능이 아니라 **D-day 신뢰도의 상류 원인**이다.
  lens: 데이터 무결성 / 기존 모듈 재사용
  priority_guess: P1
  cause: 추론 로직이 `ingredientInference.ts`에 있지만 등록 파이프라인(AI 경로)과 수동 경로가 분기돼 있고, 수동 경로는 "AI 안 쓴다 = 추론도 안 한다"로 잘못 묶였다. 룰 기반 추론은 AI 한도와 무관한 순수 클라이언트 함수다.
  fix: `StepConfirm`의 `updateName`(`:533-535`)에서, 해당 아이템이 manual origin이고 사용자가 카테고리·보관을 아직 직접 건드리지 않았다면(`item._autoInferred !== false` 플래그) 이름 변경 시 `inferFoodCategory(name)` + `defaultsFor()`를 재적용한다. 사용자가 편집 폼에서 카테고리/보관/기한을 바꾸면 플래그를 끄고 더는 덮어쓰지 않는다. UI로는 추론된 값 옆에 `자동 추정` 회색 칩을 달아 사용자가 검증할 수 있게 한다(C4가 원한 "앱이 지어낸 추측"의 가시화). `defaultsFor`를 `ingredientInference.ts`에서 export하고 `createFoodItemFromIngredient`는 그대로 재사용.
  effort: S

- persona: E2 (이현석 / 프론트엔드·풀스택 20년차)
  screen: 전역 (데이터 저장 계층)
  observed: `src/context/CartContext.tsx:120-138`의 네 개 동기화 effect가 전부 `localStorage.setItem(...)`을 **try/catch 없이** 호출한다. 동일 패턴이 `src/lib/usePersistedState.ts:43`에도 있다. 현재 라이브 사용량은 총 8.3KB(`nemoa-items` 6.7KB)로 여유롭지만, `resizeAndEncode`(`src/lib/imageUtils.ts:6,17`)가 300px JPEG q0.6 data URL을 만들어 아이템에 그대로 박으므로 항목당 약 8~15KB가 붙는다 — 사진 300~400장이면 Safari의 5MB 한계에 닿는다. iOS Safari 프라이빗 모드에서는 setItem이 **첫 저장부터** QuotaExceededError로 throw한다. 앱에는 `errorLog.ts`(50건 로컬 로깅)와 `window.onerror` 바운더리가 있지만, 이 throw는 effect 안에서 발생해 화면상 아무 변화 없이 지나가고 React state는 "저장됨"으로 남는다.
  problem: **무음 데이터 유실 경로.** 등록을 마치고 토스트까지 뜨는데 실제로는 디스크에 아무것도 안 남는다. 사용자는 앱을 껐다 켠 뒤에야 알게 되고, 그 시점엔 무엇이 사라졌는지 알 방법도 없다. 회원가입 없이 localStorage만 쓰는 제품에서 저장 실패를 조용히 삼키는 건 가장 비싼 종류의 버그다.
  lens: 데이터 유실 시나리오 대비 / 에러 핸들링 / 로컬 저장 한계
  priority_guess: P0
  cause: 영속화가 컴포넌트 effect에 흩어져 있고 실패 경로가 설계돼 있지 않다. 저장 성공 여부가 UI에 피드백되는 채널이 아예 없다(토스트는 state 변경에만 반응).
  fix: `src/lib/safeStorage.ts` 신설 — `safeSetItem(key, value): {ok: true} | {ok: false, reason: 'quota'|'unavailable'}` 로 감싸고 실패 시 `errorLog.push()` + 전역 `nemoa:storage-error` 이벤트 발행. `CartContext`의 네 effect와 `usePersistedState:43`을 전부 이 함수로 교체. 이벤트를 받는 전역 배너(이미 있는 "백업 7일 stale" 배너 자리 재사용)를 띄워 `저장 공간이 가득 찼어요 — 사진을 지우거나 백업 후 정리해주세요` + [백업 내려받기] / [설정 > 저장 용량] CTA를 제공한다. 추가로 (a) `imageUrl`은 items와 분리해 IndexedDB(또는 별도 키)로 옮겨 items 본문이 quota를 먹지 않게 하고, (b) 설정 > 저장 용량 카드에 `navigator.storage.estimate()` 기반 사용률 바를 넣어 한계 도달 전에 보이게 한다. (a)는 스키마 마이그레이션이 필요하므로 별도 스텝으로 쪼개도 된다.
  effort: M

- persona: E2 (이현석 / 프론트엔드·풀스택 20년차)
  screen: 냉장고 > 🧊냉장고 탭 (칸 배지) / 하단 탭바 배지
  observed: 두 가지 스코프 결함이 겹쳐 있다. (1) `FridgeView`가 받는 건 필터가 다 적용된 `items`인데(`fridge/page.tsx:416`), 바로 위 요약 4수치는 소유자 필터만 적용한 `ownerFood`를 쓴다(`:383-399`) — 검색어나 분류 필터가 걸린 상태에서 냉장고 탭으로 오면 그림 배지 합계와 요약 '전체'가 갈린다. (2) 칸 배지의 **숫자는 그 칸의 총 보유 수**인데 **색은 `list.some(i => i.dDay <= 3)`**(`src/components/fridge/FridgeView.tsx:45,76`)로 정해진다 — 임박이 1건이라도 있으면 칸 전체 숫자가 빨개진다. 라이브에서 빨간 숫자를 다 더하면 17인데 요약의 '임박'은 8이다(C8이 세어 보고 "안 맞는다"고 했다). (3) 하단 탭 냉장고 배지(`src/components/layout/BottomNav.tsx:35-38`)는 `items` 전체를 대상으로 세어 **냉장고 인스턴스 필터도, 소유자 필터도 무시**한다 — 그래서 소유자 '첫째'를 골라 화면 전체가 0이 된 상태에서도 배지만 7·8로 남는다(C1·C8이 동일 지적).
  problem: 같은 "임박"이라는 개념이 세 군데에서 서로 다른 모수·다른 시각 문법으로 표현된다. 사용자는 빨간 숫자를 세서 검산하는데(실제로 C8이 했다) 어디서도 답이 맞지 않는다. `expiryThresholds.ts`의 주석이 "배지는 전부 SOON 기준으로 통일한다"고 선언해 놓았지만, 정작 칸 배지는 그 규약을 따르지 않는다 — 규약이 문서로만 있고 코드로 강제되지 않는다.
  lens: 화면 간 수치 불일치의 코드적 원인 / 시각 문법 일관성
  priority_guess: P1
  cause: (1)은 시각화와 요약이 서로 다른 파생 배열을 받는 props 설계, (2)는 "수량 배지"와 "상태 표시"를 한 UI 요소에 겹쳐 실은 것, (3)은 배지 계산이 전역 `items`를 직접 읽고 페이지의 스코프(activeFridgeId·ownerFilter)를 모르는 것.
  fix: (1) `FridgeView`에 `ownerFood`를 넘기고, 검색·분류 필터가 걸려 있을 때는 해당 아이템을 회색 처리(dim)로 표현하거나 그림 위에 `필터 적용 중 — 전체 보기` 칩을 띄운다. 요약과 그림은 반드시 같은 배열을 받는다(`fridgeSection.ts:146-150`의 기존 주석이 같은 교훈을 이미 적어놨다). (2) 칸 배지에서 색을 빼고 총 개수는 중립 회색으로, 임박은 **별도의 작은 점 또는 `⏱N` 보조 배지**로 분리한다 — 숫자 하나에 두 의미를 싣지 않는다. 임계값은 `EXPIRY_SOON_DAYS`로. (3) `BottomNav`의 `soonCount`를 `activeFridgeId` + `ownerFilter`로 스코프하거나(컨텍스트 승격), 스코프가 어려우면 배지 `aria-label`을 `전체 냉장고 기준 임박 N개`로 바꿔 모수를 명시한다. 전자를 권한다.
  effort: M

- persona: E2 (이현석 / 프론트엔드·풀스택 20년차)
  screen: 홈 > "지금 바로" 알림 (UrgentAlert)
  observed: `src/components/home/UrgentAlert.tsx:44-46`이 항목 이름 전체를 `className="text-sm text-gray-500 truncate"` 한 줄에 `join(', ')`으로 넣는다. 라이브 6건이면 실제 문자열이 `친환경 샐러드 믹스, 노르웨이 생연어, 제주 감귤 주스, 통밀 식빵, 국내산 한돈 안심, 고등어 자반` — 375px에서 첫 항목 + 둘째 절반만 보이고 나머지는 잘린다(C8 측정: 320px 텍스트를 184px 칸에). 컨테이너에 `pr-6`(닫기 버튼 회피)까지 들어가 실효 폭이 더 줄어든다. 같은 `truncate` 1줄 패턴이 `SeasonalHintWidget`(제철 식탁 줄)과 `FridgeView` 칸 미리보기에도 있다.
  problem: 홈에서 이 배너 하나 보려고 앱을 여는 사용자(C8)가 6개 중 1.5개만 본다. `truncate`는 "넘치면 자른다"이지 "우선순위대로 보여준다"가 아니라서, 잘리는 쪽이 무엇인지 사용자가 제어할 수 없다. 접근성 측면에서도 시각적으로 사라진 이름이 DOM에는 남아 스크린리더는 6개를 다 읽어 시각/청각 정보가 어긋난다.
  lens: 텍스트 오버플로우 / 접근성 구현
  priority_guess: P1
  cause: 가변 길이 목록을 고정 1줄 컨테이너에 렌더링하는 패턴이 컴포넌트 3곳에 복사돼 있고, "몇 개까지 보여주고 나머지는 +N"이라는 표시 규약이 정해져 있지 않다.
  fix: 공통 컴포넌트 `<NameList names={[]} max={2} />`를 만들어 — 앞 2개만 이름으로 렌더링하고 나머지는 `외 N개` 칩으로, 컨테이너는 `line-clamp-2` + `break-keep`(한국어 어절 보존). `UrgentAlert:44`, `SeasonalHintWidget`, `FridgeView` 칸 미리보기(`외 1` 패턴이 이미 있으니 그 규약으로 통일)를 전부 교체. 닫기 버튼과의 충돌은 `pr-6`를 텍스트가 아니라 헤더 줄에만 적용해 본문 폭을 회복한다. 스크린리더용으로는 잘린 목록에 `aria-label`로 전체를 주지 말고, 화면에 보이는 것과 동일한 `외 N개` 텍스트를 읽히도록 둔다.
  effort: S

---

## 이번 배포분 기술 검증 (E2 시야)

| 항목 | 확인 결과 |
|------|----------|
| Service Worker | `https://nemoa.vercel.app/sw.js` 정상 등록·active. TTFB 23ms / DCL 30ms / load 41ms — 재방문 성능 문제 없음 |
| 콘솔 에러 | 에러 0건. warn 2건(미사용 CSS preload, file chooser 사용자 제스처) — 무해하나 preload `as` 값은 정리 대상(P2) |
| localStorage 사용량 | 총 8.3KB / `nemoa-items` 6.7KB. 현재는 여유, 이미지 등록 시 위 finding 6의 경로로 위험 |
| `archived`/`discardHistory` 증가 | `slice(0,50)` / `slice(0,30)` 상한 있음 — 무한 증가 없음 (양호) |
| P0-24 냉장고 인스턴스 삭제 정합성 | `handleRemoveFridgeInstance`(`fridge/page.tsx:175-194`)가 orphan 재배치 후 인스턴스 삭제 — 로직 정상. 라이브 칸 합계 22 = 헤더 22 일치 확인. **완료** |
| P0-22 소유자 필터 베이스 통일 | `ownerFood` 단일 베이스로 헤더·통계·빈 상태가 함께 움직임(`:129-136` 주석대로). **완료** — 단 하단 탭 배지는 여전히 스코프 밖(위 finding 7) |

## E1·E3 영역과 연계 필요

- 임박 용어 6종("곧 만료 / 만료 임박 / 오늘까지 / 임박 / 기한 초과 / D-1") 통일은 위 finding 2의 `ExpiryBucket` 타입이 **코드 쪽 단일 소스**를 제공한다. 각 버킷의 표시 문구·톤 결정은 E3 영역.
- 홈 8칸 그리드의 라벨↔목적지 불일치(C9)는 라우팅 구현이 아니라 IA 문제 — E1 영역.
- 등록 모달 2단계를 manual일 때 "결과 확인"이 아닌 다른 이름으로 부를지는 E1/E3와 합의 필요(위 finding 4의 (b)).
