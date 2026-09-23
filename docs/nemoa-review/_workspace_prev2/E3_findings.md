# E3 (박세라 / 20년차 UX·UI 디자이너) — 부정적/비판적 전문가 검토

대상: https://nemoa.vercel.app (커밋 515270d) · 375×812, root 18px, 실측(CIELAB/대비비) 포함

- screen: 옷장 > 코디 탭 — OutfitCard 히어로 스크림
  observed: 카드 292×219, 오버레이 99px. 그라데이션 from-black/80 via-black/40 to-transparent. 제목(18px/700 흰색)은 오버레이 상단 36~64% 구간(알파 0.29~0.51), 부제(13.5px/400)는 하단 66~84%(알파 0.53~0.67) — 덜 중요한 줄이 약 2배 진한 스크림. 제목 알파 0.29 지점 대비 1.55:1, 가장 진한 지점도 2.17:1(18px/700 large-text 기준 3:1 필요, 미달).
  problem: 이번 세션 수정(그라데이션 강화+text-shadow)은 스크림 방향(위→아래 알파 증가) 자체를 안 바꿔 위계 역전이 수치상 그대로 남음. text-shadow는 WCAG 대비 계산에 미포함 — "고쳤다"고 기록되지만 측정하면 여전히 실패. 미봉책.
  lens: 대비·레이어 순서
  priority_guess: P1
  fix: 오버레이를 텍스트 뒤 불투명 플레이트로 교체 — 상단 20%만 페이드, 텍스트 위치 80%는 평탄 0.75+ 유지. 또는 텍스트 블록을 카드 밖 불투명 밴드로 분리(권장).
  effort: S
  status: 이 turn에서 OutfitCard.tsx를 grid-rows 구조로 재설계 — 콜라주/라벨을 완전히 분리된 두 영역으로 나누고 라벨은 불투명(bg-gray-900) 밴드로 변경, 로컬 검증 예정.

- screen: 옷장 > 코디 탭 — 💍 액세서리 슬롯 ↔ 제목 충돌
  observed: 💍 y144~185가 제목 밴드 y155.6~183.4를 세로 100% 덮음. 가로도 제목 끝 20px 중첩.
  problem: C6 ②는 미해결 — 기하를 안 건드리고 스크림만 진하게 해서 겹침 자체는 그대로.
  priority_guess: P1
  fix: grid-rows-[1fr_auto]로 콜라주/라벨 완전 분리, 라벨 밴드 불투명 고정 높이 → 겹침 구조적으로 불가능.
  effort: S
  status: 이 turn에서 수정 반영, 로컬 검증 예정.

- screen: 옷장 > 코디 탭 — 스크림이 콜라주를 잡아먹음
  observed: 오버레이 99px/카드219px=45%가 검정 그라데이션. 하의(👖) 이모지의 약 70%가 검게 덮임.
  problem: "라벨이 안 읽힌다"를 "옷이 안 보인다"로 바꾼 등가교환 — 개선이 아님.
  priority_guess: P1
  fix: 라벨을 카드 밖/하단 불투명 밴드로 분리, 콜라주는 4:3 전체 사용.
  effort: S
  status: 위와 동일 수정으로 해결.

- screen: 옷장 > 코디 탭 — 4분면 색 시스템(categoryImages.ts)
  observed: CIELAB 실측 — 상의↔신발 ΔE*ab 1.78(JND 2.3 미만=구분 불가). 13개 팔레트 전부 Tailwind -50 틴트(L*95~98).
  problem: "확실히 갈리는 색으로 재배정" 주석과 실제 렌더가 불일치.
  priority_guess: P2
  fix: CategoryTone을 {bgSoft,bgSolid,fg,emoji}로 확장, 콜라주처럼 색끼리 맞붙는 곳은 -100/-200단 사용. 구분선을 불투명 border-white 또는 outline으로.
  effort: M
  note: 이번 세션에서 미적용 — 별도 백로그.

