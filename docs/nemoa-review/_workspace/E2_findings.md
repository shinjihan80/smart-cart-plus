# E2 (이현석 / 20년차 프론트엔드·PWA 개발) — 2026-09-27 밤 재검증

대상: https://nemoa.vercel.app · 소스 대조 `src/`

## 발견

- screen: 등록(FAB) > 식품 등록 > 직접입력 (`TextImportModal.tsx:900-924`, `:537-539`)
  observed: `handleManualPick()`이 빈 식품 아이템을 리터럴 하드코딩(`foodCategory:'기타 식품'`, `storageType:'냉장'`, `baseShelfLifeDays:7`)으로 만들고, 이후 `StepConfirm.updateName()`(:537)이 name 필드만 패치. 이름 변경이 카테고리·보관기한을 재계산하는 경로가 없음.
  problem: 추론 엔진(`ingredientInference.ts`의 `inferFoodCategory`/`defaultsFor`)이 이미 존재하고 쇼핑리스트→냉장고 경로(`ShoppingListSection.tsx`)는 이미 사용 중인데, `TextImportModal.tsx`는 이 모듈을 import조차 안 함 — "장보기에서 담은 우유"는 유제품/10일, "직접입력한 우유"는 기타식품/7일로 갈림(P0-52의 신뢰 회복이 등록 단계에서 상쇄).
  cause: 추론 로직이 "이름이 이미 있는 아이템"만 상정해 작성돼, "빈 카드 먼저→이름 나중 타이핑" 흐름에 구조적으로 안 맞았음. `defaultsFor`가 모듈 private이라 재사용도 막힘.
  fix: ① `defaultsFor`를 `export function inferFoodDefaults(category)`로 공개 ② `StepConfirm`에 "사용자가 손댄 필드" 추적 추가, `updateName`에서 이름→재추론(매칭 실패 시 '기타 식품'의 실온/30일로 fallback 금지 — 기존 보수값 냉장/7일 유지) ③ 추론 성공 시 확인 단계에 "'서울우유 1L'→유제품·냉장·10일로 추정했어요" 한 줄 노출.
  effort: S
  priority_guess: P0

- screen: 데이터 모델 전반(`types/index.ts:83-99`)
  observed: `FoodItem`에 만료일 필드 없음 — 매 렌더 `purchaseDate+baseShelfLifeDays`로 파생. "사용자 확인값 vs 앱 추정값" 구분 플래그도 없음.
  problem: 카드가 추정값을 확정적 서체로 표시(C8 지적). finding1로 추론 정확도를 올려도 "추론은 추론"이라 구분 없이는 근본 해소 불가.
  cause: 표시 레이어만 P0-52에서 만료일 중심으로 바뀌고 저장 레이어(구매일+일수)·출처 기록은 그대로 — 3중 비대칭.
  fix: `FoodItem`에 `shelfLifeSource?:'user'|'inferred'|'ai'` 옵셔널 필드 추가(기존 스냅샷 마이그레이션 불필요, 미지정='inferred' 취급). 사용자가 직접 저장 시 'user', 카드에서 'user' 아닐 때만 "추정" 칩.
  effort: M (finding1·3과 같은 스프린트 권장)
  priority_guess: P0

- screen: 냉장고 > 카드 펼침 > ✏️정보 수정(`SwipeFoodCard.tsx:298-318`)
  observed: 편집 폼에 구매일+보관일수(숫자)만 있고 만료일 입력란 없음, 전 필드 비제어(defaultValue+onBlur).
  problem: 포장 날짜를 그대로 못 넣고 역산 필요(C1·C4·C8 3인 확인).
  fix: 구매일·만료일 두 칸만 제어 컴포넌트로 승격, `commitDates()`로 상호 동기화(`daysBetween`/`localMidnight` 기존 export 재사용, 한 줄 역산). 기존 "보관 가능 일수" 숫자칸은 읽기전용 파생 표시로 강등. ⚠️ 만료일=구매일(days=0) 가능해지면 `SwipeFoodCard.tsx:161` 진행바가 `(dDay/baseShelfLifeDays)*100`에서 0으로 나눠 `width:"NaN%"` — 같은 커밋에서 `Math.max(1, baseShelfLifeDays)` 가드 필수.
  effort: S
  priority_guess: P1

- screen: 냉장고 > 접힌 카드 — **P0-52 배포로 새로 생긴 회귀**(`SwipeFoodCard.tsx:148`)
  observed: `expiryDateStr(item).slice(5).replace('-','/')`가 연도를 무조건 절삭. `baseShelfLifeDays`가 365일 넘는 품목(양념·면류 기본값 180/730일)에서 항상 재현 — 실측: 샘표 진간장(730일)→2028-07-27→"07/27까지", 순창 고추장(365일)→2027-08-27→"08/27까지"(오늘 09/27 기준 한 달 전처럼 보임). 또한 `dDay>=0`일 때만 "까지" 부착 → **기한 초과 품목은 다시 라벨 없는 맨 날짜**(P0-52가 고치려던 실패모드가 expired 케이스에 남음).
  cause: 포맷팅이 헬퍼 없이 인라인 문자열 연산으로 박혔고, 검증 시나리오가 D-0/D-1 임박 품목에만 맞춰져 1년+ 케이스·expired 케이스가 빠짐.
  fix(오케스트레이터 직접 적용 가능한 최소 diff):
    1. `dateMath.ts` 끝에 `expiryDateLabel(item, today=new Date())` 추가 — 올해면 "MM/DD", 해가 바뀌면 "YYYY.MM.DD".
    2. `SwipeFoodCard.tsx:24` import에 `expiryDateLabel` 추가(`expiryDateStr`는 :234 펼침상세에서 계속 쓰이므로 유지).
    3. `:148`을 `🗓 {expiryDateLabel(item)}{dDay >= 0 ? '까지' : ' 지남'}`로 교체.
    검증: `tests/dateMath.test.mts` 신설 — 730일/365일/expired/올해 4케이스.
  effort: S
  priority_guess: P0

