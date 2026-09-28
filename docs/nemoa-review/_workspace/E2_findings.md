# E2 (이현석 / 20년차 프론트엔드·풀스택) — 2026-09-28 전면 부정적 재검토

대상: https://nemoa.vercel.app · 375x812 · 라이브 DOM 실측 + 소스 대조. 아카이브 "완료" 표시 무시, 라이브 기준으로만 판정.

## 발견

- screen: 등록 > 직접입력 > 편집 · 냉장고 카드 > 정보 수정 — **P0-33 회귀**
  observed: 등록 폼에서 유통기한을 2026-10-20으로 확정(22일) 후 구매일을 09-28→09-20으로 고치면 유통기한 칸이 경고 없이 2026-10-12로 자동 변경(칩은 22일 유지). 냉장고 카드는 더 나쁨 — 구매일을 09-19→09-10으로 바꾸면 카드 앞면 "🗓09/20 지남", 열려있는 편집 폼의 유통기한 칸은 "2026-09-29" — 한 카드 안에 만료일 두 개 동시 표시.
  problem: `baseShelfLifeDays = daysBetween(구매일, 입력일)`로 상대값만 저장하기 때문에, 사용자가 확정한 절대 날짜가 인접 필드(구매일) 수정에 의해 소리 없이 파괴됨. `shelfLifeSource:'user'`는 남아있어 틀린 날짜를 "까지"(확신 톤)로 단언. 게다가 SwipeFoodCard의 유통기한 input이 `defaultValue`(비제어)라 구매일 변경 후에도 옛 날짜를 들고 있고, 사용자가 값 변경 없이 탭했다 떼기만 해도(onBlur) `daysBetween(새 구매일, 옛 만료일)`이 계산돼 확정 안 한 값이 "직접 확인한 날짜예요"로 승격됨.
  priority_guess: P0
  cause: P0-33이 "기존 단일 소스(baseShelfLifeDays) 유지 = 저위험"이라 판단했지만, 저장 모델(상대 일수)과 입력 모델(절대 날짜)이 불일치한 채 공존하게 됨. `defaultValue`+`onBlur` 비제어 조합이라 재동기화 경로가 없음.
  fix: (a) `FoodItem`에 `expiryDate?: string`(절대 날짜)을 진짜로 추가, `expiryDateStr()`를 `item.expiryDate ?? (계산값)`으로. (b) 과도기 해법: 구매일 변경 시 `shelfLifeSource==='user'`면 절대 만료일 보존하도록 baseShelfLifeDays 재역산 + 유통기한 input을 `key={purchaseDate}` 또는 제어형 전환. (c) onBlur 저장을 "값이 실제로 바뀌었을 때만"으로 제한.
  effort: M

- screen: 등록 > 직접입력 > 편집 (구매일 칸)
  observed: 구매일을 비우면 유통기한 칸이 "1900.01.23"으로 바뀌고 배지 "기한 초과"로 전환, "1개 추가하기" 버튼은 계속 활성. 저장하면 `purchaseDate:""`가 그대로 localStorage에 들어감.
  problem: 등록 파이프라인 전체에 날짜 유효성 검증 없음. 오염된 아이템은 D-day 음수 수만일, 자동 아카이브, 연간 히스토그램 오염 순차 유발.
  priority_guess: P0
  cause: `localMidnight('')` → `new Date(0,0,1)` = 1900-01-01로 조용히 "유효한" 날짜 승격. 가드 없음.
  fix: `localMidnight`에 날짜 형식 검증 추가(불량시 null/throw), 구매일 onChange 빈값 무시 + `required`+`max={todayLocalStr()}`, 저장 버튼 disabled 조건에 유효성 추가.
  effort: S

- screen: (전역) AI 사진·텍스트 등록 → 냉장고·옷장
  observed: parser-agent가 `id: "p1", "p2"` 형식을 지시하고 vision-parser가 그대로 CartItem에 씀 — 재키잉 코드 없음. 영수증 두 번 스캔하면 카트에 "p1"이 두 개 생김.
  problem: `removeItem`/`updateItem`이 id 매칭이라 중복 id 항목이 동시에 삭제/수정됨. wearLog/savedOutfits도 id 키라 두 벌이 로그 공유.
  priority_guess: P0
  cause: LLM 임시 인덱스 id를 영속 엔티티 id로 승격시키는 경계 누락.
  fix: `mapVisionRawToCartItem`에서 id를 `crypto.randomUUID()`로 무조건 재발급. `CartContext.addItems`에 id 충돌 방어 추가. `baseShelfLifeDays`에 `Number.isFinite` 가드도 동시 적용(NaN 저장 방지).
  effort: S

