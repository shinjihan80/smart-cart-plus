# E1 findings — 김태원 (20년차 서비스 기획) — 2026-10-15 (비판 모드, 디자인 비중 강화)

대상 https://nemoa.vercel.app (4805ea2). 라이브 실측: /fridge(샘플 41개), 홈, /mypage?tab=profile#plan. 코드 교차 확인: FridgeView.tsx, SectionDetailSheet.tsx, BottomNav.tsx, TextImportModal.tsx, ProPreviewCard.tsx, docs/design-system-scope.md, 수정목록.md(P0-29, P1-75, P1-51, P1-68, P1-38).

```
- persona: E1 (김태원 / 20년차 서비스 기획)
  screen: 냉장고 > 냉장고 탭 칸 그리드 배지 (FridgeView) ↔ 요약 "임박 6" ↔ 하단탭 배지 6 ↔ 내 정보 "⚠️ 임박 6개"
  observed: 배지는 "⏱3 | 3개, 임박 3개", "⏱4 | 4개, 임박 1개", "⏱6 | 6개, 임박 1개", "⏱1 | 1개, 임박 1개". 빨간 배지 합 14인데 요약·하단탭·내 정보는 모두 6. FridgeView.tsx:117 `{expired?'🚫':urgent?'⏱':''}{list.length}`. 같은 파일 55~59행 주석("총 개수 배지는 항상 중립색, 임박 개수는 별도 배지로 분리")이 실제 코드와 정반대. C8·C9 독립 발견.
  problem: 신뢰 훼손. P0-29(완료)가 고친 걸 P1-75(G44)가 "배지 하나로 통합"하며 되돌렸다. 근거는 "셀 테두리 색이 이미 긴급도를 알려주니 정보 손실 없다"였으나 실제로 사용자는 빨간+시계+숫자를 "급한 개수"로 읽는다. design-system-scope.md도 P1-75를 성공 사례로 들고 있다 — 트랙 전체가 회귀를 성공 사례로 깔고 출발.
  lens: 배지·수치의 의미 일관성
  priority_guess: P0

- persona: E1
  screen: 전역 '임박/내일까지' 수치 — 홈/하단탭/냉장고 요약·칸 배지·칸 시트/내 정보 활동요약
  observed: 같은 홈 화면에 "내일까지 먹어야 할 식품 1개"와 하단탭 "6"이 동시에 뜸. classifyExpiry를 인라인 직접 호출하는 곳이 fridge/page 4·FridgeView 2·SectionDetailSheet 2·SwipeFoodCard 2·TextImportModal 2곳. 공용 셀렉터(summarizeFoods·selectExpiring)가 있는데도 그렇다. EXPIRY_LABEL.soon='임박'은 D-2~3만인데 집계 "임박 6"은 D-0~3 전체.
  problem: 같은 계열 버그가 7번째 재발(P0-10/29/30/53/68/72 + 이번). 공용 셀렉터는 있지만 쓰도록 강제하는 장치가 없다.
  lens: 배지·수치의 의미 일관성
  priority_guess: P1

- persona: E1
  screen: 냉장고·옷장 칸 상세 시트 빈 상태(EmptyState) > "식품/의류 등록하기" → 등록 모달
  observed: SectionDetailSheet.tsx:100, WardrobeSectionSheet.tsx:93 둘 다 detail 없이 `new Event('nemoa:open-register')`만 보냄. 식품을 고르면 기본값 "❄️냉장·7일"/"냉장실 중앙"으로 고정. 냉동실 위칸에서 들어와도 그 정보가 안 넘어감.
  problem: 카피는 "이 칸에 넣는다"는 기대를 주지만 실제는 맥락을 다 버린다. 아이스크림이 냉장 7일로 조용히 저장될 수 있다(데이터 정합성 신뢰 훼손). P1-13(빈 상태 CTA)을 "제품 결정 필요"로 범위에서 뺐는데 EmptyState CTA는 결국 출시했다 — 결정은 미루고 버튼만 달았다.
  lens: 첫 실행~첫 등록 전환 설계 / 핵심 흐름 마찰
  priority_guess: P1

- persona: E1
  screen: 오늘 세션의 디자인 시스템 트랙(docs/design-system-scope.md Step 1~6) 전체
  observed: 완료 기준이 "tsc/eslint/build/test 통과 + 시각 회귀 0건"뿐이고 "원 제기 페르소나의 문제가 사라졌는가"가 없다. NameChips "+3"이 375px에서 실제로 안 보임(C8). AppHeader는 겉 래퍼만 합쳤고 "액션 슬롯 순서 고정"은 빠짐. 아이콘 통일은 탭 스트립 3줄로 끝났고 바로 아래는 다시 이모지(C6). useScrollHint 페이드가 7px만 넘치는 곳엔 뜨고 정작 Max 열이 잘린 요금제 표엔 없음(C2·C9).
  problem: 코드 위생 면(CARD/헤더 복제 제거, radius 토큰, 터치타깃 11곳)은 실제 성과. 하지만 '완료' 표시 상당수가 사용자 화면에서는 해소되지 않았다. 수정목록의 '완료'가 '컴포넌트를 만들었다'는 뜻이 되면 경영 판단 도구로서 신뢰를 잃는다.
  lens: 기능 우선순위 / 앱의 가치가 지표로 증명되는가
  priority_guess: P1

- persona: E1
  screen: 냉장고 IA — 탭 스트립 "냉장고/음식/추천/장보기" + 요약 "임박 6" 버튼 + 칸 배지
  observed: "임박 6"은 실제로 button(fridge/page.tsx:589 onUrgent)이나 버튼 모양 단서가 없음(C8 "눌러도 반응 없음"). 빨간 칸 배지를 누르면 임박 필터 없이 칸 전체 목록이 열림 — 같은 '임박' 신호인데 진입점마다 결과가 다름. C9: "냉장고 화면 안에 또 냉장고 탭".
  problem: 보기 방식(view)과 기능(추천·장보기)이 같은 탭 계층에 섞여, 같은 정보로 가는 길이 둘이고 결과도 다르다.
  lens: 진입 경로 중복·과잉 / IA
  priority_guess: P1

- persona: E1
  screen: 내 정보 > NEMOA 요금제(ProPreviewCard) / 등록 모달 URL 탭 "플랜 업그레이드 →"
  observed: 가격은 기본 노출, Pro가 뭘 더 주는지는 접힌 비교 안에 있고 펼치면 Max 열이 잘림(C2·C9). "현재/무료/무료" 중복. "관심 있어요"는 결과 설명 없이 "완료 ✓"로 굳음. 0e94758 집계는 opt-in 기기만 POST, 노출 수(분모) 미집계. "플랜 업그레이드 →"는 구매 불가 카드로만 이동(C9 "속은 기분").
  problem: 수익모델의 유일한 PMF·WTP 신호가 측정 설계 단계부터 오염. "업그레이드"라는 동사가 할 수 없는 행동을 약속(카피-동작 모순).
  lens: 수익모델 메시지 정합성 / 미출시 기능 노출로 인한 기대-실망
  priority_guess: P1

- persona: E1
  screen: 옷장 > 코디 탭 캐러셀(OutfitCard) / 코디 상세 > 공유
  observed: 1/6·2/6·3/6이 같은 파란 폴로 이모지. 신발 3종(운동화·샌들 포함)이 같은 운동화 이모지. 틴트 -50→-100해도 4칸 중 3칸이 같은 파랑 계열(C2·C6). 공유 PNG는 이모지 콜라주, 로고 없음.
  problem: 옷장의 핵심 약속 "내 옷으로 오늘 코디"가 '카테고리 아이콘 4개 조합'으로 전달돼 6개 추천이 같은 그림으로 보인다. 추천 엔진의 실제 다양성이 전달되지 않는다.
  lens: 핵심(옷장) 가치 전달 / 리텐션
  priority_guess: P1

- persona: E1
  screen: 홈 > 히어로 배너 + 바로 아래 "오늘 할 일"
  observed: "좋은 아침이에요 / 제주 감귤 주스, 내일까지 드세요. 지금이 가을 제철이라 맛이 가장 좋아요." 바로 아래 "오늘 할 일"에 같은 품목이 "내일까지 먹어야 할 식품 1개"로 재등장. P1-51/P1-63 "B안 완료"인데 C8이 3라운드째 "급하다는 건지 맛있다는 건지" 재지적.
  problem: 히어로가 인사·경고·제철 마케팅을 한꺼번에 맡아 첫 화면 상단 두 블록이 중복된다.
  lens: 핵심 vs 부가 경계
  priority_guess: P1

- persona: E1
  screen: 홈 "아직 백업한 적 없어요" 카드 ↔ 내 정보 백업 배너
  observed: 홈은 중립 회색+버튼 없음(카드 전체가 링크, C9). 내 정보는 amber 경고문+[지금 백업] 버튼(C6). 같은 행동이 화면마다 다른 톤과 경로.
  problem: 백업 동기부여 메시지가 엇갈려 행동을 막는다.
  lens: 리텐션 / 메시지 정합성
  priority_guess: P2
```
