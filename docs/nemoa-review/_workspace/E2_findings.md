# E2 findings — 이현석 (20년차 프론트엔드·풀스택) — 2026-10-23 (UI/UX 중심 비판 검토: 흐름·상호작용·문구↔동작)

- 대상: https://nemoa.vercel.app (main `7dc4e8b` 기준 라이브), 범위 홈·냉장고·옷장·마이·등록·요금제
- 방법: 검토단 C1·C4·C5·C8·C9가 라이브에서 재현한 증상을 코드 경로로 추적해 원인을 확정했다. 근거는 파일:행으로 적었다. 라이브 브라우저는 동의 시트(ConsentGate)까지만 열었다. 동의를 수락하는 건 사용자 승인이 필요한 동작이라 그 뒤 화면 조작은 하지 않았다. 동의 전 화면의 콘솔 오류는 0건이었다.
- 이전 산출물: `_workspace_prev_20261020/E2_findings.md`(2026-10-15, 4805ea2). 상태는 맨 아래 표에 정리했다.

```
- persona: E2
  screen: 홈 > 히어로 배너 [레시피 찾기] / [확인하기] → 명령 팔레트
  observed: dailyMessage.ts:65·89·102는 cta.href('/fridge', '/fridge?tab=suggest')와 paletteQuery를 함께 설정한다.
    HeroMessage.tsx:112는 paletteQuery가 있으면 href를 버리고 'nemoa:open-palette'를 보낸다. 그래서 버튼 문구가
    무엇이든 결과는 텍스트 검색창이다. 팔레트 레시피 검색(CommandPalette.tsx:232-236)은 "검색어가 레시피 이름이나 키워드에
    포함되는가"를 본다. "제주 감귤 주스"는 어떤 키워드에도 포함되지 않아 0건이다. 반대로 냉장고 추천 탭의 matchRecipes는
    "키워드가 품목명에 포함되는가"를 봐서 감귤 스무디(+1)를 찾는다. 팔레트는 기한 판정도 하지 않는다. 그래서 기한이 지난
    "계란"을 넣으면 계란말이 등 레시피 8개가 맨 위에 뜬다. matchRecipes(recipes.ts:1018)는 expired를 제외한다.
    품목 결과의 href는 '/fridge' 고정(CommandPalette.tsx:266)이라 해당 카드가 열리거나 강조되지 않는다. 하단 안내
    "↑↓ 탐색 · ↵ 선택 · ⌘K로 다시 열기"(450-451행)는 포인터 종류와 관계없이 항상 렌더된다.
  problem: 신뢰 훼손. 앱이 "상했다"고 한 품목으로 요리를 권한다(C1). "레시피 찾기"를 눌러도 레시피가 나오지 않는다(C1·C8·C9).
    홈에서 가장 큰 CTA가 문구와 다른 동작을 하고, 같은 질문("이 재료로 뭘 만들지")에 화면마다 다른 답을 한다.
  lens: 문구↔동작 일치 / 화면 간 결과 정합성
  priority_guess: P0
  cause: CTA를 "의도(intent)"가 아니라 "검색어 문자열"로 모델링했다. 레시피 매칭 엔진이 3개로 갈라져 있다.
    matchRecipes(만료 제외·키워드⊂품목명), countRecipesByIngredient/searchRecipes(keywordMatchesName),
    CommandPalette(검색어⊂키워드, 만료 무시, 관리자 overlay 아닌 정적 RECIPES)가 각자 매칭한다. 만료 판정은 첫 엔진에만 있다.
  fix: ① DailyMessage.cta를 판별 유니온으로 바꾼다. {kind:'recipes-for', itemId} → /fridge?tab=suggest&item=ID,
    {kind:'resolve-expired', itemId} → /fridge?tab=food&item=ID&expand=1. paletteQuery 필드는 삭제한다.
    ② fridge/page가 ?item=을 읽어 해당 카드를 펼치고 scrollIntoView+하이라이트한다.
    ③ recipesForItem(item, catalog)을 단일 소스로 만든다. matchRecipes를 재사용하고, expired면 빈 배열을 반환한다.
    팔레트·카드 "레시피 N개" 버튼·추천 탭이 모두 이 함수를 쓴다. expired 카드에서는 레시피 버튼을 숨긴다.
    ④ 팔레트 키보드 안내는 @media (pointer:fine)에서만 렌더한다. ⑤ "expired 품목→레시피 0" 불변식 테스트를 추가한다.
  effort: M

- persona: E2
  screen: 냉장고 > 장보기 탭 "빠른 추가"·"지금 가을철 재료" ↔ 마이 > 쇼핑 "쇼핑 리스트"
  observed: fridge/page.tsx:390 handleQuickAdd와 :449 handleSeasonalAdd는 둘 다 addItems(재고)를 직접 호출한다.
    토스트는 "추가됐어요!"·"담았어요! 제철이라…"이고 onUndo가 없다. 살 목록 저장소(nemoa-shopping-list, shoppingList.ts)는
    mypage/ShoppingListSection·ShoppingSuggestionsSection만 쓴다. 같은 동사가 화면마다 다른 뜻이다. "담았어요"는
    ShoppingSuggestionsSection:115에서 "목록에 넣음", fridge/page:462에서 "재고에 넣음", ShoppingListSection:83·252에서
    "샀으니 재고로 옮김"이다. C4·C5·C8·C9가 독립적으로 "사지 않은 우유·고구마가 오늘 구매로 재고에 들어갔다"를 재현했다.
  problem: 신뢰 훼손 + 데이터 오염. 가짜 구매일과 가짜 유통기한을 가진 재고가 생긴다. 그 위에서 계산되는 임박 배지·추천·통계·
    재구매 주기가 모두 틀어진다. 되돌리기도 없어서 사용자는 "다 먹었어요"로 거짓 처리해야만 지울 수 있다(C1). 제기자 4인.
  lens: 데이터 무결성 / 문구↔동작
  priority_guess: P0
  cause: "살 것(intent)"과 "가진 것(inventory)"이 서로 다른 저장소인데, UI는 탭 이름과 동사로 이 둘을 구분하지 않는다.
    재고 쓰기(addItems)를 막는 경계가 없어 어느 화면이든 바로 재고를 쓸 수 있다. addItems가 추가된 id를 반환하지 않아
    호출부가 되돌리기를 구현할 수단도 없다.
  fix: ① 냉장고 "장보기" 탭의 빠른 추가와 제철 칩은 addToShoppingList로 바꾼다. 그 탭 상단에 ShoppingListSection을 옮겨
    "장보기 = 살 목록"으로 통일한다(마이 > 쇼핑은 링크만 남긴다). ② 동사는 셋으로 고정한다. "목록에 담기"(intent),
    "샀어요 → 냉장고로"(intent→inventory), "냉장고에 추가"(inventory). copy 상수 파일 하나에 두고 lint로 "담았어요" 리터럴을 막는다.
    ③ addItems가 {added, skipped, ids}를 반환하게 한다. 재고에 쓰는 모든 토스트는 onUndo(() => ids.forEach(removeItem))를
    필수로 받게 showInventoryToast 래퍼로 강제한다.
  effort: M

- persona: E2
  screen: 냉장고(모든 탭) — 소유자 필터 지속 상태
  observed: fridge/page.tsx:229 usePersistedState('nemoa-fridge-owner')의 validator는 typeof string만 검사한다.
    삭제된 프로필 id도 유효한 값으로 통과한다. ownerFood(311행)는 냉장고·음식·추천 모든 탭의 베이스지만, 필터 칩(676행)은
    음식 탭에서 profiles.length>=2일 때만 렌더된다. 빈 상태 문구(616·858행)는 이름을 찾지 못하면 `?? ownerFilter`로
    내부 id를 그대로 출력한다. 재현 1(C5): 가족 프로필을 삭제하면 "식품 0개"와 `"p-1792560637087-hcbu" 몫으로…`가 뜨고
    칩이 사라진다. 재현 2(C4): 음식 탭에서 "큰아이"를 고르면 며칠 뒤 냉장고 탭이 "식품 1개·임박 0"인데, 같은 순간 홈과
    배지(전체 기준)는 "오늘까지 1개 / 2"다. 옷장(closet/page.tsx:114)과 OutfitPreview도 같은 패턴이다.
  problem: 신뢰 훼손. 사용자는 "데이터가 날아갔다"고 먼저 의심한다(C4·C5). 필터가 걸렸다는 표시가 없는 탭에서 숫자만 바뀐다.
  lens: 상태 관리 / 에러·빈 상태
  priority_guess: P0
  cause: 일회성 보기 선택을 영구 저장 상태로 만들었다. 저장값을 참조 무결성(현재 profiles)과 대조하지 않는다.
    필터의 적용 범위(모든 탭)와 표시 범위(음식 탭 일부)가 다르다.
  fix: ① validator가 profiles를 받아 존재하지 않는 id나 profiles<2이면 '전체'로 정규화한다(useOwnerFilter 공용 훅으로
    냉장고·옷장·코디가 함께 쓴다). ② 지속 범위를 sessionStorage로 낮추거나 앱 재시작 시 '전체'로 리셋한다.
    ③ '전체'가 아니면 모든 탭 헤더에 "큰아이 것만 보는 중 · 해제" 알약을 띄운다. ④ removeProfile에서 필터 키를 함께 정리한다.
    ⑤ 빈 상태의 `?? ownerFilter` 폴백을 삭제한다(id 노출 금지).
  effort: S

- persona: E2
  screen: 설정 > 전체 초기화 "백업 없이 바로 삭제" → 자동 저장 복구 카드
  observed: CartContext.tsx:422-449 resetData는 localStorage의 nemoa-* 키만 지운다. autoSnapshot.ts의 IndexedDB
    'nemoa-auto-snapshots'(3세대, 아이템·프로필·가족 정보 포함)는 손대지 않는다. 그 뒤 AutoSnapshotRecoveryCard가
    items==0을 신호로 "자동 저장된 데이터를 찾았어요 [이 데이터로 복구하기]"를 띄우고, 41개가 전부 돌아온다(C5 재현).
    확인 시트 문구는 "복원할 방법이 전혀 없어요 … 넘길 기기에서 지울 땐 이 쪽을 권해요"다. 동의 시트도
    "설정에서 언제든 데이터를 완전 삭제할 수 있습니다"라고 약속한다(라이브 확인).
  problem: 신뢰 훼손 + 개인정보. 삭제 약속과 실제 동작이 정반대다. 기기를 넘겨받은 사람이 버튼 하나로 가족 이름·알레르기를 되살린다.
  lens: 데이터 삭제 무결성
  priority_guess: P0
  cause: 저장소가 localStorage·IndexedDB 두 계층인데, 초기화는 "접두사 키 스윕"이라는 localStorage 전용 수단만 쓴다.
    복구 카드는 "items가 비었다"는 신호 하나로 사고 유실과 의도적 삭제를 구분하지 못한다.
  fix: ① resetData를 async로 바꾼다. 순서: AutoSnapshotScheduler 타이머 취소 → indexedDB.deleteDatabase('nemoa-auto-snapshots')
    await → localStorage 스윕 → sessionStorage nemoa-* 스윕 → reload. ② 초기화 직후 'nemoa-reset-at' 마커를 남기고
    (스윕 예외 키), 복구 카드는 스냅샷 createdAt이 마커보다 이전이면 숨긴다. ③ 저장소 목록(STORES 레지스트리)을 한 곳에 두고
    초기화·백업·복원·StorageUsage가 모두 이 목록을 순회하게 한다. 새 저장소를 추가할 때 누락되지 않도록 테스트로 강제한다.
  effort: S

- persona: E2
  screen: 설정 > 백업에서 복원 / 자동 저장 복구 → 백업 배너·홈 "아직 백업한 적 없어요"
  observed: backup.ts:150 applyNonCartFromSnapshot 마지막 줄이 writeTimestamp(Date.now())다. 그래서 파일 복원이나
    IndexedDB 복구만 해도 '마지막 백업'이 갱신된다. 파일을 한 번도 받지 않은 사용자에게 설정은 "백업 2일 전 · 다운로드 폴더에서
    백업 파일을 확인해보세요"라고 하고, 홈 경고는 사라진다(C5). 복원은 브라우저 confirm 1장(settings/page.tsx:96)으로 진행된다.
    문구는 "현재 데이터는 모두 덮어쓰여요"인데, applyNonCartFromSnapshot은 키마다 `if (Array.isArray(...) && length>0)`일 때만
    쓴다. 그래서 백업에 없던 키(옷장 구성·현재 프로필 등)는 그대로 남는 부분 병합이다.
  problem: 신뢰 훼손. 로컬 전용 앱에서 유일한 안전 계기판이 거짓 "안전" 신호를 낸다(P2-43이 다른 경로로 재발). 같은 "현재 데이터 소멸"
    동작인데 초기화는 2단계로 막고 복원은 confirm 1장이다. "모두 덮어쓴다"는 문구도 실제 동작과 다르다.
  lens: 유실 대비 / 문구↔동작
  priority_guess: P0 (거짓 백업 신호) / P1 (복원 확인 비대칭·부분 병합)
  cause: "백업 시각"을 "데이터가 파일로 기기 밖에 존재한다"는 사실이 아니라 "백업 관련 함수가 실행됐다"는 사건으로 기록한다.
    복원이 "교체"가 아니라 "있는 키만 덮어쓰기"로 구현됐다.
  fix: ① applyNonCartFromSnapshot에서 writeTimestamp를 제거한다. 필요하면 별도 'nemoa-last-restored-at'에 기록한다.
    lastBackupAt은 downloadBackup 성공 경로만 쓴다. ② 복원은 ResetConfirmSheet 패턴으로 바꾼다. [지금 상태 먼저 백업 후 복원(권장)]
    / [바로 덮어쓰기], 복원 직전 saveAutoSnapshot()을 강제한다. ③ 복원은 STORES 레지스트리 기준으로 전부 비운 뒤 스냅샷을 쓴다
    (진짜 교체). 백업에 없는 키는 기본값으로 둔다.
  effort: M

- persona: E2
  screen: 홈 "오늘 할 일" ↔ 하단 냉장고 탭 배지 ↔ 냉장고 요약 ↔ 마이 "임박 N개"
  observed: 판정 함수(classifyExpiry)와 셀렉터(selectExpiring)는 단일 소스가 됐다. 그런데 화면마다 다른 버킷을 고른다.
    UrgentAlert.tsx:28은 .today(D-1 이내)만, BottomNav.tsx:46은 urgentTotal(today+soon, D-3 이내, expired 제외),
    냉장고 요약은 임박(today+soon)과 기한초과를 따로 보여준다. TodoEmptyState.tsx:26-27은 "DOM 자식 수==0"으로 빈 상태를
    판정한다. 그래서 soon만 5개 있는 날 같은 화면에 "오늘은 할 일이 없어요 🎉"와 배지 "5"가 함께 뜬다(C5).
    기한이 지난 계란은 배지에서 빠진다(C1). 마이 "임박 6개 확인이 필요해요"는 링크가 아닌 텍스트다(C8).
  problem: 화면 간 수치 불일치. 기준(D-1/D-3)이 화면 어디에도 적혀 있지 않아 "둘 중 하나는 틀렸다"로 읽힌다. 가장 급한 기한 초과가
    배지에서 빠진다. C1·C5·C8 제기(3인 → 최소 P1).
  lens: 화면 간 수치 정합성
  priority_guess: P1
  cause: "판정"은 단일화했지만 "어느 집합을 무슨 이름으로 보여줄지"(뷰 모델)는 각 컴포넌트가 정한다. 빈 상태를 데이터가 아니라 DOM으로 판정해,
    알림을 오늘 숨김(dismiss)한 상태와 할 일이 없는 상태를 구분하지 못한다.
  fix: ① selectExpiryView(items) → {expired, today, soon, badgeCount: expired+today+soon, labels}를 만들고 모든 표면이 이것만 쓴다.
    ② 홈 할 일을 3행으로 고정한다. "기한 지남 N / 오늘·내일 N / 3일 이내 N". 각 행은 /fridge?tab=food&filter=expired|today|soon
    딥링크로 연결하고, fridge/page는 urgentOnly·expiredOnly를 URL에서 초기화한다. ③ 마이 "임박 N개"를 같은 딥링크 버튼으로 만든다.
    ④ TodoEmptyState는 데이터(view의 합==0 && 다른 알림 없음)로 판정하고, dismiss 상태면 "오늘 숨긴 알림 N개 · 다시 보기"를 보여준다.
    ⑤ 배지 aria-label에 기준을 넣는다("3일 이내 5개, 기한 지남 1개").
  effort: M

- persona: E2
  screen: 전역 토스트 되돌리기 (다 먹었어요·버렸어요·숨기기 등)
  observed: ToastContext.tsx:18-28은 단일 슬롯이다. 새 showToast가 이전 토스트를 즉시 교체하므로, "다 먹었어요"를 연속 2번 누르면
    첫 번째 되돌리기가 조용히 사라진다. 지속 시간은 8초 고정이고, hover·focus·visibilitychange에서 멈추지 않는다.
    되돌리기 버튼은 text-xs px-2.5 py-1(약 24px 높이)로 44px 미달이다. 토스트는 bottom-24 고정이라 아래 카드를 가린다.
    C8은 토스트 글씨를 읽는 사이 8초가 지나 그 자리의 아래 카드 펼침 버튼을 눌렀다. 영구 경로도 없다(마이 아카이브에서
    소진 기록을 되돌리는 UI 없음, C8).
  problem: 앱의 모든 파괴적 동작의 안전망이 "8초 안에 작은 버튼을 정확히 누르기" 하나뿐이다. 저시력·고령 사용자에게는 사실상 되돌릴 수 없다.
    WCAG 2.2.1(시간 조절) 위반.
  lens: 에러 복구 / 접근성
  priority_guess: P1
  cause: 토스트를 "알림 표시"로만 설계해서, 되돌리기라는 트랜잭션 수명을 UI 표시 수명에 묶었다.
  fix: ① 토스트 큐(스택 최대 3)로 바꾸고, 교체될 때 이전 undo를 "최근 처리" 목록으로 넘긴다. ② pointerenter·focusin·문서 hidden에서
    타이머를 멈추고, undo가 있는 토스트는 최소 10초로 한다. 되돌리기는 min-h-[44px]로 키운다. ③ 마이 > 기록에 "최근 처리(7일)" 목록과
    [되돌리기]를 둔다. archived·history를 이미 저장하고 있으므로 restoreFromArchive를 재사용한다.
  effort: M

- persona: E2
  screen: 홈 "오늘 한 그릇" [✓ 기록] / "오늘 코디" 옷 이름 칩
  observed: TodayDishCard.tsx:35-43 handleQuickCook은 확인이나 되돌리기 없이 markCooked를 호출한다. useCookLog에 undoLast가
    있는데도 onUndo로 넘기지 않는다. markCooked는 같은 날 중복이면 prev를 그대로 반환해 아무것도 기록하지 않는데, 토스트는
    항상 "${cookCount+1}번째 조리 기록 완료"라고 한다. logReasonsAction도 탭할 때마다 쌓여 추천 학습 신호가 오염된다.
    undoLast(recipeCookLog.ts:43, wearLog.ts 동일)는 "방금 추가한 날짜"가 아니라 "가장 최근 날짜"를 지운다. 과거 날짜로 기록한 뒤
    되돌리면 다른 기록이 사라진다. DailyBriefing.tsx:76은 카드 전체가 Link인데, 그 안의 가로 스크롤 칩 줄은 onClick 즉시
    markWorn(132행)을 호출한다. 스와이프와 탭을 구분하는 임계값이 없다(C9).
  problem: 버튼 하나로 지울 수 없는 통계가 생기고(C9: 만들지 않은 프렌치토스트가 TOP 3·월별 히스토그램에 남음), 토스트 숫자가 실제 기록과 다르다.
  lens: 데이터 무결성 / 문구↔동작
  priority_guess: P1
  cause: 로그 쓰기 API가 "무엇을 썼는지"를 반환하지 않아, 호출부가 정확한 피드백과 되돌리기를 만들 수 없다.
  fix: ① markCooked·markWorn이 {added:boolean, date}를 반환하게 하고, undo(id, date)는 해당 날짜만 제거한다.
    ② 토스트는 added일 때만 "N번째", 아니면 "오늘 이미 기록됐어요"로 하고 onUndo를 필수로 넘긴다. logReasonsAction은 added일 때만 호출한다.
    ③ 라벨은 다른 화면과 같은 "만들었어요"로 한다. ④ 칩 줄은 Link 밖으로 빼고, pointerdown→pointerup 이동량 8px 이상이면 클릭을 무시한다.
  effort: S

- persona: E2
  screen: 홈 "오늘 한 그릇" / 냉장고 > 추천 탭 / 레시피 상세 "보유 중인 재료"
  observed: recipes.ts:1034-1043 matchRecipes는 keyword마다 nameIndex.find를 돌린다. 프렌치토스트 keywords ['식빵','빵',…]는 "통밀 식빵"
    하나에 두 번 걸리고, matchedItems에 같은 품목이 2번 push되며 urgentBoost(+2)도 2배가 된다. 그래서 "보유 중인 재료"에 통밀 식빵이 2번,
    카드 "+3"이 부풀려지고, D-3 식빵 요리가 D-1 감귤·D-2 연어 요리보다 위로 온다(C8). urgentBoost는 dDay와 무관하게 +2로 같다.
    카탈로그에는 이름이 같은 레시피가 3쌍 있다(node로 확인: 떡볶이×2, 프렌치토스트×2(r19 🥞 10분 / r60 🍞 15분), 아보카도 토스트×2).
    그래서 추천 목록에 같은 이름이 두 번 뜨고, 홈 10분 / 추천 15분처럼 수치가 엇갈린다(C8·C9).
  problem: "✓ +3"을 믿었는데 주재료가 없고, 가장 급한 재료를 쓰는 요리가 뒤로 밀린다. 추천의 근거 숫자를 못 믿게 된다.
  lens: 데이터 정합성
  priority_guess: P1
  cause: 매칭을 키워드 단위로 세고 품목 단위로 중복 제거하지 않는다. 긴급도를 버킷의 유무로만 반영한다. 카탈로그 무결성 테스트가 없다.
  fix: ① 히트를 Map<itemName, hit>로 모아 품목당 1회만 센다. ② urgentBoost를 품목별 가중치로 바꾼다(today 3 / soon 1.5).
    ③ recipe.mainKeywords(주재료)를 도입해 주재료가 없으면 "부족: 아보카도"를 카드에 먼저 표시한다. ④ r19/r60 등 중복을 병합하고,
    "레시피 name 유일·id 유일" 단위 테스트를 npm test에 추가한다. "비슷한 레시피"에서는 자기 자신을 제외한다.
  effort: S

- persona: E2
  screen: 등록(+) 직접입력 / 옷장 빠른 추가 / 마이 쇼핑 리스트 [담았어요]
  observed: CartContext.tsx:285 addItems의 중복 키는 `${name}::${category}`다. 소유자와 냉장고·옷장 인스턴스를 보지 않는다. 같은 이름의 두 번째
    구매("서울우유 1L"), 남편 청바지가 있을 때 내 청바지(C4), 두 번째 냉장고의 같은 품목이 모두 막힌다. BottomNav.tsx:138-139는
    "0개 추가 (1개 중복 건너뜀)"을 띄우고, TextImportModal.tsx:1210 handleConfirm은 결과와 관계없이 onClose()를 호출해 입력이 사라진다.
    버튼은 "1개 추가하기"였다(C5). 쇼핑 리스트 [담았어요]는 기존 품목이 있으면 "리스트만 제거했어요"로 새 구매일을 버린다.
  problem: 실제 장보기 패턴(다 먹기 전에 하나 더 사기, 식구마다 같은 옷)을 기록할 수 없고, 새로 산 물건의 유통기한을 추적하지 못한다.
    버튼 문구(1개 추가)와 결과(0개)가 다르다.
  lens: 데이터 모델 / 문구↔동작
  priority_guess: P1
  cause: 중복 방지를 사용자 의도 확인이 아니라 저장 계층의 무조건 규칙으로 구현했다. 수량·로트 개념이 없다.
  fix: ① 중복 키에 ownerId와 instanceId를 포함한다. ② addItems가 conflicts[]를 반환하게 하고, 모달은 conflicts가 있으면 닫지 않는다.
    "새로 산 것으로 따로 추가(구매일 오늘) / 기존 것 날짜 갱신 / 빼기"를 고르게 한다. ③ 쇼핑 리스트 [샀어요]도 같은 선택지를 띄운다.
    ④ 중기적으로 FoodItem에 quantity를 추가한다(파서는 이미 "2개"를 읽으니 C4의 우유 2개도 해결된다).
  effort: M (수량 모델 포함 시 L)

- persona: E2
  screen: 등록 시트 > 직접입력 > "누구 것으로 등록할까요?" 칩 / 유통기한 편집 칸 / "+" 진입 인스턴스
  observed: ① TextImportModal.tsx:906 이름 칸 onBlur → setNameBlurred(true) → 1014행에서 시트 하단에 경고 한 줄(약 27px)이 새로 렌더된다.
    바텀 시트는 아래쪽에 고정되어 있어 콘텐츠가 위로 밀린다. 칩을 누르는 pointerdown(blur 발생)과 click 사이에 칩이 움직여 첫 탭이
    무시된다. C4가 4회 재현했다. 결과적으로 소유자가 '공용'으로 저장된다. ② 한도 초과 시 문구는 "지금은 '공용'으로 등록하고…"인데
    setOwnerId가 그대로라 선택 칩은 "큰아이"로 남는다(C4). ③ 유통기한 Field는 SwipeFoodCard.tsx:408-414에서만
    shelfLifeSource에 따라 "네모아 추정값/직접 확인한 날짜" helper를 붙인다. 등록 모달(TextImportModal.tsx:505)에는 이 helper가 없다.
    "포장에 적힌 날짜" 라벨 아래 추정값이 확정값처럼 미리 채워진다(C1·C8·C9). ④ "+"(프리셋 없음)나 AI 결과로 등록하면
    fridgeInstanceId·wardrobeInstanceId를 찍지 않는다(1175·1185행은 프리셋 경로만). 그래서 2번째 냉장고를 보면서 등록해도
    fridge/page의 `?? fridgeInstances[0]` 폴백으로 1번째 냉장고에 들어간다(지난 라운드 E2 #2의 잔여).
  problem: 가족별·냉장고별 분류가 첫 단추에서 조용히 틀어진다. 추정 날짜가 포장 날짜로 둔갑해 저장된다.
  lens: 상호작용 안정성 / 데이터 무결성
  priority_guess: P1
  cause: 검증 메시지를 레이아웃 흐름 안에 조건부로 삽입했다(layout shift). 같은 필드(유통기한)의 공용 컴포넌트가 없어 두 구현이 갈라졌다.
    "현재 보고 있는 인스턴스"가 전역 등록 경로에 전달되지 않는다.
  fix: ① 경고 줄의 공간을 항상 예약하거나(min-h + visibility), 경고를 제출 시점에만 띄운다. 칩에는 onPointerDown={e=>e.preventDefault()}를
    줘서 포커스 이동을 막는다. ② 한도 초과 시 setOwnerId(undefined)로 상태를 문구와 맞춘다. ③ ExpiryDateField 공용 컴포넌트를 만들어
    shelfLifeSource≠'user'면 "추정" 배지와 helper를 표시한다. 라벨은 "유통기한(포장 날짜를 확인해 고쳐주세요)"로 한다. 두 화면이 이 컴포넌트를 쓴다.
    ④ useFridgeInstances/useWardrobeInstances의 activeId를 BottomNav가 읽어, onImport에서 인스턴스 id가 없는 항목에 찍는다.
  effort: S

- persona: E2
  screen: 설정 "클라우드 백업 Pro"·마이 "Pro 알아보기" → UpgradeSheet [Pro Lite/Max 시작하기]
  observed: UpgradeSheet.tsx:67-69는 클릭 시점에만 PAYMENTS_ENABLED를 확인하고, alert('결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.')를 띄운다.
    렌더(202행)는 플래그와 관계없이 "결제는 토스페이먼츠가 처리합니다"와 [시작하기]를 보여준다. 같은 플래그로 ProPreviewCard.tsx:197은
    "결제 연동 출시 예정"을 표시하고, AiQuotaCard.tsx:106도 "출시 예정"이다(C1·C4).
  problem: 신뢰 훼손. "잠시 후"라는 시간 약속 때문에 사용자가 반복해서 누른다(C4). 같은 앱 안에서 판매 중과 출시 예정이 동시에 보인다.
  lens: 문구↔동작 / 에러 핸들링
  priority_guess: P1
  cause: 기능 플래그를 동작 게이트로만 쓰고, 표현 게이트로는 쓰지 않았다. 일시적 오류와 미출시 상태를 같은 alert 문구로 처리한다.
  fix: ① UpgradeSheet가 !PAYMENTS_ENABLED면 ProPreviewCard와 같은 "출시 예정 · [출시 알림 받기]" 모드로 렌더하게 하고, 결제사 문구와 [시작하기]를 숨긴다.
    ② getPaymentAvailability(): 'live' | 'coming-soon' | 'misconfigured'를 단일 소스로 만들고 3개 화면이 소비한다. ③ alert()를 금지(lint)하고 인라인 상태 메시지를 쓴다.
  effort: S

- persona: E2
  screen: 등록(+) > 텍스트·사진·URL "네모아에게 맡기기" (오프라인 / 결과 0건)
  observed: 오프라인 감지는 OfflineBanner.tsx 내부 state에만 있고, 공유 훅이 없다. TextImportModal은 오프라인에서도 AI 버튼이 활성화돼 있고,
    catch(1147-1148행)는 모든 실패를 "네트워크 오류… 잠시 후 다시 시도해주세요"로 묶는다(C5). 한도는 1131-1134행에서 data.error가 없으면
    차감된다. 그 바로 뒤 "상품 정보를 찾지 못했습니다"(items 0건)인 경우에도 이미 차감된 뒤다.
  problem: 오프라인을 "기다리면 낫는 오류"로 안내해 재시도를 부추긴다. 직접입력이라는 대안도 알려주지 않는다. 결과 0건인데 하루 5회 한도가 줄어든다.
  lens: PWA 오프라인 / 에러 핸들링
  priority_guess: P2
  cause: 네트워크 상태가 전역 상태가 아니다. 에러를 분류하지 않는다. 한도 차감 조건이 "응답 성공"이지 "사용자에게 가치 전달"이 아니다.
  fix: ① useOnlineStatus 공용 훅(useSyncExternalStore)을 만든다. 오프라인이면 AI CTA를 disabled로 하고 "오프라인이에요 · 직접입력은 지금도 돼요 →"를 보여준다.
    ② fetch 에러를 offline / timeout / 429 / 5xx로 분류해 문구를 나눈다. ③ 차감 조건을 `!data.error && data.items?.length > 0`으로 바꾼다.
    텍스트 탭에도 사진 탭처럼 남은 횟수를 표시한다.
  effort: S
```

