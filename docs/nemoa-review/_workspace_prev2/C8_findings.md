# C8 (윤미경 42 / 주부·3인) — 부정적/비판적 검토

대상: https://nemoa.vercel.app (커밋 f2b1fdd) · 375×812, 루트 폰트 18px 기본 + 22px 확대 테스트 포함

- persona: C8
  screen: 냉장고 > 🧊냉장고 탭 (FridgeView 칸 그리드)
  observed: 좌우 좁은 칸 카드 제목이 전부 잘림 — "냉동실 …", "냉장실 …", "버터·치…" 등. 좌측 세로 두 칸이 똑같이 "냉동실 …"으로 보여 구분 안 됨.
  problem: 칸 이름조차 안 보여 결국 하나하나 눌러 확인해야 함.
  lens: 카드 텍스트가 잘리는가 / 한눈에 보이는가
  priority_guess: P1
  scope_note: 오늘 세션 변경분(WardrobeView) 아님 — 기존 FridgeView 이슈.

- persona: C8
  screen: 냉장고 > 🧊냉장고 탭 — 글자 크기 확대(18px→22px) 상태
  observed: 확대하면 잘림이 더 심해지고, 상단 "🛒 장보기" 탭이 화면 밖으로 잘려 카트 그림 일부만 보임. 가로 스크롤 표시 없음.
  problem: 폰 글자를 키울수록 앱이 더 안 보인다. 4번째 탭 있는 줄도 모르고 지나침.
  lens: 글자가 충분히 큰가 / 카드 텍스트가 잘리는가
  priority_guess: P1

- persona: C8
  screen: 냉장고 > "도어 중간" 칸 카드
  observed: 빨간 임박 뱃지(⏱1)와 검정 개수 뱃지(1)가 좁은 칸에서 겹쳐 붙고, 검정 뱃지가 카드 밖(회색 배경)으로 삐져나옴.
  problem: 숫자가 겹쳐 "1이 두 개인가 11인가" 헷갈림.
  lens: 임박 식품이 한눈에 보이는가
  priority_guess: P1

- persona: C8
  screen: 냉장고 상단 요약
  observed: "임박 6"이라고만 크게 뜨고 무엇인지 화면에 없음 — 칸 뱃지(⏱3/⏱1/⏱1/⏱1) 4곳을 각각 눌러야 확인 가능. "임박만 보기" 없음.
  problem: "오늘 뭐부터 먹어 치워야 하나"를 알려면 4번 눌러 들어가야 한다.
  lens: 임박 식품이 한눈에 보이는가 / 소비 처리가 쉬운가
  priority_guess: P1

- persona: C8
  screen: 홈 > 상단 히어로 배너
  observed: `가을철 "제주 감귤 주스"가 곧 만료예요. 지금 아니면 내년까지 기다려야 해요!` — "만료"(내 냉장고 얘기)와 "내년까지"(제철 얘기)가 한 문장에 섞임.
  problem: 급한 건지 아닌지 5초 안에 판단 못함.
  lens: 문구의 한국어가 자연스러운가
  priority_guess: P1

- persona: C8
  screen: 홈 > 상단 히어로 배너
  observed: 배너 왼쪽 ⚠️(원 안) + 오른쪽에 똑같은 ⚠️가 초대형·흐리게 한 번 더(카드 모서리에 잘림).
  problem: 같은 경고 그림이 두 번, 하나는 잘린 채 있어 "덜 만들어졌나" 싶다.
  lens: 문구·표시가 믿을 만한가
  priority_guess: P2

- persona: C8
  screen: 홈 > "지금 바로" 섹션
  observed: "임박 6" vs 바로 아래 "오늘까지 먹어야 할 식품 1개"가 나란히 붙음. "제주 감귤 주스"가 배너·경고·가을철식탁 세 군데에 다 등장.
  problem: 20개짜리 냉장고에서 한 품목이 세 번 잔소리.
  lens: 임박이 한눈에 보이는가 / 숫자가 믿을 만한가
  priority_guess: P1