- screen: 전역 — 타이포 스케일 (f2b1fdd)
  observed: 홈 텍스트 47개 실측 — 13.5px 57%. f2b1fdd 변경 12개 중 7개가 text-gray-400(대비 2.54:1, 이미 AA 미달)을 더 작게 만듦. 임의 px 9종 85곳.
  problem: "위계 정리" 커밋의 실제 효과는 위계 제거. 캡션 하한이 없어 다음 개발자도 임의 px를 또 만들 것.
  priority_guess: P1
  fix: @theme inline에 역할 기반 5단 토큰(display/title/body/caption/micro) 선언, micro=0.8125rem을 하한으로. caption 이하엔 gray-500 이상만 허용. text-[ 금지 가드.
  effort: L
  note: 세션 범위 밖 — 백로그(spawn_task 권장).

- screen: 홈 — UrgentAlert 카드 내부 위계 역전
  observed: 헤드라인 text-xs(13.5px, 대비 2.83:1) < 본문 text-sm(15.75px, 이번 세션에 복구됨). 본문만 복구하고 헤드라인은 그대로라 역전이 새로 생김.
  problem: 수정 전엔 둘 다 13.5px로 최소 동률이었는데, 이번 수정으로 헤드라인이 더 작아지는 역전이 새로 발생.
  priority_guess: P1
  fix: AlertCard 단일 컴포넌트로 통합, eyebrow/headline(18px bold)/body 슬롯 고정. 위험 표시는 크기 대신 좌측 컬러바+아이콘 색. brand-warning(#EF4444, 3.76:1)은 텍스트용으로 부적합 — #DC2626(4.83:1) 별도 토큰 분리.
  effort: S
  note: 세션 범위 밖 — 백로그.

- screen: 전역 — html { font-size: 18px } (globals.css:52)
  observed: 루트 폰트 px 하드코딩 확인. 사용자가 OS 글자를 20/24px로 키워도 앱은 항상 18px. radius도 px/rem 혼용 6종 66곳.
  problem: rem이 사실상 px의 다른 표기가 됨 — WCAG 1.4.4 취지 위반. 스케일이 px로 굳어 임의값이 151곳까지 번진 공통 뿌리.
  priority_guess: P1
  fix: html { font-size: 112.5% }로 교체(기본16px 환경에서 18px 유지, 사용자 확대시 비례). radius 토큰 3단 선언 후 치환.
  effort: M
  note: 세션 범위 밖 — 백로그, 8건 findings의 공통 뿌리로 최우선 권고.

- screen: 옷장 > 옷장 탭 — WardrobeView 카드 컴포넌트
  observed: 걸이/서랍 293×133 vs 신발/가방/액세서리 89×156(폭 3.3배 차이, 같은 컴포넌트). 293px 카드 우측 ~170px 공백. 제목 y좌표는 이번 세션 수정으로 400/400/400 완전 정렬 확인(완료 처리 가능).
  problem: 폭 3.3배를 같은 JSX가 감당 못해 큰 카드는 정보밀도가 낮고 빈 공간만 늘어남.
  priority_guess: P2
  fix: 카드 폭 variant 2종(wide/narrow) 도입, wide는 썸네일 최대 6개 가로 확장. grid-auto-rows 고정으로 행 높이 통일.
  effort: M
  note: 세션 범위 밖 — 백로그.

- screen: 옷장 > 코디 탭 — 캐러셀 컨트롤
  observed: 화살표 41×41px(44px 미달), 카드 세로 중앙 콜라주 위에 위치. 점 인디케이터 6.8×6.8px. 같은 상태를 카운터+화살표+점 3중 표시. reasons 배지가 콜라주 좌상단(어깨선)을 가림.
  problem: 292px 카드 위 흰 반투명 요소 4개가 실제 옷 노출 면적을 절반 이하로 줄임.
  priority_guess: P2
  fix: 화살표·점을 카드 밖 하단 컨트롤 바로 이동(이번 세션에 일부 반영 — 44px 확대 및 카드 밖 이동 완료). reasons 배지도 카드 아래 캡션 줄로 이동(미적용, 백로그). 스와이프 제스처 추가(미적용).
  effort: M
  status: 화살표/점 이동은 이 turn 이전(E2 권고 반영 커밋 69f065d)에 이미 완료. 나머지는 백로그.

- screen: 전역 — 아이콘 언어 이원화
  observed: 옷장 탭 스트립(이모지) vs 하단 네비(라인아이콘) vs 섹션 헤드(혼재) 3계열 공존. 오늘 세션 재설계가 이모지 계열을 오히려 확대(탭 스트립 확대, 히어로 54px 이모지, 섹션 헤드 신규 👗).
  problem: P1-43 "이모지→라인아이콘 통일"이 하단 네비·설정에서만 됐는데, 이번 재설계가 반대 방향으로 확장.
  priority_guess: P2
  fix: "이모지는 사용자 데이터에만, 앱 크롬은 라인아이콘만" 규칙 고정. WARDROBE_SECTION_META.emoji를 LucideIcon 타입으로 교체해 재유입을 컴파일 에러로 차단.
  effort: M
  note: 세션 범위 밖 — 백로그.

## 이번 세션 수정에 대한 판정 (오케스트레이터 요청)
- OutfitCard.tsx 그라데이션 강화+text-shadow(커밋 515270d)는 **미봉책으로 판정** — 스크림 방향/반지 겹침/색 구분 3건 모두 미해결, 대비 실측 실패, 콜라주 가림이라는 새 부작용까지 발생.
- WardrobeView.tsx justify-start(커밋 515270d)는 **유효한 수정으로 확인** — 제목 y좌표 400/400/400 완전 정렬.
- OutfitGrid.tsx 캐러셀 컨트롤 카드 밖 이동(커밋 69f065d)은 **부분 유효** — 그림 가림/터치타깃은 개선, reasons 배지 가림은 별도 미해결.

## 시스템 레벨 우선순위 권고
8건 findings의 공통 뿌리는 globals.css:52 `font-size: 18px`(px 고정)와 @theme inline에 --text-*/--radius-*/--shadow-* 토큰 부재. 개별 화면 수정보다 이 두 가지를 먼저 잡지 않으면 같은 findings가 다음 검토에서 재발.