## 이전 E2 항목(2026-10-15) 상태

| # | 내용 | 상태 | 근거 |
|---|---|---|---|
| 1 | 칸 배지 숫자=총계 + aria 덮어씀 | 완료 | 6c6d7a3 (P0-29 재오픈 해소) |
| 2 | 등록 진입점 맥락·인스턴스 미전달 | 부분 | 칸 상세 프리셋 경로는 6ef693f(P1-109)로 해소. "+"·AI 결과 경로는 인스턴스 미기록이 남음 → 위 등록 시트 finding ④ |
| 3 | UrgentAlert/ExpiredReminder +N 잘림 | 완료(코드) | 두 컴포넌트 모두 NameChips 사용, 부모 truncate 제거 주석 확인. 라이브 재측정은 하지 않음 |
| 4 | 홈 배너 6종 150% 세로 글씨 | 완료 | b145257 (P0-79) |
| 5 | 냉장고 탭 스트립 페이드 | 완료 | eab8fbf (P1-59 재오픈) |
| 6 | 칸 그리드 px 고정 글자(확대 무시) | 미해결 | text-[9-11px] 리터럴이 23개 파일에 남아 있음. C8이 "칸 그리드 10px, 150%에서 그대로"를 재확인 |
| 7 | 임박 색 4곳 독립 구현·대비 미달 | 완료 | 2d74b6b·dec352c (EXPIRY_TONE 단일 매핑) |
| 8 | EmptyState CTA·빈 칩·조기 에러색 | 완료 | cd95afc (P2-55) |
| 9 | 요금제 비교표 Max 열 잘림·관심 버튼 | 완료 | 847c5fa (P1-110) |
| 10 | 요약 "임박 N" 버튼 어포던스 | 미확인 | 코드에서 aria-pressed 미발견. 라이브 미측정 |

## 구조적 원인 (이번 라운드)

1. **의도와 문자열을 혼동했다.** CTA가 의도 타입이 아니라 검색어로, 동사 "담기"가 도메인 타입이 아니라 문구로 표현되어 같은 말이 다른 동작을 한다(히어로 CTA, 장보기/쇼핑 리스트).
2. **"판정"은 단일화됐지만 "표시할 집합"과 "매칭"은 여전히 각자 구현한다.** 임박 뷰 모델과 레시피 매칭 엔진이 각각 3갈래다.
3. **쓰기 API가 무엇을 썼는지 반환하지 않는다.** addItems·markCooked·markWorn이 id나 날짜를 반환하지 않아, 정확한 토스트·되돌리기·충돌 처리를 호출부가 만들 수 없다.
4. **저장소 레지스트리가 없다.** 초기화·백업·복원·필터 정리가 저장소 목록을 각자 안다. IndexedDB 누락, 부분 병합 복원, 유령 필터 id가 모두 여기서 나온다.
