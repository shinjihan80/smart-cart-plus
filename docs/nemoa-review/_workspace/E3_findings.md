# E3 (박세라 / 20년차 UX·UI 디자이너) — 2026-10-03 저녁

- 대상: https://nemoa.vercel.app (2026-10-03 배포분). 라이브 JS 청크(`/fridge`, `/mypage`)를 받아 소스와 대조했다. `bg-orange-400` 격자 배지, `text-[#DC2626]` 카드 글자, `text-brand-primary bg-white/10` 토스트, `"♻️"`, `"소진 처리 (누적)"`가 라이브에 그대로 있다. 소스는 main(e785def)과 같다.
- 입력: C1·C4·C8 finding (C2는 누락)
- 대비비 계산: Tailwind v4 oklch 팔레트(node_modules/tailwindcss/theme.css)를 sRGB로 바꾼 뒤 WCAG 2.x 공식으로 계산했다. 반투명 배경은 흰색(또는 gray-900) 위에 합성한 값이다.
- 이전 E3 산출물: `_workspace_prev_20261003_2010/E3_findings.md`. 그중 "날짜표기/상태색/척도"는 일부만 해소됐다. 진행막대 척도는 고쳐졌지만(P1-68/P1-76) 상태색은 아래 E3-1에서 재발로 다룬다.

---