- screen: 설정 > 백업에서 복원 / 모든 데이터 초기화
  observed: `restoreAll`+`applyNonCartFromSnapshot` 후 reload 없음. 착용로그·조리로그 등은 `createSharedStore`(모듈 싱글턴, storage 이벤트 미구독)라 복원 직후 화면은 복원 전 값 유지, 이후 아무 조작이나 하면 stale 상태가 복원본을 덮어씀.
  problem: 기기 교체 시나리오(유일한 데이터 이전 경로)에서 데이터 절반이 조용히 유실. 손상 백업 시 `CartContext` 로드 검증이 all-or-nothing이라 카트 전체 삭제.
  priority_guess: P0
  cause: 저장 계층 이원화(CartContext effect vs sharedStore 싱글턴), 복원 경로가 한쪽만 갱신.
  fix: SharedStore에 `rehydrate()` 추가 + 복원 시 호출, 최소 대안은 복원 성공 후 reload. `storage` 이벤트 구독 추가. CartContext 검증을 all-or-nothing→불량 아이템만 필터.
  effort: M

- screen: 설정 > 모든 데이터 초기화
  observed: `downloadBackup()`이 `a.click()` 직후 동기적으로 `revokeObjectURL` + DOM 미삽입 anchor — Firefox 등에서 다운로드 실패 가능한데 "성공"으로 간주하고 초기화 진행. `resetData()`는 빈 상태가 아니라 mockCartItems 41개로 복원(JSDoc은 "22개"로 문서도 틀림).
  problem: 백업 실패해도 파괴적 초기화 진행 + "초기화"라면서 가짜 샘플 41개 등장으로 사용자 혼란.
  priority_guess: P0
  cause: `<a download>` 라이프사이클 오해 + resetData가 "초기화"와 "샘플 복원"을 겸임.
  fix: anchor DOM 삽입 + revoke를 setTimeout으로 지연(또는 showSaveFilePicker로 실제 완료 대기). resetData는 빈 상태로, 샘플 주입은 별도 loadSampleData()로만.
  effort: S

- screen: (전역) 사진 첨부 후 아이템 다수 보유 상태
  observed: CartContext 메인 데이터 쓰기(`localStorage.setItem`)에 try/catch 없음. 반면 다른 저장소들은 완전 침묵 catch. `global-error.tsx` 없음(루트 layout의 Providers 예외를 error.tsx가 못 잡음).
  problem: localStorage 5MB 한도 초과 시 영문 백지 화면("Application error") + 복구 버튼 없음. 침묵 catch 쪽은 화면엔 저장된 것처럼 보이다 새로고침하면 사라짐 — 로컬 전용 앱에서 최악의 실패 모드.
  priority_guess: P0
  cause: 저장 실패를 "조용히 넘어가도 되는 예외"로 일괄 처리 + 루트 에러 바운더리 부재. 이미지를 base64로 localStorage에 직접 저장하는 것이 근본 원인.
  fix: `global-error.tsx` 신설(한국어 복구 화면). localStorage 쓰기를 `safeSetItem()` 헬�퍼로 통일, QuotaExceededError 시 토스트+백업 유도. 장기: 이미지를 IndexedDB로 이관. 부수: `resizeAndEncode`의 objectURL 누수, `pickImage`의 취소 시 promise 미resolve도 정리.
  effort: M

- screen: 등록 > 직접입력 (이름 입력 칩) — **P0-54 부분 회귀**
  observed: "서울우유"→"유제품/냉장/10일"(정상) 후 같은 칸을 "김치"로 교체 → 칩이 "유제품/냉장/10일" 그대로 유지(라이브 재현, 2회 타건으로 재현).
  problem: `if (foodCategory === '기타 식품') return next;` 가드가 "추론 실패 시 보수값 유지"를 의도했는데 실제로는 직전 성공 추론값을 그대로 붙듦. 김치·두부·나물 등 KEYWORD_MAP에 없는 흔한 재료로 바꾸면 엉뚱한 카테고리가 남고 신호 없음.
  priority_guess: P1
  cause: 가드가 "매칭 실패"와 "직전 추론 상태"를 구분 안 함.
  fix: `inferredFrom?: string` 필드로 추론 근거 추적, 매칭 실패 시 원래 보수 기본값(기타식품/냉장/7일)으로 되돌림. 칩에 "(자동)" 표시로 검증 가능하게. 부수: `fridgeSection`만 바뀐 경우도 touched 기록 안 돼 보관위치-보관방법 모순 조합 가능 — touched 대상에 fridgeSection 추가.
  effort: S

- screen: (전역) 옷장 코디 상세·홈 오늘의 코디·AI 등록·사용량 집계
  observed: `todayLocalStr()` 미적용 UTC 날짜 패턴이 6곳+ 잔존(OutfitDetailModal, SavedOutfitSuggestion, DailyBriefing, usageTelemetry, notificationLog, vision-parser route). 쓰는 쪽/읽는 쪽이 다른 "오늘" 기준이라 KST 00~09시 "오늘 입었어요" 버튼 상태 안 바뀜, "오늘의 코디"가 자정 아닌 오전 9시에 바뀜, 서버 라우트로 등록한 식품 purchaseDate가 하루 밀림.
  priority_guess: P1
  cause: `todayLocalStr()` 도입이 일괄 치환이 아니라 부분 적용, 재발 방지 린트 없음.
  fix: 6곳 치환. 서버 라우트는 클라이언트가 todayLocalStr()를 body로 전달. ESLint로 `toISOString().split('T')[0]` 패턴 금지(dateMath.ts만 예외).
  effort: S

