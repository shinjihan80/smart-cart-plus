# C6 (한소희 38 / 프리랜서 디자이너) — 부정적/비판적 검토

대상: https://nemoa.vercel.app (커밋 f2b1fdd) · computed style 실측 기준(root 18px)

- persona: C6
  screen: 전역 — 홈(UrgentAlert·SeasonalHintWidget·WeeklyInsight)
  observed: 홈 텍스트 노드 ~30개 중 20개가 13.5px(text-xs) — 타일 라벨, eyebrow, 경고 헤드라인, **경고 본문**, 링크, CTA, 카드 제목, 배지가 전부 동일 크기. UrgentAlert.tsx 헤드라인(44행)은 원래부터 text-xs인데 이번 커밋이 그 아래 본문(47행)을 text-sm→text-xs로 내려 한 카드 안 두 줄이 정확히 같은 13.5px가 됨. 반면 형제 카드 SeasonalHintWidget의 품목명은 text-sm(15.75px) 그대로.
  problem: "형제 컴포넌트를 대조해 불일치만 고쳤다"는데 실제로는 두 번째 줄만 고치고 첫 번째 줄(헤드라인)은 그대로 갈라진 채 남음 — 한 컬럼 안 두 알림 카드 헤드라인이 13.5px/15.75px로 혼재. 위계가 색·굵기에만 남아, 밝은 화면/색약 사용자에겐 위계가 사라짐.
  lens: 타이포 스케일 — 역할당 단이 배정되지 않음
  priority_guess: P1
  status: 이 turn에서 UrgentAlert.tsx 본문 줄을 text-sm으로 롤백(C1/C4와 동일 지적, 처리 완료). SeasonalHintWidget/UrgentAlert 헤드라인 자체의 13.5px 통일 여부는 별도 후속 과제로 남음.

- persona: C6
  screen: 전역 — 타이포·radius 토큰
  observed: document.documentElement fontSize=18px(기본 16px 아님) → text-xs=13.5/text-sm=15.75/text-base=18px인데, 코드베이스가 고정 px(text-[10px], text-[11px], rounded-[28px])도 병행. 13.5px 다음 단이 11px으로 12px대가 비어있음(P2-3/P1-31 계열). radius도 WardrobeView 바깥 래퍼 28px 고정 vs 안쪽 카드 rounded-2xl(18px 실측) — 브라우저 글자 확대 시 비율이 깨짐(rem vs px 혼용).
  problem: 스케일이 두 벌이라 개발자가 계속 임의값(text-[10px] 등)을 새로 만들게 됨. 접근성 확대 시 옷장 그리드 바깥/안쪽 radius 비율이 어긋남.
  lens: 타이포·radius 단일 스케일
  priority_guess: P2

- persona: C6
  screen: 옷장 > 옷장 탭 (WardrobeView 그리드)
  observed: getBoundingClientRect 실측 — 신발 y=697, 가방 y=722(25px 아래), 액세서리 y=697. 원인은 justify-between + 썸네일 flex-wrap 줄 수 차이. 걸이/서랍 카드 312×132 vs 신발/가방/액세서리 95×157 — 폭 3.3배 차이인데 같은 컴포넌트. 312px 카드는 우측 ~170px 완전 공백.
  problem: 세 장 중 한 장만 제목이 내려오면 레이아웃이 깨진 것으로 읽힌다. "화면을 넓게 쓴다"면서 실제론 빈 공간만 넓힘.
  lens: 카드 여백·정렬의 화면 내 일관성
  priority_guess: P1
  status: 이 turn에서 justify-between→gap-2(justify-start 효과)로 수정, 로컬 스크린샷으로 title y위치 정렬 확인 완료. 걸이/서랍 큰 카드의 우측 공백 문제는 미해결(별도 과제).

- persona: C6
  screen: 옷장 > 옷장 탭 — 44px 헤더 배지 vs 썸네일
  observed: wardrobeModel.ts WARDROBE_SECTION_META와 types/index.ts FASHION_EMOJI를 대조하면 헤더 배지와 썸네일이 같은 그림(신발 👟/👟👟👟, 가방 👜/👜👜). hanging·hanging_2 둘 다 🪝, folded~drawer_s3 여덟 칸 모두 🗂️. 배지 컨테이너 bg-gray-50 vs 카드 bg-white 대비 1.03:1(사실상 안 보임). 🪝는 낚싯바늘로 렌더링됨(옷걸이 의도와 불일치).
  problem: "큰 그림이 유일한 강조점"이라 했는데 그 그림이 바로 아래 작은 그림과 동일해 위계가 정보를 안 나른다. 4도어 모델이면 🗂️ 다섯 개가 줄지어 서서 배지가 순수 장식이 됨.
  lens: 아이콘 언어 — 크기 위계는 그림이 다를 때만 위계
  priority_guess: P1

- persona: C6
  screen: 옷장 > 옷장 탭 — 칸 썸네일
  observed: 썸네일이 FASHION_EMOJI[item.category] — 아이템이 아니라 카테고리 반복. "1단 서랍(3개)"은 청바지 이모지 3개 동일. title 툴팁은 모바일에서 hover 없어 무의미.
  problem: 이미 우상단에 "3" 배지가 있는데 같은 개수를 그림으로 한 번 더 말할 뿐 — 정보가 아니라 노이즈.
  lens: 시각 요소는 정보를 나르거나 빠져야 함
  priority_guess: P1