- persona: E3  # E3-1
  screen: 냉장고 > 🍽️음식 목록 카드 / 같은 카드의 진행막대 / 음식 격자 배지 / 🧊냉장고 칸 배지 / 칸 상세 시트 / 등록 폼 D배지 / 홈 임박 배너 (요청 ①)
  observed: |
    같은 D-2(버킷 'soon')가 7곳에서 7가지 방식으로 칠해진다.
    - 목록 카드 D글자·"N일 남음": `SwipeFoodCard.tsx:58` `isUrgent = dDay <= 3` → `text-[#DC2626]` (빨강, 자체 임계값)
    - 같은 카드 진행막대: `SwipeFoodCard.tsx:69-73` `classifyExpiry` → soon=`bg-amber-400` (노랑). 같은 카드 안에서 "빨간 글자 + 노란 막대"
    - 카드 편집모드 남은일수: `SwipeFoodCard.tsx:269` `dDay <= 3` → `text-brand-warning`(#EF4444, 세 번째 빨강)
    - 격자 배지: `fridge/page.tsx:675-677, 699-701` `dDay <= 3`, `dDay <= 0 ? bg-red-500 : bg-orange-400`. D-1은 버킷상 'today'(빨강 계열)인데 격자에서는 주황이다
    - 칸 배지 ⏱N: `FridgeView.tsx` classifyExpiry(today+soon) → `bg-rose-500`
    - 칸 상세 시트 "임박 N": `SectionDetailSheet.tsx:79-81` `dDay <= 3` → `bg-rose-100 text-rose-600`
    - 등록 폼 배지: `TextImportModal.tsx:399` classifyExpiry → soon=`amber-50/amber-600`, today=`rose-50/rose-500`
    - 홈 UrgentAlert: `brand-warning`
    - 안 쓰는 `FoodTags.tsx` 기본 export: 네 번째 임계값 세트(≤2 urgent / ≤5 warning)와 "긴급 소비 필요" 라벨이 남아 있다. 이 파일의 `calcRemainingDays`를 `expirySelectors.ts`가 import하고 있어서 지울 수도 없다
    globals.css에는 P2-4에서 만든 `--color-danger`/`--color-caution` 상태 토큰이 있지만, tsx 전체에서 2곳만 쓴다(brand-warning 64곳, 하드코딩 #DC2626 2곳).
  problem: |
    질문 "classifyExpiry()가 전부를 거치는가"의 답은 "아니오"다. 판정은 4곳에서 아직 자체 임계값(`dDay<=3`, `dDay<=0`)을 쓴다. 색 매핑은 classifyExpiry를 거치는 곳도 컴포넌트마다 각자 하고 있어서, 공유하는 곳이 한 군데도 없다.
    오늘 "등록폼 D배지 classifyExpiry 통일"은 판정만 맞춘 것이다. 버킷→색 표가 없으니 등록 폼은 amber-600, 막대는 amber-400, 목록 글자는 빨강이 됐다. 통일 작업이 오히려 색을 하나 더 늘렸다.
    색으로 급한 정도를 읽는 사용자(C8)에게는 "빨강이 더 급한지 노랑이 더 급한지"가 화면마다 뒤집힌다. 화면마다 수치가 다르게 보이는 문제와 같은 종류라서 신뢰를 깎는다.
  lens: 컴포넌트 불일치 / 상태색 토큰 부재
  priority_guess: P1 (P1-69 "상태색 토큰 미채택"·P2-4 재발. 7곳 불일치이고, 오늘 수정 뒤 C8이 다시 지적함)
  cause: |
    classifyExpiry는 "판정" 단일 소스일 뿐이고 "표현"(버킷→색·라벨·배지 형태) 단일 소스가 없다. 그래서 컴포넌트마다 Tailwind 팔레트를 직접 고른다.
    P2-4 토큰(danger/caution)은 정의만 하고 채택을 강제하지 않았다. 리뷰 때마다 한 곳씩만 고치는 국소 수정(P1-70 "카드 텍스트 2곳만 스코프 고정", P1-76 "등록폼만")이 쌓여서 생긴 결과다.
  fix: |
    1) `src/lib/expiryThresholds.ts` 옆에 `expiryTone(bucket)`을 만든다. 반환값은 `{ textClass, softBgClass, solidBgClass, barClass, label }`이고 토큰만 참조한다.
    2) `<ExpiryBadge dDay variant="text|soft|solid">` 컴포넌트를 하나 만들어 위 7곳을 전부 교체한다. 컴포넌트 안에 `dDay <=` 비교가 남지 않게 한다.
    3) `calcRemainingDays`를 `lib/dateMath`(또는 expirySelectors)로 옮기고 `FoodTags.tsx` 기본 export는 지운다.
    4) ESLint `no-restricted-syntax`로 `dDay <= N` 리터럴 비교와 `text-[#`·`bg-(red|orange|rose|amber)-` 직접 사용을 막는다(expiry 계열 파일만 예외).
    색 체계는 두 안이 부딪친다.
    - 안A (P2-4 원칙대로): danger는 "되돌릴 수 없는 것"에만 쓴다. expired=danger(#DC2626), today·soon=caution(#B45309)이고, today는 solid 배지·soon은 soft 배지로 형태만 다르게 한다. 공포 톤이 줄어든다. 대신 D-0과 D-3이 같은 색이라 한눈에 급한 순서를 가리기 어렵다.
    - 안B (현재 막대 기준, 권장): expired·today=danger 빨강, soon=caution 앰버(텍스트는 amber-700/#B45309), fresh=중립 gray-600. 사용자 멘탈모델(빨강 > 노랑)과 맞고 지금 바뀌는 범위도 가장 작다. 이걸 고르면 globals.css P2-4 주석에서 "오늘까지 소비=caution"을 "today=danger"로 고쳐 문서와 구현을 맞춘다.
    어느 안이든 텍스트용 색은 흰 배경 4.5:1 이상인 #DC2626(4.83)·#B45309(5.02)로 한다. 막대·점 같은 비텍스트만 brand-warning(#EF4444)/amber-400을 허용한다.
  effort: M

- persona: E3  # E3-2
  screen: 냉장고 > 🍽️음식 탭 > 격자 보기 배지
  observed: |
    `fridge/page.tsx:677/701` `item.dDay <= 0 ? 'D-day' : ...`. 기한이 이미 지난 품목(dDay -1, -5 …)도 격자에서는 "D-day"(=오늘까지)로 보인다. 같은 품목이 목록 카드에서는 `EXPIRY_LABEL.over`("기한 초과")다.
    D-4 이상이면 배지가 아예 없다. 배지는 10px 흰 글씨이고 대비는 주황(orange-400) 위 2.38:1, 빨강(red-500) 위 3.82:1이다.
  problem: 상한 음식을 "오늘까지 먹으면 된다"고 알려주는 것이다. 문구와 사실이 정면으로 어긋나니 식품 안전과 신뢰를 동시에 깬다. 격자는 "한눈에 보기"용 뷰인데 가장 위험한 상태를 잘못 이름 붙이고 있다.
  lens: 카피↔데이터 모순 / 저대비
  priority_guess: P0 (신뢰 훼손. 기한 초과를 "D-day"로 표기)
  cause: E3-1과 원인이 같다. 격자가 classifyExpiry·EXPIRY_LABEL을 거치지 않고 `<= 0`으로 expired와 today를 하나로 묶었다.
  fix: |
    E3-1의 `<ExpiryBadge variant="solid">`로 교체한다. 라벨은 반드시 `expiryLabel()`/`EXPIRY_LABEL`을 거쳐 expired는 "기한 초과"(또는 짧은 형태 "지남")로 표기한다.
    격자에서도 D-4 이상은 중립 soft 배지(gray-100/gray-600 "D-7")로 늘 보여주거나, 이름 줄 오른쪽에 회색 D값을 둔다. 격자로 바꿨다고 정보가 빠지면 안 된다.
    배지 글자는 12px(0.75rem 이상, rem 단위)로 하고, solid 배경은 red-600(흰 글씨 4.76:1)·amber-700(5.05:1)을 쓴다.
  effort: S

- persona: E3  # E3-3
  screen: 냉장고 요약 "임박 N" → 탭 / 🧊냉장고 칸 배지 ⏱N → 칸 상세 시트 "임박 N"
  observed: |
    - 요약 카드 "임박"(`foodStats.ts:29`)과 칸 배지 ⏱(`FridgeView.tsx:52`): classifyExpiry로 today+soon만 센다. expired는 뺀다
    - "임박"을 눌러 켜지는 목록 필터(`fridge/page.tsx:238` `i.dDay <= 3`)와 칸 상세 시트 "임박 N"(`SectionDetailSheet.tsx:79-81` `i.dDay <= 3`): 하한이 없어 expired까지 센다
  problem: 기한 지난 품목이 하나라도 있으면 "임박 5"를 눌렀는데 6개가 나오고, 칸 배지 "⏱2"를 열면 시트에는 "임박 3"이 뜬다. P0-29·P0-30에서 고친 "하한 없는 임계값" 버그가 이 두 곳에 남은 것이다. 같은 단어 "임박"이 화면마다 다른 집합을 가리킨다.
  lens: 화면 간 수치 불일치 (디자인 관점에서는 같은 용어가 다른 의미로 쓰임)
  priority_guess: P0 검토 (화면 간 수치 불일치. 기한 지난 품목이 있을 때만 재현. E2 연계로 재현 확인 필요)
  cause: E3-1과 같이 컴포넌트에 남은 `dDay <= 3` 리터럴 때문이다. `expiryThresholds.ts` 주석이 이 패턴을 금지한다고 적어 두었지만 강제 장치(lint)가 없다.
  fix: |
    두 곳 모두 `bucket === 'today' || bucket === 'soon'`(또는 `expirySelectors`에 `isSoonOrToday()` 헬퍼를 만들어)로 바꾼다.
    기한 지난 품목은 "임박"과 섞지 말고 따로 "⚠ 기한 초과 N" 칩(danger 토큰)으로 보여줘서 사용자가 버릴 것을 따로 볼 수 있게 한다. E3-1의 lint 규칙이 있으면 재발하지 않는다.
  effort: S

- persona: E3  # E3-4
  screen: 홈 히어로("오늘까지 드세요" / "오늘 내로 소비가 필요해요") / 알림 꺼짐 배너("오늘 임박 식품 1개") / 냉장고 카드("1일 남음") / UrgentAlert("내일까지")
  observed: |
    D-1 품목 하나를 한 홈 화면이 세 가지로 말한다.
    - `dailyMessage.ts:73-98`: 'today' 버킷(D-0과 D-1을 함께 묶음)을 받아 "오늘까지 드세요"·"오늘 내로 소비가 필요해요"를 고정으로 출력
    - `notificationScheduler.ts:75`: 같은 버킷을 "오늘 임박"으로 표현
    - UrgentAlert만 P0-53 수정에 따라 `expiryLabel()`로 "내일까지"라고 쓴다
    - 냉장고 카드는 `SwipeFoodCard.tsx:187`에서 라벨을 직접 만들어 "1일 남음"이라고 쓴다(expiryLabel의 "내일까지"와도 다름)
  problem: C4·C8이 P0로 각각 따로 지적했다. 홈 맨 위 가장 큰 글씨가 틀린 쪽이다. P0-53은 문장 한 곳만 고쳤고, 버킷 이름이 문장으로 새는 경로는 그대로 남았다.
  lens: 카피 용어 일관성 / 카피↔데이터 모순
  priority_guess: P0 (C4·C8 독립 제기, P0-53 재발)
  cause: |
    버킷 이름 `EXPIRY_LABEL.today = '오늘까지'`가 실제로는 "1일 이내"를 뜻하는데, 사용자에게 보이는 라벨 테이블에 들어가 있다.
    문장을 만드는 곳(히어로·알림·카드)이 4곳으로 흩어져 있고, 각자 버킷 라벨을 쓰거나 라벨을 직접 만든다. 카피 시스템에 "품목 단위 문장은 반드시 expiryLabel(dDay)" 규칙을 강제하는 장치가 없다.
  fix: |
    1) 버킷 키는 그대로 두고 `EXPIRY_LABEL.today`를 사용자 문장에서 금지한다. 집합 라벨은 "곧 끝나요(1일 이내)"처럼 범위로 쓴다. 품목 문장은 `expiryLabel(min dDay)`만 쓴다.
    2) dailyMessage 두 문구를 `${expiryLabel(d)} 드세요` 형태로 바꿔서 D-1은 "내일까지 드세요", D-0은 "오늘까지 드세요"가 되게 한다.
    3) 알림 꺼짐 배너는 "곧 끝나는 식품 N개"로 바꾼다.
    4) 카드 187행의 직접 만든 라벨을 `expiryLabel()`로 바꾸고 날짜줄을 "D-1 · 10/04쯤까지" 2요소로 줄인다("N일 남음"은 D값과 중복이라 뺀다. C8의 날짜 3중 표기 지적과 카드 높이 165px 문제도 함께 해소).
    안A: 카드 표기는 "D-1"이 주 정보, 날짜는 보조. 안B: "내일까지"를 주 정보로 하고 D값을 지운다. 둘 다 홈과 같은 말을 쓰게 되는 게 핵심이고, 숫자에 익숙한 C1 쪽을 위해 안A를 권장한다.
  effort: S (E1·E2와 한 커밋으로)