- screen: 마이 요약/연간활동 · 홈 재구매 알림 · 소진 처리
  observed: `discardHistory`가 30건 하드캡 — 연간 히스토그램·재구매 주기·자주쓰는재료 등 전부의 유일한 소스. 되돌리기(undoRemove)는 items/discardCount만 복구하고 discardHistory는 안 되돌림.
  problem: 하루 3개만 소진해도 열흘이면 로그 전부 밀림 — "올해 소진 식품" 히스토그램이 구조적으로 12개월을 못 채움, 연말 프로젝션 항상 과소추정. 되돌리기 쓰면 discardCount와 discardHistory 영구 불일치.
  priority_guess: P1
  cause: 30건 캡이 "최근 소진 표시"용으로 도입된 뒤 연간·주기 분석이 그 위에 쌓임.
  fix: discardHistory를 별도 키로 분리 + 일자 기준(최근 400일) 캡으로 전환. undoRemove에서 해당 레코드도 복구.
  effort: M

- screen: (전역) PWA 업데이트·알림
  observed: SW 캐시 버전(`nemoa-v1.5.6`)이 여러 배포 거치며 갱신 안 됨 — activate 정리 로직이 영영 안 돎. RSC 네비게이션 페이로드가 정적 자산 캐시로 오분류(112건). `/fridge` JS 디코드 1.45MB. 알림은 앱이 열려있을 때만 실행, 제목 "오늘 소비해야 할"인데 대상은 D-1 포함(P0-53이 금지한 패턴 재발).
  problem: 배포할수록 구빌드 청크 무한 누적, 배포 직후 ChunkLoadError 위험(자동복구 없음). "유통기한 관리"가 핵심 가치인데 알림이 앱 실행 중에만 동작 — 기술적으로 미구현에 가까움.
  priority_guess: P1
  cause: SW 버전 수동 상수, RSC 판정 로직 부재, 알림이 폴링으로만 구현(push/로컬알림 미연결).
  fix: SW 버전 빌드타임 주입. RSC 요청 network-first 분기. cache.put 전 res.ok 체크. ChunkLoadError 감지시 1회 reload. 알림은 서버 push 또는 Capacitor localNotifications로 예약 발송 실제 연결. 번들: lucide 개별 임포트 + framer-motion layout prop 정리.
  effort: L

- screen: 냉장고 전체·모든 모달 — 접근성
  observed: brand-warning(#EF4444) 텍스트 대비 3.76:1(WCAG AA 미달), 임박 관련 텍스트 전부 이 색. 냉장고 아이템 이름 9/9 전부 잘림(title 속성 없음). 아이콘 탭 버튼 39×30px, 정렬버튼 52×18px. 모달에 포커스 트랩 없음(`useModalA11y`가 의도적으로 생략), 배경 40여개 요소가 여전히 포커스 가능.
  priority_guess: P1
  cause: 경고색이 미감 기준으로만 정해짐, 냉장고 셀 고정폭에 대책 없음, 모달 a11y 훅에서 포커스 관리 의도적 제외.
  fix: brand-warning 텍스트용/배경용 분리(#DC2626 텍스트, 밝은톤은 배경만). 냉장고 셀 title+line-clamp-2. 아이콘 버튼 aria-label+44px. useModalA11y에 포커스 트랩 추가.
  effort: M

- screen: 냉장고 🧊냉장고 탭 vs 🍽️음식 탭 요약 카드
  observed: 냉장고탭 "20전체/12냉장/2냉동/6실온/6임박"(5칸) vs 음식탭 "20전체/12냉장/2냉동/6임박"(4칸, 실온 열 삭제) — 같은 데이터인데 탭마다 다른 항목.
  priority_guess: P2
  cause: 요약 카드가 컴포넌트로 추출 안 되고 탭별 복붙 후 한쪽만 수정.
  fix: 단일 컴포넌트로 통합, 5칸으로 통일.
  effort: S

## 기존 "완료" 항목 재판정
- **P0-33 — 회귀 있음** (finding 1). 필드는 생겼으나 구매일 수정 시 확정값 파괴, 비제어 input 불일치, blur만으로 오확정.
- **P0-54 — 부분 회귀** (finding 7). 매칭 성공은 정상, 매칭 실패 시 직전 추론값 잔존.
- **P0-55 — 표시 로직 정상.** 다만 카드 앞면/상세 날짜 포맷 불일치는 경미(E3 영역).
- **N-10 후속(todayLocalStr) — 미완.** UTC 날짜 6곳+ 잔존(finding 8).

## E1/E3 연계
- 유통기한 절대값 저장 모델 변경(finding1)은 등록 폼 정보설계와 묶여 E1 영역과 연계 필요.
- 알림이 앱 실행 중에만 동작(finding10)은 제품 약속과 직접 충돌 — 우선순위 판단 E1 몫.
- brand-warning 대비, 냉장고 셀 레이아웃은 E3 영역과 연계 필요.