- screen: 냉장고 > 접힌 카드 — 폰트 단위 혼용(`:123` vs `:125,147`)
  observed: 품목명 `text-[15px]`(절대px) vs D데이 `text-sm`(rem) vs 날짜줄 `text-xs`(rem). 루트 150%에서 rem 형제만 커지고 px 이름은 고정 → `flex-1 min-w-0 truncate`인 이름이 clientWidth 0(C8 실측 5건).
  problem: P0-52가 날짜 칸을 1개→2개(만료일+남은일수)로 늘리며 이름을 밀어내는 압력이 전보다 커짐 — P0-51의 재발이 아니라 악화.
  fix: 즉시(S) `:123`을 `text-[0.9375rem]`로 단위 통일 + `:124` D데이 묶음의 `shrink-0` 제거. 근본(M): `text-[Npx]` 리터럴 ESLint 금지 + 카드 타이포 3단 토큰화(P0-51/P1-31과 동일 작업 범위).
  effort: S(즉시) / M(근본)
  priority_guess: P0(기존 P0-51/P1-31에 통합 권고)

- screen: 냉장고 > 음식 카드 신선도 진행바(`:156-163`)
  observed: `width:(dDay/baseShelfLifeDays)*100%` — 감귤주스(shelf10,D-0)→4%, 샐러드(shelf3,D-1)→33%, 생연어(shelf10,D-1)→10%, 진간장(shelf730,D-669)→92%. 색은 절대 dDay 기준(`dDay<=2/≤5`)인데 길이는 품목별 상대비율 — 같은 D-1인 두 품목이 33% vs 10%로 3배 차이(C1 지적과 일치).
  problem: 길이와 색이 서로 다른 축을 말해 목록에서 급함 순서가 거꾸로 읽힘.
  fix: 분모를 고정 긴급지평(`EXPIRY_SOON_DAYS`, 이미 export됨)으로 정규화 — `width:(Math.max(0,dDay)/(EXPIRY_SOON_DAYS+1))*100%`. finding3의 0-division 가드도 동시 해소.
  effort: S
  priority_guess: P1

- screen: 등록(+) 시트 — 소유자 필드(`TextImportModal.tsx:530-532,563-566,603-628`)
  observed: `ownerId` 상태·선택 UI가 이미 구현돼 있으나 `{profiles.length>=2 && (...)}` 조건부라 프로필 1개면 안 보임. `handleConfirm`은 전체 아이템에 단일 소유자 일괄 적용(아이템별 지정 불가).
  problem: C4의 "소유자 선택이 없다"는 기능 부재가 아니라 프로필 1개 상태의 조건부 숨김 — 다만 여러 사람 물건을 한 번에 담을 때 배치별로만 지정 가능한 실제 결함은 남음.
  fix: ① 프로필 1개일 때 게이트 대신 "가족을 추가하면 나눠 담을 수 있어요→프로필 관리" 링크 ② `ownerId`를 배치 기본값으로 두되 아이템별 오버라이드 칩 추가(`item.ownerId ?? ownerId`로 병합).
  effort: M
  priority_guess: P1

- screen: 배포 검증 프로세스(`tests/`)
  observed: 7개 스위트 있으나 `dateMath.test.mts` 없음. P0-52 커밋(db3cc41)이 `expiryDateStr` 추가하며 테스트 미포함, 수동 시나리오 1건뿐.
  problem: 날짜·타임존 로직이 이 레포 최다 재발 버그 클래스(dateMath.ts 주석에 이미 3건 문서화)인데 정작 이 모듈만 테스트 없어 finding4(연도절삭)가 배포까지 그대로 감.
  fix: `tests/dateMath.test.mts` 신설 — 4함수 × 경계케이스(해넘김/윤년/730일/expired/KST 자정 전후). 표시 포맷 함수는 컴포넌트 인라인 금지, 전부 `dateMath.ts` 경유 규칙화.
  effort: S
  priority_guess: P1

## 오케스트레이터 3질문 직답

1. **추론 로직은 이미 존재, 직접입력 경로만 배선 안 됨.** effort S. `defaultsFor('기타 식품')`=실온/30일이라 fallback으로 그대로 쓰면 안 됨(반드시 제외).
2. **만료일 date input 추가는 기술적으로 간단(S).** 역산은 한 줄이나 현재 폼이 전부 비제어라 구매일·만료일 두 칸만 제어 컴포넌트로 승격 필요 + `days===0` 가능해지는 순간 진행바 0-division 가드 필수(같은 커밋).
3. **정확한 위치는 `SwipeFoodCard.tsx:148` 단 한 줄**(`slice(5)` 패턴 grep 결과 이 줄 유일). 최소 diff는 finding4에 정리. **같은 줄에 두 번째 결함**(`dDay>=0`일 때만 "까지" 부착 → expired 시 무라벨 맨 날짜 재현) — 한 번에 같이 닫을 것.