- persona: E3  # E3-5
  screen: 냉장고 카드 "🍲 다 먹었어요" ↔ 마이페이지 요약(종합 통계·최근 소진 내역·이번 주/이번 달/올해 활동) ↔ 장보기 추천 (요청 ②)
  observed: |
    removeItem 한 가지 동작을 앱이 아이콘 4개·용어 4개로 부른다.
    - 냉장고 카드 버튼/토스트: 🍲 "다 먹었어요" / "\"X\" 다 먹었어요." (`SwipeFoodCard.tsx:467`, `fridge/page.tsx:269`)
    - 종합 통계: 🗑️ "소진 처리 (누적) N건" (`StatsSection.tsx:75`)
    - 최근 내역: 🗑️ "최근 소진 내역" (`mypage/page.tsx:401-402`)
    - 이번 주·이번 달·올해: ♻️ "소진"/"소진 식품" (`Weekly/Monthly/AnnualSummarySection`)
    - 장보기: 🔄 "소진 재구매"·"최근에 다 썼어요"·"소진한 식품 기반" (`ShoppingListSection.tsx:181`, `RebuySection.tsx:30`)
    - 옷장 삭제는 토스트가 "삭제됐어요"(`closet/page.tsx:239`)인데, 같은 removeItem이 `discardCount`를 올린다(`CartContext.tsx:242`). 그래서 "소진 처리 (누적)"은 먹은 식품과 지운 옷을 합친 수다. 반면 이번 주 "소진"은 `category==='식품'`만 센다(`WeeklySummarySection.tsx:32`)
  problem: |
    통일은 필요하다. 사용자는 "먹었다"고 눌렀는데 기록에서는 휴지통(🗑️, 버림)과 재활용(♻️, 쓰레기)으로 바뀐다. 행동의 의미가 뒤집혀서 "내가 누른 게 버린 걸로 잡혔나?" 하는 불안이 생긴다.
    게다가 "소진 처리(누적)"은 지운 옷까지 포함하니 숫자도 이름과 맞지 않는다. 다만 "다 먹었어요"를 그대로 기록 쪽에 옮길 수는 없다. 기록 집합에는 옷 삭제와 (버튼이 없어 어쩔 수 없이 눌린) 버린 음식이 섞여 있기 때문이다. 그래서 단순 치환이 아니라 용어 구조를 다시 짜야 한다.
  lens: 아이콘 언어 이원화 / 카피 용어 일관성
  priority_guess: P1 (C8 제기 + 수치 이름 불일치. 숫자 쪽은 E2 연계)
  cause: |
    P2-38은 "버튼 라벨"만 고쳤다. 이벤트 이름(동사, 사용자 시점)과 기록 이름(명사, 집계 시점)을 나누는 카피 규칙이 없다. 아이콘을 행동의 의미가 아닌 섹션마다 즉석에서 골랐다.
    데이터 모델이 "먹음/버림/옷 정리"를 구분하지 않아서 정확한 명사를 붙일 수도 없다.
  fix: |
    공통 규칙: 버튼은 1인칭 구어체 동사("다 먹었어요"), 통계·기록은 같은 어근의 명사형("다 먹은 식품"). "소진"이라는 단어는 사용자에게 보이는 문구에서 뺀다(내부 키·주석에는 남겨도 된다). 음식에 🗑️·♻️는 쓰지 않는다.
    - 안A (카피만, 바로 가능, 권장 1단계): 식품 기록은 모두 🍲 "다 먹은 식품"으로 통일한다(주/월/연 활동, 최근 내역 제목 "최근에 다 먹은 것"). 종합 통계 한 줄은 `category`로 나눠 "🍲 다 먹은 식품 N" + "👕 정리한 옷 N" 두 줄로 바꾼다(discardCount 대신 discardHistory를 카테고리로 집계. E2 확인 필요). 장보기는 "🔄 다 먹은 것 다시 사기"·"최근에 다 먹었어요".
    - 안B (E1·E2 연계, 2단계): 카드에 두 번째 액션 "🗑️ 버렸어요"를 추가하고 discardHistory에 `reason: 'eaten'|'wasted'`를 넣는다. 그때부터 🗑️는 "버림"만 뜻하게 되어 아이콘 의미가 바로선다. 마이에는 "다 먹음 N · 버림 N(낭비율)"을 보여준다. C8이 말한 "얼마나 버렸는지 모름"과 E1의 절약 지표를 함께 해결한다.
    안A만 해도 아이콘 혼란은 사라진다. 안B는 수익·리텐션 지표에 해당하므로 E1이 결정할 범위다.
  effort: S (안A) / M (안B)

