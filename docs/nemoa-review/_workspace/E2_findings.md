# E2 findings — 이현석 (20년차 프론트엔드·풀스택) — 2026-10-15 (비판 모드, 디자인 비중 강화)

대상 https://nemoa.vercel.app (4805ea2), 375x812, 루트 18px(기본)·27px(150%) 두 크기.

```
- persona: E2
  screen: 냉장고 > 냉장고 탭 > 칸 그리드 빨간 ⏱ 배지 (FridgeView)
  observed: "⏱4"(aria "4개, 임박 1개"), "⏱6"("6개, 임박 1개"), "⏱3"("3개, 임박 3개"). FridgeView.tsx:117 `{expired?'🚫':urgent?'⏱':''}{list.length}` — 숫자는 칸 전체 개수, 색+⏱만 임박. 55~59행 주석과 102~108행(P1-75) 주석이 정면 모순. 버튼 자체 aria-label(97행)이 자식 span의 aria-label을 덮어써 스크린리더는 임박 정보를 아예 못 받음(read_page 확인).
  problem: 신뢰 훼손. 빨간 배지 합(14)이 요약 "임박 6"·하단탭 6·시트 "임박 1"과 전부 다름. P0-29가 P1-75에서 재발. lint는 "판정"만 단일화했지 "표시할 숫자"는 강제 못해 다시 샘.
  lens: 화면 간 수치 일관성 / 접근성
  priority_guess: P0
  cause: "배지 1개로 합치기"로 풀면서 숫자(총계)와 색·아이콘(상태)의 의미를 한 요소에 섞음. 배지 내용을 순수 함수로 분리 안 해 테스트로 못 막음.
  fix: sectionBadge(list) → {tone, count, srText}로 분리, tone이 urgent/expired면 count는 그 상태 개수만. 총개수는 칸 이름 아래 보조 텍스트로. 버튼 aria-label에 임박/기한초과 수 포함, 배지 span엔 aria-hidden. 불변식 테스트 추가.
  effort: S

- persona: E2
  screen: 냉장고·옷장 칸 상세 시트 빈 상태 CTA → 등록 모달 (SectionDetailSheet/WardrobeSectionSheet/BottomNav/TextImportModal)
  observed: 둘 다 payload 없는 Event만 보냄. BottomNav→TextImportModal 경로엔 맥락 전달 통로 자체가 없음. handleManualPick(1122행) food blank는 storageType '냉장'·7일 고정. 추가 발견: BottomNav의 onImport→addItems는 fridgeInstanceId/wardrobeInstanceId를 안 찍음(찍는 곳은 fridge/closet page 내부 경로뿐). 냉장고 2대 이상 사용 시 2번째 냉장고 빈 칸에서 등록하면 품목이 1번째로 저장돼 보던 화면에서 사라짐(코드 경로로 확정).
  problem: 신뢰 훼손+데이터 무결성. 아이스크림이 냉장·7일·냉장실 중앙으로 저장됨. 멀티 인스턴스 사용자는 품목이 엉뚱한 냉장고로 들어감.
  lens: 데이터 무결성
  priority_guess: P1 (멀티 인스턴스 사용자 기준 P0 검토 필요)
  cause: 등록 진입점 9곳이 전부 같은 무인자 전역 이벤트를 공유. "어디서 왔는가"를 실을 타입이 없음.
  fix: RegisterPreset 타입 신설 + openRegister(preset) 헬퍼. BottomNav가 detail을 state로 저장해 TextImportModal에 전달. preset 있으면 바로 confirm 단계로. 활성 인스턴스도 preset에 실음.
  effort: M

- persona: E2
  screen: 홈 > 오늘 할 일 > UrgentAlert의 NameChips "+N" / ExpiredReminder
  observed: UrgentAlert.tsx:103 <p truncate> 안에 NameChips가 한 줄 텍스트로 출력. 텍스트 칸 폭 189px 실측. "...+1"은 244px, "...+3"은 344px 필요해 둘 다 안 보임. 150%에선 칸이 96px까지 줄어듦. ExpiredReminder는 아직 예전 truncate 패턴 그대로.
  problem: Step 6 "완료" 처리됐지만 실사용 조건에서 작동 안 함(C8 재현 확정). 남은 개수 정보가 구조적으로 가장 먼저 잘림.
  lens: 정보 전달
  priority_guess: P1
  cause: "몇 개 보여줄지(max)"만 제어하고 "어디서 잘릴지"는 부모 truncate에 맡김 — 충돌.
  fix: 꼬리를 shrink-0 형제로 분리, 부모 truncate 제거. ExpiredReminder도 NameChips로 전환. 필터 쿼리 파라미터로 바로 이동.
  effort: S

- persona: E2
  screen: 홈 > "알림이 차단됐어요" 카드 외 홈 배너 6종 (150%)
  observed: NotificationOffBanner 기본 텍스트칸 113px→189px 높이, 150%에선 텍스트칸 0px·카드 1396px(세로 한글자씩). w-11 ✕ 칼럼·아이콘 w-9·px-4·gap-3 전부 rem이 원인. 같은 w-11 패턴이 6개 파일(UrgentAlert/ExpiredReminder/RebuyAlert/SeasonChangeAlert/BackupReminderBanner/NotificationOffBanner)에 복제.
  problem: 신뢰 훼손+WCAG 1.4.4/1.4.10 위반. 저시력 사용자가 글자를 키우면 홈 첫 카드가 못 읽는 세로 글씨가 됨.
  lens: 접근성 / 역방향 스케일링
  priority_guess: P0
  cause: 가로 1행에 rem 고정폭 형제 3개(아이콘·CTA·✕)를 두고 남는 폭을 텍스트에 줌. 앱 전반 역방향 스케일링 결함이 배너 패턴으로 6곳 복제.
  fix: AlertBanner 공용 컴포넌트화. ✕를 w-[44px](px 고정), CTA를 본문 아래 별도 행으로. 회귀 테스트로 루트 27·32px에서 텍스트칸 임계 고정.
  effort: M

- persona: E2
  screen: 냉장고 상단 탭 스트립 오른쪽 페이드
  observed: scrollWidth 382/clientWidth 375(7px만 넘침). useScrollHint.ts:28 임계값 2px이라 켜짐, "장보기"의 '기' 흐려짐. 옷장은 같은 문제를 P2-13에서 px-3+snap-x로 고쳤는데 냉장고(fridge/page.tsx:497)는 px-4 그대로라 미적용. 150%에서 진짜 넘치는 FoodSummaryStats·인스턴스 칩 줄엔 힌트 없음. scrollbar-hide 17곳 중 useScrollHint 적용은 3곳뿐.
  problem: "더 있다" 신호가 "글자 깨짐"으로 읽힘, 정작 필요한 곳엔 없음.
  lens: 스크롤 어포던스
  priority_guess: P2
  cause: 탭 스트립이 공용 컴포넌트 없이 복붙돼 쌍둥이 중 한쪽만 수정됨. 훅 임계값 2px이 "레이아웃 버그"와 "콘텐츠"를 구분 못함. 적용이 opt-in이라 누락이 기본값.
  fix: TabStrip 공용 컴포넌트(4개 이하는 grid 균등폭, 스크롤 없음). useScrollHint에 minOverflow(기본 24px) 옵션. ScrollRow 래퍼 + lint로 scrollbar-hide 직접 사용 차단.
  effort: S(냉장고 패딩 즉시) / M(공용화)

- persona: E2
  screen: 냉장고 칸 그리드 텍스트 + px 리터럴 잔여 전역
  observed: 칸 이름 11px·배지 10px·품목 10px(기본·150% 동일, 안 커짐). text-[9-12px] 리터럴 25개 파일 59곳(ProPreviewCard 13 최다). design-system-scope.md가 "overflow 0"으로 해소됐다 기록한 건 텍스트를 px로 얼려 안 커진 결과를 측정한 것.
  problem: 가장 자주 보는 칸 그리드가 가장 작은 글자이고 확대를 무시(WCAG 1.4.4). 오버플로 버그를 접근성 위반과 맞바꿈.
  lens: 접근성
  priority_guess: P1
  cause: 고정 열 그리드라 글자 커질 공간이 없음. px 고정 외 탈출구(열 재배치·리스트 전환) 미설계(P1-27 보류 상태).
  fix: text-xs(rem)로 복귀 + container query로 셀 폭 작으면 "N개"만 표시. 회귀 지표를 "overflow 0 AND fontSize≥루트×0.75"로 변경. lint로 text-[9-11px] 신규 금지.
  effort: M

- persona: E2
  screen: 임박 색상 — 칸 배지/시트 칩/D배지·진행바/요약 카드
  observed: 버킷→색 매핑이 4곳 독립 구현. FridgeView urgent=rose-500(대비 3.7:1), SwipeFoodCard today=caution(5.02:1)/soon=amber-600(3.2:1 미달), 진행바 today=갈색/soon=노랑. globals.css 토큰엔 'soon' 단계가 없어 각자 원색 사용. D-1(갈색)이 D-2(노랑)보다 덜 경고적으로 보임.
  problem: 같은 "임박"이 빨강·분홍·갈색·노랑 4가지. "2일 남음"이 4.5:1 미달.
  lens: 대비·일관성
  priority_guess: P2 (대비 미달분 P1 검토)
  cause: 판정은 단일화했지만 판정→표현 매핑은 단일 소스 없음. 'soon' 토큰 부재.
  fix: EXPIRY_TONE 단일 매핑 + --color-expiry-soon 토큰 신설(4.5:1 이상). 4개 소비처 통일.
  effort: S

- persona: E2
  screen: 칸 상세 시트 빈 상태(EmptyState) / 등록 모달 내용 확인
  observed: EmptyState CTA는 패딩 없는 text-xs 텍스트(18px 높이), touch-target-44 없음. 제목 gray-400(2.5:1). TextImportModal 922~924행 의류 size=''면 빈 알약 그대로 렌더. 900~902행 이름 입력 테두리가 touched 상태 없이 즉시 에러색.
  problem: "미완성·버그처럼 보인다"는 인상. CTA 터치 타깃 미달(C8 "두어 번 빗맞힘").
  lens: 컴포넌트 품질
  priority_guess: P2
  cause: Step 5 공용 컴포넌트가 최소 구현으로만 만들어짐. 칩이 값 유무 미확인. touched 상태가 스타일에 미연결.
  fix: EmptyState CTA를 min-h-[44px] 필 버튼으로. Chip이 children 비면 null 반환. 테두리 조건에 touched 추가.
  effort: S

- persona: E2
  screen: 내 정보 > 요금제 카드 상세 비교 표 / "관심 있어요"
  observed: grid-cols-[8rem_2.8rem_3.2rem_3.2rem]가 기본 18px에서 필요 364px, 카드 안쪽은 290px — 기본 크기에서도 Max 열이 밖에 있음. 이 파일에 9/10/11px 리터럴 13곳(앱 최다). "관심 있어요"는 영구 disabled, 취소 경로 없음.
  problem: 가장 비싼 플랜을 기본 크기에서 볼 수 없음(C2·C9).
  lens: 레이아웃 / 수익모델
  priority_guess: P1
  cause: 4열 비교표를 고정 rem 트랙으로 배치, 단위 혼용(rem 트랙+px 텍스트).
  fix: 모바일에서 "기능별 카드"(라벨+3값 세로 배치)로 재배치. 관심 버튼에 상태 문구+취소 토글 추가.
  effort: S(표 재배치) / M(관심 토글+집계 멱등화)

- persona: E2
  screen: 냉장고 요약 카드 "임박 6" 탭 반응 (C8 "반응 없음" 재현 시도)
  observed: 재현 안 됨 — 클릭하면 음식 탭 전환+필터 정상 작동(fridge/page.tsx:589). 다만 전환 직후 1초간 페이드로 반투명, 탭 밑줄이 안 바뀜. 100ms setTimeout이 애니메이션 종료 전 실행. 버튼에 aria-label·눌림 표시 없음.
  problem: 기능은 작동하지만 버튼처럼 안 보이고 전환 피드백이 늦어 "안 눌린다"로 인지됨.
  lens: 어포던스
  priority_guess: P2
  cause: 통계 숫자를 버튼으로 바꾸며 버튼 어포던스(배경·화살표·aria)를 안 줌.
  fix: aria-label+aria-pressed+활성 시 밑줄. scrollToFridgeItems를 애니메이션 완료 콜백 기반으로.
  effort: S
```

**검토 메모**
- C8의 "알림 차단 카드" 원인 추정(touch-target-44)은 틀렸음을 확인 — 진짜 원인은 rem 단위 w-11 닫기 칼럼.
- C8의 "임박 6 눌러도 반응 없음"은 재현 안 됨 — 기능은 정상, 어포던스 문제로 재분류.
- 신규 발견: 등록 모달이 냉장고/옷장 인스턴스 ID를 안 찍어 멀티 인스턴스 사용자 데이터가 엉뚱한 곳에 저장됨. 칸 배지 aria가 버튼 aria-label에 덮여 스크린리더에 임박 정보 미전달.
- 구조적 원인 4개: ①공용 컴포넌트 부재로 쌍둥이 파일 한쪽만 수정 ②"판정"만 단일화, "표시"는 각자 구현 ③역방향 스케일링을 px로 얼려 접근성 위반과 교환 ④회귀 지표가 "overflow 0"이라 접근성 위반을 통과시킴.
