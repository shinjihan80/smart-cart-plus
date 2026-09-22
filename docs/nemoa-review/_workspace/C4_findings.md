# C4 (최지은 34 / 워킹맘·맞벌이 4인) — 부정적/비판적 검토

대상: https://nemoa.vercel.app (커밋 f2b1fdd) · 375×812 모바일, computed font-size 실측 기준(root 18px, text-xs=13.5px/text-sm=15.75px/text-base=18px)

- persona: C4
  screen: 홈 (한 화면 안)
  observed: "지금 바로"="오늘까지 먹어야 할 식품 1개", 주간 인사이트="⚠️ 식품 6개 만료 임박", 하단탭 냉장고 배지="6", 마이 요약="임박 6개".
  problem: 오늘 처리해야 할 게 1개인지 6개인지 정의 차이 설명 없이 홈 한 화면이 두 숫자를 동시에 말한다.
  lens: 알림이 실제 유통기한과 정확히 맞는가
  priority_guess: P0

- persona: C4
  screen: 홈 (히어로 배너 ↔ "지금 가을철 식탁" 카드)
  observed: 배너="지금 아니면 내년까지 기다려야 해요!" vs 아래 카드="이번 주 안에 드셔보세요" — 같은 "제주 감귤 주스"에 대해 서로 다른 기한. "무항생제 달걀"이 제철 재료라는 것도 납득 안 됨.
  problem: 만료 안내에 제철 마케팅 문구가 섞여 기준으로 삼을 수 없다.
  lens: 한 번 신뢰 깨지면 지운다
  priority_guess: P0

- persona: C4
  screen: 홈 ↔ 옷장 코디 탭
  observed: 홈 "오늘 코디" 카드 제안 = Mango 원피스/코스 티/룰루레몬 레깅스. 코디 탭 히어로 = "무인양품 옥스포드 셔츠 코디". 이유 배지 용어도 화면마다 다름("오늘 가장 어울림·오래 안 입음" vs "가을 매칭·오랜만에").
  problem: 같은 "오늘"인데 두 화면이 다른 옷을 추천한다. 같은 로직이라는 느낌이 없다.
  lens: 화면 간 수치·내용 정합성
  priority_guess: P0

- persona: C4
  screen: 옷장 > 코디 탭 (캐러셀)
  observed: 1/6과 6/6 콜라주가 픽셀 단위로 동일, 배지도 동일. 제목만 바뀜.
  problem: 6장 넘겨도 그림이 같으니 넘길 이유가 없다. 탭 5번이 순수 낭비.
  lens: 반복 작업이 빠른가
  priority_guess: P1
  root_cause: outfitMatcher.ts — 신발/액세서리가 매 조합 top-1 고정, C2 리뷰와 동일 원인.

- persona: C4
  screen: 옷장 > 코디 탭 (히어로 카드)
  observed: 제목 "옥스포드 셔츠"인데 콜라주는 티셔츠 그림. 부제 말줄임. 제목 끝글자가 💍 위에 겹침. 화살표(지름 78px)가 콜라주 한복판을 덮음. 1/6에서 ‹ 누르면 6/6으로 감김, 비활성 표시 없음.
  problem: 그림을 믿을 수 없고, 뭘 같이 입으라는 건지 "···"로 잘려 안 보인다.
  lens: 시간 없음 — 한눈에 끝나야 한다
  priority_guess: P1
  note: 제목-반지 겹침은 이 turn에 OutfitCard.tsx 수정, 로컬 검증 필요.

- persona: C4
  screen: 옷장 코디 탭 ↔ 마이 요약 탭
  observed: "아직 안 입어본 옷"이 코디탭 5벌, 마이 요약 옷장정리제안 21벌(본문엔 "한 번도 안 입은 옷 0벌·1번도 안입은옷 21벌" 등 혼재), 착용 로그 분석은 3벌 나열에 값 전부 "—".
  problem: 숫자가 화면마다 다르면 정리 제안을 못 따른다.
  lens: 수치 정합성
  priority_guess: P1

- persona: C4
  screen: 홈 (타이포 위계 — 오늘 조정분 확인)
  observed: 실측 — "오늘까지 먹어야 할 식품 1개" 13.5px, 반면 날씨 20.25px, 섹션 제목 18px, 배너 18px. 급한 줄이 홈에서 가장 작은 축.
  problem: text-sm→text-xs 조정이 하필 제일 급한 줄에 적용돼 중요도 순서가 뒤집혔다.
  lens: 3초 안에 오늘 할 일이 보여야 한다
  priority_guess: P1
  action: 이 turn에서 UrgentAlert.tsx의 품목명 줄을 text-xs→text-sm으로 롤백 완료(로컬 검증 완료, 커밋 대기).