- persona: E3  # E3-6
  screen: 홈 임박 배너 ✕·› / 되돌리기 토스트 (C8 #1, 오늘 배포한 44px 확장의 부작용)
  observed: |
    `UrgentAlert.tsx`(Rebuy·SeasonChange도 같은 구조)에서 카드 전체가 `<Link>`이고, ✕는 `absolute top-2 right-2 w-6 h-6`에 `.touch-target-44::after { inset:-9px }`가 붙어 있다. 늘어난 영역(약 42px 정사각)이 세로 가운데 있는 ChevronRight(오른쪽 16px, 14px 크기)를 덮는다. C8이 ›를 눌렀더니 실제로 배너 숨김이 실행됐다.
    P2-36 ②("✕와 › 이격")는 "레이아웃 재배치가 필요"하다는 이유로 보류된 상태에서 ①(영역 확대)만 배포됐다.
    아이콘 대비도 부족하다. ✕(`text-brand-warning/60` / warning-10% 배경) 2.12:1, ›(`/50`) 1.87:1로, 비텍스트 3:1(WCAG 1.4.11)에 못 미친다.
    앱 전체 `<X>` 닫기 버튼 16곳 중 touch-target-44가 붙은 곳은 홈 배너 4곳뿐이다(C8 #6: 마이 백업 ✕ 27px, 등록 폼 "편집"과 ✕ 21px가 바로 붙어 있음).
  problem: "들어가 보기"를 누르면 "오늘 하루 숨기기"가 실행된다. 오늘 가장 급한 알림이 하루 동안 사라지는 파괴적 오동작이다. 접근성을 고친다며 터치 영역을 넓힌 것이 바로 옆 버튼을 덮는 결과를 낳았다. 복구 경로인 "되돌리기"도 2.13:1이라 잘 안 보인다(E3-7).
  lens: 인터랙션 / 터치타깃
  priority_guess: P1 (오늘 수정이 만든 회귀. 급한 알림 유실)
  cause: |
    터치 영역을 레이아웃 공간 없이 의사요소로 넓혔다. 히트 영역이 형제 요소와 겹치는지 검사하는 장치가 없다.
    카드 전체가 링크인데 › 아이콘도 따로 있어서 의미가 겹치고, 닫기와 이동이 한 모서리에 몰려 있다.
    IconButton 공통 컴포넌트가 없어서 16곳이 제각각이다.
  fix: |
    - 안A (권장): ›를 없앤다(카드 전체가 링크라 › 없이도 이동이 된다. 카드 끝에 "보기" 텍스트 링크를 둬도 된다). ✕는 카드 밖 오른쪽 위로 빼거나, flex 형제 칼럼으로 둬서 실제 44×44 레이아웃 공간을 갖게 한다. 의사요소 확장은 쓰지 않는다.
    - 안B: ✕를 없애고 카드 아래쪽에 텍스트 버튼 "오늘은 그만 보기"(44px 높이)를 둔다. 실수로 숨길 확률은 가장 낮지만 카드 높이가 약 20px 늘어난다.
    공통: `<IconButton size=44 label>`을 만들어 16곳에 적용한다. 아이콘 색은 /60 같은 투명도를 쓰지 말고 3:1 이상인 고정 토큰을 쓴다. 숨김처럼 되돌릴 수 있는 파괴적 동작은 "되돌리기" 토스트를 눈에 잘 띄게 한다(E3-7).
  effort: S

- persona: E3  # E3-7
  screen: 대비 미달, 1순위: 행동 버튼·긴급 정보 (요청 ③)
  observed: |
    WCAG AA 텍스트 4.5:1(18.66px bold 미만이면 모두 해당)에 못 미치는 것을 영향 크기 순으로 정리했다.
    | 순위 | 위치 | 조합 | 대비 | 크기 |
    |---|---|---|---|---|
    | 1 | 되돌리기 토스트 "되돌리기" (`ToastContext.tsx:66`) | #4F46E5 on gray-900+white/10 | **2.13:1** (C8 2.2 확인) | 12px bold |
    | 2 | 격자 D배지 (`fridge/page.tsx:676`) | white on orange-400 / red-500 | **2.38 / 3.82** | 10px bold |
    | 3 | 홈 UrgentAlert 헤드라인 "내일까지 먹어야 할 식품 N개" | #EF4444 on warning/10 | **3.30:1** | 14px bold |
    | 4 | 등록 폼 D배지 (오늘 통일한 조합, `TextImportModal.tsx:401-403`) | amber-600/amber-50 · rose-500/rose-50 · emerald-600/emerald-50 | **3.08 / 3.41 / 3.48** | 12px bold |
    | 5 | "🍲 다 먹었어요" 버튼 (`SwipeFoodCard.tsx:465`) | rose-500 on rose-50 | **3.41:1** | 12px semibold |
    | 6 | 칸 배지 ⏱N (`FridgeView.tsx`) | white on rose-500 | **3.76:1** | 10px bold |
    | 7 | 카드 편집모드 남은일수 (`SwipeFoodCard.tsx:269`) | brand-warning on white | **3.76:1** | 14px |
    | 8 | 배너 ✕ / › 아이콘 (비텍스트 3:1 기준) | warning/60, /50 | **2.12 / 1.87** | 12–14px 아이콘 |
    참고로 이미 통과하는 것은 카드 D글자 #DC2626 4.83(P1-70 완료)이다.
  problem: 1순위는 회복 버튼(되돌리기), 오늘 가장 급한 경고(배너·D배지), 핵심 행동(다 먹었어요)이다. 화면에서 가장 중요한 요소일수록 대비가 낮다. 1~2위는 2:1대라서 저시력이 아니어도 야외나 햇빛 아래에서 안 보인다.
  lens: 대비 / 접근성
  priority_guess: P1 (1~3위) · P2 (4~8위)
  cause: |
    "연한 배경 x-50 + 같은 색상 x-500 글씨" 패턴이 기본처럼 쓰이는데, 이 조합은 구조적으로 3.0~3.5:1에 그친다.
    어두운 배경 위 강조색으로 브랜드 인디고(라이트 배경용 6.29:1)를 그대로 다시 썼다.
    상태색 텍스트 전용 토큰(#DC2626/#B45309)은 있지만 쓰는 곳이 없다(E3-1과 원인 같음).
  fix: |
    - 토스트 버튼: `text-indigo-300`(#A5B4FC, 6.72:1)으로 바꾸거나, 흰 글씨 + `ring-1 ring-white/40` 아웃라인 버튼으로 바꾼다. 토큰은 `--color-brand-primary-on-dark`를 새로 만든다. 지속 시간과 같이 조정한다(E2).
    - 연한 배지 규칙은 "bg x-50 + text x-700"으로 통일한다(amber-700 on amber-50 약 4.8, #B45309 on amber-50 4.84, #DC2626 on rose-50 4.39라서 rose는 red-700 권장). E3-1의 ExpiryBadge가 이 규칙을 내장한다.
    - 진한 배지는 red-600(흰 글씨 4.76)·amber-700(5.05)으로 하고 10px는 쓰지 않는다(최소 12px/0.75rem).
    - UrgentAlert 헤드라인은 #DC2626 + 배경 warning/10 대신 rose-50으로 바꾼다(약 4.4). 4.5를 넘기려면 red-700을 쓴다. ✕·›는 E3-6에 따라 정리한다.
    - "다 먹었어요"는 rose 계열이 "삭제"로 읽히기도 하므로 E3-5와 함께 중립 또는 brand 톤(brand-primary/indigo-50, 약 5.9:1)으로 바꾸는 것을 권장한다. 안B("버렸어요" 추가)를 택하면 그 버튼만 danger soft로 한다.
  effort: S (전부 토큰·클래스 교체이고 ExpiryBadge와 함께 하면 M 안에 포함)

- persona: E3  # E3-8
  screen: 대비 미달, 2순위: 정보성 회색 글씨 (마이페이지 섹션 제목·백업 경고·히스토그램, 앱 전역) (요청 ③)
  observed: |
    | 순위 | 위치 | 조합 | 대비 | 크기 |
    |---|---|---|---|---|
    | 1 | 백업 경고 "가족 이름·신체 정보가 그대로 담겨요 — 남과 공유하지 말고…" (`mypage/page.tsx:320`, `settings/page.tsx:200`) | gray-400 on white | **2.60:1** (C8 실측 2.4, 카드 배경 틴트 포함) | 12px |
    | 2 | 섹션 제목 "종합 통계"·"보관 현황"·"카테고리 분포"·"이번 주 활동"·"올해 활동 요약" (`StatsSection.tsx:68`, `AnnualSummarySection.tsx:83` 등) | gray-400 | **2.60:1** | 12px medium |
    | 3 | 연간 히스토그램 월 숫자 1~12 (`AnnualSummarySection.tsx:136-141`) | gray-400 | **2.60:1** (C8 2.5) | 10px |
    | 4 | 히스토그램 "→ N회 페이스" (`:100`) | gray-400 | 2.60 | 10px |
    | 5 | 범례 (`:156`) | gray-500 | 4.84 (대비는 통과, 10px라 크기 미달) | 10px |
    | 전역 | `text-gray-400` 357곳, `text-gray-300`(1.47:1) 68곳, `text-[10px]/[11px]` 71곳 | | | |
  problem: 경고문이 카드에서 가장 흐리고, 제목이 본문보다 흐리다. 위계가 거꾸로다. "남과 공유하지 마세요"는 개인정보 경고인데 가장 안 읽히는 보조 글씨 취급을 받는다.
  lens: 타이포 스케일 부재·저대비
  priority_guess: P2 (백업 경고 1위는 개인정보 경고라서 P1 검토)
  cause: |
    텍스트 역할 토큰(title/body/secondary/caption/disabled)이 없어서 gray-400이 "보조 텍스트" 기본값으로 퍼졌다. 섹션 제목을 캡션 스타일(12px 회색)로 그리는 카드 패턴이 마이페이지 카드 전부에 복사됐다.
    px 고정 미세 글자(10/11px)는 P1-48 rem 전환에서도 빠졌다.
  fix: |
    1) globals.css `@theme`에 `--color-text-secondary: gray-600(7.56)`, `--color-text-tertiary: gray-500(4.84, 최저선)`, `--color-text-disabled: gray-400`(비활성·placeholder 전용)을 둔다.
    2) codemod로 정보성 `text-gray-400`는 tertiary로, `text-gray-300`(구분자 "·" 제외)도 tertiary로 바꾼다. lint로 gray-300/400 텍스트를 금지한다(disabled 문맥은 예외).
    3) 섹션 제목은 `text-sm font-bold text-ink`(본문보다 진하게)로 하는 `<SectionTitle>` 컴포넌트로 통일한다.
    4) 경고문은 caution 토큰 + ⚠ 아이콘 한 줄로 바꾸고 본문 크기를 13.5px(0.75rem 이상) 이상으로 한다.
    5) `text-[10px]`/`[11px]`은 `text-2xs = 0.6875rem` 토큰 하나로 모으고, 최소 0.75rem 규칙을 둔다. 히스토그램 월 숫자는 1·4·7·10·12 등 일부만 표시해 12px를 확보한다.
  effort: M (codemod + 육안 회귀)

