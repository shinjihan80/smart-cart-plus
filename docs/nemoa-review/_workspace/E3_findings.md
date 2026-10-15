# E3 findings — 박세라 (20년차 UX·UI 디자이너) — 2026-10-15 (비판 모드, 디자인 비중 강화)

대상 https://nemoa.vercel.app (4805ea2). C2·C6·C8·C9 발견을 바탕으로 src 코드 정량 감사.

**총평**: C6의 핵심 비판("토큰은 만들었는데 적용 규칙이 없다")은 타당함을 실측으로 확인. 상태 토큰(danger/caution/info) 사용 88회 vs Tailwind 원색 직접 사용 187회. ink-muted/ink-secondary 0회, text-gray-400 369회 그대로. radius 토큰 65회 vs Tailwind 기본 243회. `<Surface>` 호출부 0곳, Badge 컴포넌트 자체가 없어 즉석 알약 마크업이 44곳·41파일.

```
- persona: E3
  screen: 전역 — 디자인 시스템 구조
  observed: 토큰 선언은 있으나 적용률 낮음(위 총평). Surface.tsx variant가 역할이 아니라 출처 기준(bordered=fridge·closet, plain=mypage·home). eslint에 className 규칙(원색 팔레트, gray-400, text-[Npx], rounded-xl/2xl) 0개.
  problem: "디자인 시스템을 했다"는 변경이 화면에서 체감되지 않는다(C6). 새 기능 추가 시마다 원색이 다시 들어올 구조.
  priority_guess: P1
  cause: Step 1~6을 "리터럴 치환+복제 제거"로만 정의, "어떤 상황에 어떤 토큰을 쓰는가" 규칙층과 강제 장치가 범위 밖.
  fix: 사용 규칙표 신설 + 의미 컴포넌트 4종(StatusText/Badge/Callout/Surface) + eslint no-restricted-syntax로 원색 차단.
  effort: L

- persona: E3
  screen: 냉장고 칸 그리드 배지/칸 상세 시트/냉장고 요약/홈 히어로
  observed: 같은 ExpiryBucket이 컴포넌트마다 다른 색. FridgeView urgent=rose-500/expired=red-700, SectionDetailSheet rose-600/100, SwipeFoodCard today=caution/soon=amber(대비 3.2:1 AA 미달), FoodTags 자체 4단 매핑(이름부터 다름), fridge/page 격자는 red-500/orange-400. HeroMessage TONE.urgent=TONE.insight(둘 다 brand-primary)라 "좋은 아침이에요"+경고 삼각형이 공존.
  problem: 한 시트 안에서 같은 심각도가 빨강·주황·노랑 3가지(C6·C8). D-1이 D-2보다 덜 눈에 띄는 역전도 있음.
  priority_guess: P1
  cause: 판정은 expirySelectors로 단일화했지만 버킷→표현 매핑에 단일 소스 없음. Step 2 재배치가 brand-warning 쓰던 곳만 대상이라 원래 원색 쓰던 곳은 감사 밖.
  fix: statusStyle.ts 단일 매핑(색상 2개만, 단계는 채도·채움으로). HeroMessage TONE.urgent 분리.
  effort: M

- persona: E3
  screen: 냉장고 칸 그리드 "⏱N" 배지
  observed: FridgeView.tsx:117, 합계 14 vs 요약 "임박 6". 칸 버튼 aria-label에 임박 정보 없음. 이 구조는 P1-75에서 E3(본인) 제안으로 나온 결과.
  problem: 신뢰 훼손, P0-29 재발. "숫자 하나만 남기자"는 판단에서 그 숫자가 뭘 세는지를 색과 분리한 게 오류 — 본인 제안이 틀렸음을 인정.
  priority_guess: P0
  cause: 배지 색(상태)과 숫자(전체 개수)가 다른 데이터를 인코딩.
  fix: 전체 개수는 칸 이름 줄 중립 텍스트로, 상태 배지는 urgent/expired일 때만 그 개수 표시. aria-label에 임박 수 포함.
  effort: S

- persona: E3
  screen: 냉장고 요약 "실온"/코디 "안 입어본 의류" 칩/계절 표현/주간 인사이트
  observed: 실온 수치 amber-600(soon과 동일값). 계절 색(가을 orange, 여름 amber)도 상태색과 겹침. "안 입어본 의류" 칩이 caution 토큰과 사실상 동일. 백업 독려가 홈(중립)과 마이(caution)로 다름.
  problem: 주황·황토가 '주의'·'가을'·'실온'·'안 입은 옷'을 동시에 뜻해 경고 피로 유발.
  priority_guess: P2
  cause: "상태색 예약" 규칙 없음, 범주형 팔레트 미정의.
  fix: 따뜻한 색(amber/orange/rose/red)은 상태 전용 예약, 범주형 정보는 중립 칩으로.
  effort: S

- persona: E3
  screen: 홈 오늘 코디/옷장 OutfitCard/코디 상세/레시피 카드 — 추천 사유 배지
  observed: outfitMatcher.ts가 이모지를 문자열로 reasons에 직접 박음. 렌더 3종이 각자 다름(DailyBriefing 텍스트, OutfitCard 흰 알약이 이미지 가림, OutfitDetailModal 다른 알약). TodayDishCard·RecipeSection은 이모지 포함 문자열을 includes()로 비교해 분기.
  problem: 같은 정보가 화면마다 다른 모양(C6). 문자열 비교라 카피 변경 시 로직이 조용히 깨짐.
  priority_guess: P2
  cause: Reason이 타입이 아니라 표시용 문자열. Badge 컴포넌트 부재로 각자 스타일.
  fix: Reason을 {kind, label} 타입으로, 아이콘·톤은 REASON_STYLE 한 곳에서. 공용 Badge 컴포넌트 신설.
  effort: M

- persona: E3
  screen: 전역 아이콘 — 탭 아래 칩/섹션 제목/AI 한도/가족 칩/등록 모달/장보기 칩
  observed: EmojiIcon.tsx가 매핑 실패 시 원본 이모지로 폴백 — 배·전어는 라인아이콘, 고구마·밤은 이모지로 한 줄에 섞임(C9). 매핑도 손실적(달걀→Beef 고기, 바나나→Apple). 앱 크롬에 이모지 하드코딩 TSX 69파일 665개, lib 16파일 340개. 탭 스트립 3곳만 LucideIcon 타입 강제.
  problem: 탭만 라인아이콘이고 탭 아래는 이모지 세계로 복귀(C6·C2·C9 3인). 잘못된 매핑이 정보 오류 생성(달걀=고기).
  priority_guess: P1
  cause: "크롬=라인아이콘, 사용자데이터=이모지" 원칙은 문서에 있으나 EmojiIcon이 실패 시 이모지로 떨어지는 우회로를 제공.
  fix: EmojiIcon을 UiIcon(의미ID, lucide 전용)과 ItemGlyph(사용자 데이터 전용)로 분리. 섹션 메타·AI한도·가족 칩의 emoji 필드를 LucideIcon으로 타입 전환.
  effort: L

- persona: E3
  screen: 옷장 코디 탭 OutfitCard/공유 이미지/장보기 빠른 추가 칩
  observed: 사진 없으면 카테고리 이모지 1개를 175px 칸에 렌더 — 상의 3벌이 같은 폴로 이모지, 신발 3벌(샌들 포함)이 같은 운동화 이모지(C2). 칸 비율 175:117 비대칭, 하단 다크 띠가 앱 유일. 정육·계란 카테고리 이모지(🥩)가 달걀 썸네일로 쓰임(C9).
  problem: 카테고리 기호를 품목 얼굴로 써서 서로 다른 옷이 같은 그림이 되고 정보가 오도됨. 메인 기능이 장난감처럼 보임(P1-38 재현).
  priority_guess: P1
  cause: "사진 없음" 상태를 디자인된 상태로 정의 안 함. 품목 고유 정보가 콜라주에 미반영.
  fix: 타이포 타일(품목명 2줄+색점+카테고리 아이콘)을 기본 상태로. OutfitCard 레이아웃을 2x2 균등 또는 1+3 스택으로 고정. 식품 썸네일은 키워드 하위 사전 우선 적용.
  effort: M

- persona: E3
  screen: 마이(한 화면)/홈/냉장고·옷장/칸 상세 시트 — 카드 표면
  observed: 한 스크롤 안에 4가지 표면(27px 무테두리, 36px caution 테두리, 36px gray-50 테두리, 18px 테두리). Surface 호출부 0곳. radius 토큰 65회 vs 기본 243회.
  problem: 스크롤할 때마다 모서리·테두리·그림자 조합이 바뀜(C6).
  priority_guess: P2
  cause: Surface variant 명명이 역할 대신 출처 기준이라 선택 기준이 생길 수 없음.
  fix: 역할 기반 level(section/nested/callout) 규칙 확정, bordered/plain을 plain으로 통합. @theme에서 기본 radius 재바인딩.
  effort: M

- persona: E3
  screen: 마이 백업 배너/홈 알림 차단·백업 카드/요금제 가격
  observed: 배너 제목(13.5px)이 본문(15.75px)보다 작음 — 위계 역전. 가로 1행 구조라 텍스트 칸이 좁아 150%에서 세로 글씨 붕괴(C8). 요금제 가격이 9-10px로 화면 최소 글씨.
  problem: 어디부터 읽을지 모름. 글자 키우면 홈 첫 카드가 못 읽는 세로 글씨로 붕괴(C8 P0 제기).
  priority_guess: P1
  cause: 역할 타이포 토큰(title/body/caption/numeral) 부재. 배너가 공용 Callout 없이 가로1행+우측액션 패턴으로 반복 구현.
  fix: 역할 타이포 유틸(t-title/t-body/t-caption/t-numeral) + 공용 Callout 컴포넌트.
  effort: M

- persona: E3
  screen: 홈·냉장고·옷장·마이 AppHeader/냉장고 탭 스트립
  observed: 오른쪽 액션이 화면마다 다름(홈: 벨+사람, 냉장고·옷장: 검색, 마이: 검색+톱니). 마이는 "내 정보"가 헤더+첫탭+하단탭 3중 반복. 냉장고 탭 스트립 7px만 넘치는데 페이드가 "장보기"를 덮음(4인 공통 지적).
  problem: 오른쪽 위 아이콘 위치를 손이 기억 못함. 페이드가 "더 있음"이 아니라 렌더 오류로 읽힘.
  priority_guess: P1
  cause: AppHeader가 래퍼 복제 제거만 하고 슬롯 순서 규칙 미포함. useScrollHint가 1px만 넘쳐도 페이드.
  fix: 고정 슬롯 API([검색][알림][화면별 1개]). 탭 4개 이하는 grid 균등폭으로 스크롤 자체 제거.
  effort: S

- persona: E3
  screen: 등록 모달 옷 등록/마이 가족 추가 선택 칩
  observed: TextImportModal.tsx:901 이름 미입력 상태부터 border-rose-300. 빈 알약(16x7px) 무조건 렌더. 선택 칩 색이 화면마다 다름(공용 gray-900 vs 가족 brand-primary).
  problem: 시작도 안 했는데 혼나는 느낌. 빈 칩이 렌더 버그처럼 보임.
  priority_guess: P2
  cause: 폼 검증 상태를 공용 컴포넌트가 소유 안 함. 칩 렌더러에 빈 값 가드 없음.
  fix: Field에 touched 기반 state 추가. SelectChip 공용 컴포넌트(빈 label이면 null 반환).
  effort: S

- persona: E3
  screen: 칸 상세 시트 영양 줄/식품 카드/코디 탭 안내/코디 상세 제목/마이 배너
  observed: "지 / 11g", "87일 / 남음" 등 라벨-값 줄바꿈 분리. 문장부호로 시작하는 줄. 대응이 일회성 NBSP 패치뿐.
  problem: 줄바꿈 품질이 완성도를 가장 먼저 드러냄(C6). 숫자-단위 분리는 정보 판독 지연(C8).
  priority_guess: P2
  cause: "분리 불가 단위" 표시 공용 수단 없음. 좁은 텍스트 칸이 증상을 증폭.
  fix: text-wrap: balance/pretty 전역 규칙. Metric 컴포넌트로 라벨-값-단위 묶음.
  effort: S
```

**E3가 결정한 사항(디자인 판단 보류 해소)**
- 카드 표면: bordered/plain → plain 하나로 통합, 계층 기반 규칙.
- 상태색: 색상은 danger(빨강)/caution(황토) 2개만. 노랑·주황은 상태 표현에서 폐기.
- 이모지: 앱 크롬에서 금지, EmojiIcon 자동 fallback 제거.
- 사진 없는 품목: 카테고리 이모지 대신 타이포 타일을 기본 상태로.

**연계/상충**: 사진 없는 품목 표현(타이포 타일)은 E1의 사진 유도(P1-38)와 상충 아닌 병행. 마이 헤더 명명은 E1 IA 영역. 150% 알림 카드 붕괴의 P0 판정은 E2가 재현 확인함.