- persona: C4
  screen: 마이페이지 > 요약 탭 (타이포 위계)
  observed: 카드 제목("종합 통계" 등) 13.5px 연회색, 내용 라벨은 15.75px 진한색 — 제목이 내용보다 작고 흐림. 카테고리 분포 숫자가 라벨보다 더 연함.
  problem: 카드 시작/끝을 훑기 어렵다. 봐야 할 숫자가 라벨보다 흐리다.
  lens: 효율 최우선 — 훑어서 찾아지는가
  priority_guess: P1

- persona: C4
  screen: 홈 (히어로 배너 CTA)
  observed: 만료 배너 버튼 "레시피 찾기 →" 하나뿐. "먹었어요/버렸어요" 처리 버튼 없음. 소진 처리(누적) 0건.
  problem: 곧 만료되는 게 주스인데 레시피를 찾으라고 한다. "처리했음" 한 번 누르는 동작이 없어 기록이 끊긴다.
  lens: 반복 작업이 빠른가 / 핵심 동작이 몇 탭인가
  priority_guess: P1

- persona: C4
  screen: 옷장 탭 (WardrobeView 그리드)
  observed: 걸이/서랍 큰 칸이 화면 1/4씩 차지하는데 제목+이모지 3개뿐. 21벌 옷장이 한 화면에 3칸밖에 안 들어옴.
  problem: 가족 옷이 섞인 칸에서 어느 게 누구 옷인지 구분 안 됨. 넓은 카드가 정보 없는 여백.
  lens: 가족 것까지 관리 / 반복 작업이 빠른가
  priority_guess: P1

- persona: C4
  screen: 마이페이지 > 내 정보 탭 · 설정 > 프로필 관리
  observed: 프로필 진입점이 4곳(홈 그리드/홈 헤더/하단탭/마이)인데 "추가" 경로가 없음 — 마이 버튼은 "전환"(대상 1명뿐), 설정 프로필 관리를 누르면 마이페이지로 되돌아옴.
  problem: 4인 가족 나눠 쓰려는데 추가하는 화면을 못 찾았다.
  lens: 가족 프로필 추가·전환 흐름이 명확한가
  priority_guess: P1

- persona: C4
  screen: 마이페이지 > 쇼핑 탭 (제휴 링크)
  observed: 쇼핑몰 링크가 전부 최상위 홈 주소(쿠팡/컬리/네이버쇼핑/이마트/홈플러스). 검색어·장바구니 미전달.
  problem: 냉장고에 뭐가 떨어졌는지 알면서 쇼핑몰에 안 넘겨준다. 이 앱을 거칠 이유가 없다.
  lens: 장보기 연동이 매끄러운가
  priority_guess: P1

- persona: C4
  screen: 홈 · 마이 요약 (문구 품질)
  observed: "3벌 보관할 때"(문장 미완), "21벌· 탭해서"(띄어쓰기 누락), "10분 · 간단· ✓ 통⋯"(잘림+간격 불균일), 높임말/평어 혼용("드신" vs "먹어야 할").
  problem: 문구가 쌓이면 숫자도 대충 만들었겠거니 싶어진다.
  lens: 한 번 신뢰 깨지면 지운다
  priority_guess: P2

- persona: C4
  screen: 홈 (전역 타이포 스케일)
  observed: 홈 한 화면에서 실측 글자 크기 8단계(10/11/13.5/15.75/18/20.25/24/54px). 10px와 11px, 13.5px와 15.75px처럼 붙어 있는 단계가 눈으로 구분 안 됨.
  problem: "폰트를 정리했다"는데 결과는 "작은 글자가 더 많아졌다"에 가깝다.
  lens: 3초 안에 오늘 할 일이 보이는가
  priority_guess: P2

- persona: C4
  screen: 설정 (마이 → 설정 이동 중 확인, 범위 밖)
  observed: "저장 용량" 목록에 영문 내부 키(nemoa-wardrobe-instances 등) 그대로 노출. 상단엔 "알림이 차단됐어요" 배너가 있는데 홈 벨 빨간 점엔 "꺼짐"이라는 말이 없어 "새 알림 있음"으로 착각.
  problem: 알림 차단 상태를 설정 깊숙이 들어와서야 알았다.
  lens: 알림이 실제로 오는가 / 신뢰
  priority_guess: P1

- persona: C4
  screen: 404 페이지 (범위 밖)
  observed: "홈에서 ⌘K로 빠르게 찾아보세요" — 폰에 ⌘ 키 없음, 글리프가 빈 네모로 보임.
  problem: 안내문이 할 수 없는 행동을 시킨다.
  lens: 다음 행동이 명확한가
  priority_guess: P2