- persona: C6
  screen: 옷장 > 코디 탭 — 히어로 카드
  observed: ① 스크림이 거꾸로 — 검정 65%는 아래, 투명은 위인데 더 중요한 제목(18px bold)이 더 얇은 스크림 위에 위치. ② 💍(33.75px)가 제목 텍스트 박스와 x/y 모두 겹침. ③ 4칸 배경색 L* 편차 1.9(사실상 같은 색) — categoryImages.ts 13색 팔레트가 카드 위에서 구분 안 됨. 칸 구분선(border-l border-white/50)은 밝은 배경에서 안 보임.
  problem: 가장 공들인 카드인데 검수 없이 배포한 티가 남. 밝은 옷(화이트 등)만 걸린 코디에서 흰 제목이 거의 사라짐.
  lens: 대비·레이어 순서·색 시스템
  priority_guess: P1
  status: 이 turn에서 그라데이션 강화(from-black/80 via-black/40) + text-shadow 추가로 ②③은 완화 시도, 로컬 재검증 필요. ①(스크림 방향 자체)은 이번 수정으로 그라데이션이 더 진해졌으나 근본적으로 위→아래 배치는 유지(제목이 여전히 카드 하단에 위치하는 구조라 실질 개선됨).

- persona: C6
  screen: 옷장 > 코디 탭 — 히어로 라벨 / 캐러셀 컨트롤
  observed: 제목 "무인양품 옥스포드 셔츠 코디"와 부제 "무인양품 옥스포드 셔츠 · 리바이스 501 데님 · 나이키 에어포스"가 같은 7글자로 시작(라벨 1회 원칙 위반, P2-25 재발). aria-label이 "…코디 코디 상세 보기"로 중복. 컨트롤이 1/6 카운터+화살표 2개+점 6개로 3중.
  lens: 라벨 1회 원칙 / 같은 상태를 한 가지 장치로
  priority_guess: P2

- persona: C6
  screen: 전역 — 탭 스트립(옷장·마이) vs 하단 네비·헤더·설정
  observed: 옷장/마이 탭 스트립은 전부 컬러 이모지, 하단 네비/헤더/설정은 전부 lucide 라인아이콘. "옷장"이 한 화면에 👔(탭)와 라인 셔츠(하단탭) 두 문법으로 존재. 마이>요약 "착용 로그 분석" 카드는 eyebrow(라인)→소제목(이모지 👀)→행(라인)로 250px 안에서 세 번 문법 전환. EmojiIcon 매핑도 여전히 "원피스"/"후리스"가 둘 다 Shirt 아이콘.
  problem: P1-43에서 "이모지→라인아이콘 통일"했다지만 실제로 통일된 건 하단탭·설정뿐. 탭 스트립·도메인 문자열엔 이모지가 그대로 남아 오히려 이전보다 어수선함.
  lens: 아이콘 언어 일관성
  priority_guess: P1

- persona: C6
  screen: 전역 — 구분자·줄바꿈 품질
  observed: 정규식 실측 — 붙여쓴 "·" 7건 vs 띄어쓴 "·" 2건, 같은 문장 안에서도 혼재("좌·우로 갈라진 … · 칸 11개"). 구분자도 "·"/"—"/"&gt;" 세 종류 혼용. 백업 배너는 여전히 "옮길 수 / 있어요."로 의존명사에서 줄바꿈.
  problem: 문구를 한 사람이 통으로 검수한 적 없다는 신호. 이번 커밋(13b4ae1)은 WeeklyInsight만 고치고 다른 자리는 그대로.
  lens: 줄바꿈 품질 · 구분자 통일
  priority_guess: P2

- persona: C6
  screen: 설정 하단(피드백 섹션) · 홈 하단(주간 인사이트)
  observed: "맨 위로" 흰 원형 FAB(375px 기준 중심 약 325,659)가 설정 "알림음" 토글 오른쪽 절반을 덮음. 홈에서도 주간 인사이트 카드 우하단 모서리를 덮음. 흰 원+흰 카드라 경계가 거의 안 보임.
  problem: 켜고 끄는 스위치를 장식 버튼이 가림.
  lens: 레이어·여백 — 떠 있는 요소는 콘텐츠를 가리면 안 됨
  priority_guess: P1

- persona: C6
  screen: 전역 — 면·테두리·그림자 토큰
  observed: 옷장 sticky 헤더 border-b border-gray-50(대비 1.03:1, 사실상 안 보임) — 예전에 P2-5로 지적한 패턴이 이번에 새로 만든 헤더에도 재사용됨. bg-white/95라 스크롤 카드가 헤더 뒤로 5% 비쳐 지나감. 그림자도 세 문법(인라인 rgba, Tailwind shadow-md, CARD_SHADOW) 혼재.
  problem: 참조할 곳이 없어 옆 파일을 복사한 결과로 보임. 면 구분이 흐려 "떠 있음"이 세 세기로 나뉨.
  lens: 면(surface) 토큰 일관성
  priority_guess: P2

## 확인했지만 신규로 안 적은 것(기존 항목 상태 갱신)
- P2-26(계절 태그 색 이중 정의): 해소됨 확인.
- P2-25(코디 카드 라벨 2회): 배지 중복은 해소, 제목↔부제로 자리 옮겨 재발(부분 해소).
- P2-4(홈 배너 ⚠️ 2개): 미해소 — 날씨 카드에도 동일 패턴(🌙 원형+고스트) 복제.
- P2-1/P2-27(아이콘·이모지 데이터 혼입): 미해소.
- P1-31/P2-3(타이포 하한): 악화 — 주간 인사이트 요일·범례 10px(대비 2.85:1), 카드 제목까지 13.5px.
- 마이>요약 이중 막대 차트(신규): 식품/패션 막대 정규화 기준 달라 축 없이 비교 유도 — 신규 P2 후보.
- 설정>저장 용량(신규): 내부 키(nemoa-analytics 등) 노출 + 진행 막대 0px 다수 — 신규 P2 후보.