- persona: C8
  screen: 홈 > "가을 옷장 정리 시즌 — 3벌" 카드
  observed: "⇄ 3벌 보관할 때 · 정리하기" — 기호 의미 불명, 문장 미완.
  problem: 개발자 메모 같다.
  lens: 문구의 한국어가 자연스러운가
  priority_guess: P2

- persona: C8
  screen: 옷장 > 👗코디 탭 — 히어로 카드
  observed: 제목 "…디" 위에 💍가 겹침. 흰 제목이 밝은 배경 위에선 거의 안 읽힘.
  problem: 만들다 만 화면 같다. 냉장고 숫자도 못 믿게 된다.
  lens: 카드 텍스트가 잘리는가 / 글자가 보이는가
  priority_guess: P1
  note: 이 turn에서 OutfitCard.tsx 수정(그라데이션 강화+text-shadow), 로컬 검증 필요.

- persona: C8
  screen: 옷장 > 👗코디 탭 — 캐러셀 화살표·점
  observed: 첫 장(1/6)인데 왼쪽 화살표가 오른쪽과 똑같이 활성처럼 보임. 점 6개가 너무 작고 연함.
  problem: 첫 장에서 ‹ 눌렀는데 반응 불확실 — 확인이 흔들린 항목(본인 명시).
  lens: 다음 행동이 명확한가
  priority_guess: P2
  caveat: 검토자 본인이 "확인이 흔들렸다"고 명시 — 재현성 낮음.

- persona: C8
  screen: 옷장 > 👔옷장 탭 — 신발/가방/액세서리 3칸 그리드
  observed: 아이콘 잘림은 없어짐, 그러나 세 카드 제목 높이가 안 맞음(가방만 한 줄 아래).
  problem: 나란한 세 칸 글씨가 삐뚤빼뚤.
  lens: 카드 텍스트가 잘리는가 / 화면 간 일관성
  priority_guess: P2
  status: 이 turn에서 WardrobeView.tsx justify-start로 수정 완료, 로컬 검증됨(정렬 확인).

- persona: C8
  screen: 내 정보 > 📊요약 탭
  observed: 백업 카드 "…옮길 수 / 있어요."로 단어 중간 줄바꿈. "21벌· 탭해서"에서 띄어쓰기 누락.
  problem: 쌓이면 "대충 만든 앱" 인상.
  lens: 문구의 한국어가 자연스러운가
  priority_guess: P2

- persona: C8
  screen: 내 정보 > 📊요약 탭 — 제철 재료 섹션
  observed: "아직 못 드신 가을철 재료 16/16" — "16/16"이 직관적으로 "다 했다"로 읽히나 실제론 "0개 먹음".
  problem: 숫자 표기가 반대로 읽힌다.
  lens: 숫자가 믿을 만한가
  priority_guess: P1

- persona: C8
  screen: 내 정보 > 👤내 정보 탭 — AI 한도 카드
  observed: 카드 제목 "매일 00시 리셋" vs 항목 "사진 분석 (월간) 10/10" — 모순.
  problem: 하루치인지 한달치인지 몰라 아예 안 누르게 된다.
  lens: 숫자·문구가 믿을 만한가
  priority_guess: P0

- persona: C8
  screen: 404 페이지
  observed: "⌘K로 빠르게 찾아보세요" — 폰에 없는 키.
  lens: 다음 행동이 명확한가
  priority_guess: P2

- persona: C8
  screen: 홈/옷장/코디 하단 빈 공간
  observed: 마지막 카드 아래 화면 절반 가까이 빈 회색 공간(~600px).
  problem: "아직 안 불러왔나" 하고 계속 내려보게 됨.
  lens: 화면이 다 나온 건지 알 수 있는가
  priority_guess: P2

- persona: C8
  screen: 냉장고 탭 vs 옷장 탭 상단 칩
  observed: "냉장고 1 유형 변경" vs "옷장 1 구성 변경" — 같은 역할인데 다른 단어, 글자 11px로 화면 최소.
  problem: 다른 기능인가 하고 멈칫함. 읽으려면 폰을 가까이 대야 함.
  lens: 글자가 충분히 큰가 / 문구가 명확한가
  priority_guess: P2