- persona: E3  # E3-9
  screen: 냉장고 > 🍽️음식 카드 (150%/375px, C8 4회 반복) / 냉장고 칸 제목 / 하단 탭 라벨
  observed: |
    `SwipeFoodCard.tsx:139` 이름 `text-[15px] … truncate`. 오늘 line-clamp-2 수정은 홈 카드에만 들어갔고 냉장고 카드 이름은 아직 truncate다.
    사진 칸 `w-24 h-24` 고정이라 루트 27px에서 이름이 33px 폭으로 줄어 사라진다(C8). 격자 이름도 `truncate`라 8개가 잘린다.
    칸 제목 11px 고정으로 "냉동실 아래칸" 등 5개가 잘린다. 하단 탭 라벨 11px는 150%에서도 커지지 않는다.
  problem: 큰 글씨가 필요한 사람에게 이름이 사라지는 문제가 4회째다. 국소 수정(홈만 line-clamp)이 반복되는 동안 가장 많이 보는 냉장고 카드는 빠져 있었다.
  lens: 타이포 스케일 부재 / 줄바꿈
  priority_guess: P1 (4회 반복, WCAG 1.4.4/1.4.10)
  cause: 루트는 %로 바꿨지만(P1-48) 컴포넌트가 px 임의값(`text-[15px]`, `w-24`, `text-[11px]`)을 써서 비율이 무너진다. 고정 폭 미디어 + 가변 텍스트 구조에 리플로 규칙(컨테이너 쿼리)이 없다.
  fix: |
    1) 카드 이름을 `text-[0.9375rem] line-clamp-2 break-keep`으로 바꾼다(앱 전역 "이름은 truncate 금지, line-clamp-2" 규칙을 lint·코드리뷰 체크리스트로).
    2) 카드에 `@container`를 두고, `@max-[22rem]:` 구간에서 사진을 `w-16 h-16`(rem 기반)으로 줄이거나 사진을 위에 쌓는 세로 레이아웃으로 전환한다.
    3) 칸 제목·탭 라벨은 rem 토큰으로 바꾸고 칸 제목은 `line-clamp-2`로 한다.
    4) QA 매트릭스에 "루트 150%·375px" 스냅샷을 고정한다(E2 연계, Playwright 시각 회귀).
  effort: M
